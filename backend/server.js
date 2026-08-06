import 'dotenv/config';
import cors from 'cors';
import express from 'express';

const app = express();
const port = Number(process.env.PORT || 8080);
const watchmodeKey = process.env.WATCHMODE_API_KEY?.trim();

app.use(cors());
app.use(express.json({ limit: '64kb' }));

const stripHtml = (value = '') => value
  .replace(/<[^>]*>/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const yearFromDate = (date) => {
  if (!date || typeof date !== 'string') return 0;
  const year = Number(date.slice(0, 4));
  return Number.isFinite(year) ? year : 0;
};

const moodProfiles = {
  funny: {
    genres: ['Comedy', 'Animation'],
    positive: ['witty', 'funny', 'humour', 'humor', 'satire', 'awkward', 'friends', 'workplace'],
    negative: ['serial killer', 'war', 'torture'],
  },
  gripping: {
    genres: ['Thriller', 'Crime', 'Mystery', 'Action', 'Adventure'],
    positive: ['conspiracy', 'investigation', 'suspense', 'murder', 'secret', 'danger', 'missing'],
    negative: ['reality', 'talk show'],
  },
  comforting: {
    genres: ['Comedy', 'Romance', 'Family', 'Food', 'Travel'],
    positive: ['friendship', 'community', 'heartwarming', 'small town', 'family', 'cooking', 'feel-good', 'kindness', 'home'],
    negative: ['horror', 'serial killer', 'war', 'torture', 'apocalypse'],
  },
  dark: {
    genres: ['Crime', 'Horror', 'Thriller', 'Mystery', 'Supernatural', 'Drama'],
    positive: ['bleak', 'disturbing', 'psychological', 'murder', 'secret', 'dystopian', 'haunted', 'corruption', 'revenge'],
    negative: ['children', 'preschool', 'light-hearted'],
  },
  clever: {
    genres: ['Mystery', 'Science-Fiction', 'Crime', 'Drama', 'Thriller'],
    positive: ['puzzle', 'investigation', 'time', 'conspiracy', 'technology', 'strategy', 'genius', 'experiment'],
    negative: ['reality', 'talk show'],
  },
};

const genericQueryWords = new Set([
  'something', 'show', 'series', 'watch', 'watching', 'please', 'want', 'like',
  'with', 'that', 'this', 'more', 'less', 'season', 'seasons', 'episode',
  'episodes', 'gripping', 'funny', 'comforting', 'dark', 'clever', 'popular',
]);

let catalogueCache = { expiresAt: 0, shows: [] };

async function tvMazeJson(url) {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'ForFlickSakes/1.1' },
  });
  if (!response.ok) throw new Error(`TVMaze request failed: ${response.status}`);
  return response.json();
}

async function tvMazeSearch(query) {
  const url = new URL('https://api.tvmaze.com/search/shows');
  url.searchParams.set('q', query);
  return tvMazeJson(url);
}

async function tvMazeShow(id) {
  return tvMazeJson(`https://api.tvmaze.com/shows/${id}?embed=seasons`);
}

async function catalogueShows() {
  if (catalogueCache.expiresAt > Date.now() && catalogueCache.shows.length) {
    return catalogueCache.shows;
  }

  const pages = await Promise.all(
    [0, 1, 2, 3].map((page) => tvMazeJson(`https://api.tvmaze.com/shows?page=${page}`)),
  );
  const shows = pages.flat().filter((show) => show?.id && show?.name);
  catalogueCache = {
    shows,
    expiresAt: Date.now() + (60 * 60 * 1000),
  };
  return shows;
}

function toShowItem(show, score = 0) {
  const embeddedSeasons = show?._embedded?.seasons;
  return {
    id: show.id,
    title: show.name || 'Untitled',
    year: yearFromDate(show.premiered),
    seasons: Array.isArray(embeddedSeasons) ? embeddedSeasons.length : 0,
    runtime: show.averageRuntime || show.runtime || 0,
    rating: show.rating?.average || 0,
    poster: show.image?.original || show.image?.medium || '',
    summary: stripHtml(show.summary) || 'No summary available.',
    genres: Array.isArray(show.genres) ? show.genres : [],
    imdbId: show.externals?.imdb || null,
    officialUrl: show.officialSite || show.url || null,
    source: 'TVMaze',
    recommendationScore: score,
  };
}

function queryTokens(query) {
  return String(query || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2 && !genericQueryWords.has(word));
}


function parsePrompt(query) {
  const text = String(query || '').toLowerCase();
  const interpretation = {
    maxSeasons: null,
    maxRuntime: null,
    completedOnly: false,
    preferredGenres: [],
    excludedTerms: [],
    referenceTitle: null,
    labels: [],
  };

  const seasonMatch = text.match(/(?:no more than|up to|max(?:imum)?|under|less than)\s+(\d+)\s+seasons?/i);
  if (seasonMatch) {
    interpretation.maxSeasons = Number(seasonMatch[1]);
    interpretation.labels.push(`Up to ${seasonMatch[1]} seasons`);
  }

  const runtimeMatch = text.match(/(?:under|less than|no more than|up to|max(?:imum)?)\s+(\d+)\s*(?:minutes?|mins?)/i);
  if (runtimeMatch) {
    interpretation.maxRuntime = Number(runtimeMatch[1]);
    interpretation.labels.push(`Episodes up to ${runtimeMatch[1]} min`);
  } else if (/short episodes?|quick watch|half[- ]hour/.test(text)) {
    interpretation.maxRuntime = 35;
    interpretation.labels.push('Short episodes');
  }

  if (/completed|finished series|complete story|already ended|no cliffhanger/.test(text)) {
    interpretation.completedOnly = true;
    interpretation.labels.push('Completed series');
  }

  const genreRules = [
    ['Comedy', /comedy|funny|laugh|sitcom|witty/],
    ['Mystery', /mystery|detective|puzzle|whodunnit|investigation/],
    ['Crime', /crime|criminal|police|murder/],
    ['Thriller', /thriller|tense|suspense|gripping/],
    ['Science-Fiction', /sci[- ]?fi|science fiction|space|future|technology/],
    ['Romance', /romance|romantic|love story/],
    ['Fantasy', /fantasy|magic|mythical/],
    ['Horror', /horror|scary|terrifying|haunted/],
    ['Animation', /animated|animation|anime/],
    ['Family', /family friendly|for the family|kids/],
  ];
  for (const [genre, pattern] of genreRules) {
    if (pattern.test(text)) interpretation.preferredGenres.push(genre);
  }
  if (interpretation.preferredGenres.length) {
    interpretation.labels.push(interpretation.preferredGenres.join(' / '));
  }

  const exclusions = [
    ['horror', /(?:no|not|without|avoid)\s+(?:too\s+)?(?:much\s+)?horror|nothing scary|not scary/],
    ['violence', /(?:no|not|without|avoid)\s+(?:too\s+)?(?:much\s+)?violence|not violent/],
    ['dark', /not too dark|nothing bleak|not bleak/],
    ['romance', /(?:no|not|without|avoid)\s+romance/],
    ['comedy', /(?:no|not|without|avoid)\s+comedy/],
    ['slow', /not slow|fast paced|fast-paced/],
  ];
  for (const [term, pattern] of exclusions) {
    if (pattern.test(text)) interpretation.excludedTerms.push(term);
  }
  if (interpretation.excludedTerms.length) {
    interpretation.labels.push(`Avoid ${interpretation.excludedTerms.join(', ')}`);
  }

  const likeMatch = String(query || '').match(/\blike\s+([^,.!?]+?)(?:\s+but\b|\s+with\b|\s+without\b|\s+and\b|$)/i);
  if (likeMatch) {
    const candidate = likeMatch[1].trim().replace(/^(the|a|an)\s+/i, '');
    if (candidate.length >= 2 && candidate.length <= 60) {
      interpretation.referenceTitle = candidate;
      interpretation.labels.push(`Similar to ${candidate}`);
    }
  }

  if (!interpretation.labels.length && String(query || '').trim()) {
    interpretation.labels.push('Natural-language request applied');
  }
  return interpretation;
}

async function enrichInterpretation(interpretation) {
  if (!interpretation.referenceTitle) return interpretation;
  try {
    const matches = await tvMazeSearch(interpretation.referenceTitle);
    const reference = matches?.[0]?.show;
    if (reference?.genres?.length) {
      interpretation.referenceGenres = reference.genres;
      interpretation.referenceName = reference.name;
      interpretation.labels = interpretation.labels.map((label) =>
        label.startsWith('Similar to ') ? `Similar to ${reference.name}` : label,
      );
    }
  } catch {
    // Reference matching is an enhancement; normal ranking still works.
  }
  return interpretation;
}

function scoreShow(show, mood, query, interpretation) {
  const profile = moodProfiles[mood] || moodProfiles.gripping;
  const genres = Array.isArray(show.genres) ? show.genres : [];
  const title = String(show.name || '').toLowerCase();
  const summary = stripHtml(show.summary || '').toLowerCase();
  const haystack = `${title} ${summary} ${genres.join(' ').toLowerCase()}`;

  let score = Number(show.rating?.average || 0) * 0.9;
  score += Math.min(Number(show.weight || 0), 100) / 35;

  for (const genre of profile.genres) {
    if (genres.some((item) => item.toLowerCase() === genre.toLowerCase())) score += 4;
  }
  for (const keyword of profile.positive) {
    if (haystack.includes(keyword)) score += 1.5;
  }
  for (const keyword of profile.negative) {
    if (haystack.includes(keyword)) score -= 4;
  }
  for (const token of queryTokens(query)) {
    if (title.includes(token)) score += 3;
    else if (haystack.includes(token)) score += 1.4;
  }

  for (const genre of interpretation?.preferredGenres || []) {
    if (genres.some((item) => item.toLowerCase() === genre.toLowerCase())) score += 5;
  }
  for (const genre of interpretation?.referenceGenres || []) {
    if (genres.some((item) => item.toLowerCase() === String(genre).toLowerCase())) score += 3;
  }
  for (const term of interpretation?.excludedTerms || []) {
    if (term === 'horror' && genres.includes('Horror')) score -= 12;
    if (term === 'romance' && genres.includes('Romance')) score -= 10;
    if (term === 'comedy' && genres.includes('Comedy')) score -= 10;
    if (term === 'dark' && /bleak|disturbing|grim|dystopian|murder|horror/.test(haystack)) score -= 8;
    if (term === 'violence' && /violent|violence|war|murder|killer|combat/.test(haystack)) score -= 8;
    if (term === 'slow' && /slow burn|slow-paced|meditative/.test(haystack)) score -= 5;
  }

  if (!show.image?.medium && !show.image?.original) score -= 8;
  if (!show.summary) score -= 2;
  return score;
}

async function candidateShows(query, mood, interpretation) {
  const catalogue = await catalogueShows();
  const eligibleCatalogue = catalogue.filter((show) => {
    const seasonCount = Number(show?._embedded?.seasons?.length || 0);
    const runtime = Number(show.averageRuntime || show.runtime || 0);
    if (interpretation?.maxSeasons && seasonCount && seasonCount > interpretation.maxSeasons) return false;
    if (interpretation?.maxRuntime && runtime && runtime > interpretation.maxRuntime) return false;
    if (interpretation?.completedOnly && show.status !== 'Ended') return false;
    return true;
  });

  const rankedCatalogue = eligibleCatalogue
    .map((show) => ({ show, score: scoreShow(show, mood, query, interpretation) }))
    .filter((item) => item.score > 4)
    .sort((a, b) => b.score - a.score)
    .slice(0, 24);

  const cleaned = queryTokens(query).slice(0, 5).join(' ');
  let searchMatches = [];
  if (cleaned) {
    try {
      searchMatches = (await tvMazeSearch(cleaned)).map((item) => ({
        show: item.show,
        score: scoreShow(item.show, mood, query, interpretation) + Number(item.score || 0),
      }));
    } catch {
      searchMatches = [];
    }
  }

  const byId = new Map();
  for (const item of [...rankedCatalogue, ...searchMatches]) {
    const current = byId.get(item.show.id);
    if (!current || item.score > current.score) byId.set(item.show.id, item);
  }
  return [...byId.values()].sort((a, b) => b.score - a.score).slice(0, 10);
}

async function watchmodeTitleId(imdbId, title) {
  if (!watchmodeKey) return null;
  const url = new URL('https://api.watchmode.com/v1/search/');
  url.searchParams.set('apiKey', watchmodeKey);
  url.searchParams.set('search_field', imdbId ? 'imdb_id' : 'name');
  url.searchParams.set('search_value', imdbId || title);
  const response = await fetch(url);
  if (!response.ok) return null;
  const data = await response.json();
  return data?.title_results?.[0]?.id || null;
}

async function watchmodeSources(titleId, region) {
  if (!watchmodeKey || !titleId) return [];
  const url = new URL(`https://api.watchmode.com/v1/title/${titleId}/sources/`);
  url.searchParams.set('apiKey', watchmodeKey);
  url.searchParams.set('regions', region || 'ZA');
  const response = await fetch(url);
  if (!response.ok) return [];
  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

app.get('/health', (_request, response) => {
  response.json({
    ok: true,
    catalogue: 'TVMaze',
    providers: watchmodeKey ? 'Watchmode' : 'not-configured',
  });
});

app.post('/recommendations', async (request, response) => {
  try {
    const query = String(request.body?.query || '').trim();
    const mood = String(request.body?.mood || 'gripping').trim().toLowerCase();
    const interpretation = await enrichInterpretation(parsePrompt(query));
    const candidates = await candidateShows(query, mood, interpretation);

    const enriched = await Promise.all(
      candidates.slice(0, 7).map(async ({ show, score }) => {
        try {
          return toShowItem(await tvMazeShow(show.id), score);
        } catch {
          return toShowItem(show, score);
        }
      }),
    );

    response.json({
      mood,
      interpretation: interpretation.labels,
      results: enriched
        .filter((item) => item.poster && item.title)
        .sort((a, b) => b.recommendationScore - a.recommendationScore)
        .slice(0, 5),
    });
  } catch (error) {
    console.error(error);
    response.status(502).json({ error: 'Live catalogue lookup failed.' });
  }
});

app.get('/shows/:id/providers', async (request, response) => {
  try {
    const region = String(request.query.region || 'ZA').toUpperCase();
    const show = await tvMazeShow(request.params.id);

    if (!watchmodeKey) {
      return response.json({
        verified: false,
        providers: [],
        attribution: 'TV metadata by TVMaze.',
        message: 'Add a Watchmode API key to show verified streaming services and direct links.',
      });
    }

    const watchmodeId = await watchmodeTitleId(show.externals?.imdb, show.name);
    const sources = await watchmodeSources(watchmodeId, region);

    const providers = sources
      .filter((source) => source?.name && (source?.web_url || source?.ios_url || source?.android_url))
      .map((source) => ({
        name: source.name,
        type: source.type || 'stream',
        webUrl: source.web_url || null,
        iosUrl: source.ios_url || null,
        androidUrl: source.android_url || null,
        format: source.format || null,
        price: source.price ?? null,
      }))
      .filter((provider, index, all) =>
        all.findIndex((candidate) =>
          candidate.name === provider.name && candidate.type === provider.type,
        ) === index,
      );

    response.json({
      verified: providers.length > 0,
      providers,
      attribution: 'Streaming availability and links by Watchmode.',
      message: providers.length
        ? null
        : `No verified streaming option was returned for ${region}.`,
    });
  } catch (error) {
    console.error(error);
    response.status(502).json({ error: 'Provider lookup failed.' });
  }
});

app.listen(port, () => {
  console.log(`ForFlickSakes live backend running on http://localhost:${port}`);
});
