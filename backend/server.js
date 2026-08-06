import 'dotenv/config';
import cors from 'cors';
import express from 'express';

const app = express();
const port = Number(process.env.PORT || 8080);
const watchmodeKey = process.env.WATCHMODE_API_KEY?.trim();

app.use(cors());
app.use(express.json({ limit: '64kb' }));

const stripHtml = (value = '') => String(value)
  .replace(/<[^>]*>/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const yearFromDate = (date) => {
  if (!date || typeof date !== 'string') return 0;
  const year = Number(date.slice(0, 4));
  return Number.isFinite(year) ? year : 0;
};

const moodProfiles = {
  gripping: {
    label: 'Gripping',
    genres: ['Thriller', 'Crime', 'Mystery', 'Action', 'Adventure'],
    positive: ['conspiracy', 'investigation', 'suspense', 'murder', 'secret', 'danger', 'missing', 'kidnap', 'spy', 'espionage', 'hunt'],
    negative: ['reality', 'talk show', 'preschool'],
  },
  funny: {
    label: 'Funny',
    genres: ['Comedy'],
    positive: ['witty', 'funny', 'humour', 'humor', 'satire', 'awkward', 'friends', 'workplace', 'sitcom', 'comic'],
    negative: ['serial killer', 'torture', 'war', 'bleak'],
  },
  comforting: {
    label: 'Comforting',
    genres: ['Comedy', 'Romance', 'Family'],
    positive: ['friendship', 'community', 'heartwarming', 'small town', 'cooking', 'feel-good', 'kindness', 'home', 'warm', 'cozy', 'cosy', 'uplifting'],
    negative: ['horror', 'serial killer', 'war', 'torture', 'apocalypse', 'bleak', 'disturbing'],
  },
  dark: {
    label: 'Dark',
    genres: ['Crime', 'Horror', 'Thriller', 'Mystery', 'Drama'],
    positive: ['bleak', 'disturbing', 'psychological', 'murder', 'secret', 'dystopian', 'haunted', 'corruption', 'revenge', 'grim', 'noir'],
    negative: ['preschool', 'light-hearted', 'feel-good'],
  },
  clever: {
    label: 'Clever',
    genres: ['Mystery', 'Science-Fiction', 'Crime', 'Drama', 'Thriller'],
    positive: ['puzzle', 'investigation', 'time', 'conspiracy', 'technology', 'strategy', 'genius', 'experiment', 'twist', 'mind'],
    negative: ['reality', 'talk show', 'preschool'],
  },
};

const genreRules = [
  ['Comedy', /\b(comedy|funny|laugh|sitcom|witty|humou?r)\b/i],
  ['Mystery', /\b(mystery|detective|puzzle|whodunnit|investigation|twists?)\b/i],
  ['Crime', /\b(crime|criminal|police|murder|gangster)\b/i],
  ['Thriller', /\b(thriller|tense|suspense|gripping|conspiracy|espionage)\b/i],
  ['Science-Fiction', /\b(sci[- ]?fi|science fiction|space|future|technology|dystopian)\b/i],
  ['Romance', /\b(romance|romantic|love story)\b/i],
  ['Fantasy', /\b(fantasy|magic|mythical)\b/i],
  ['Horror', /\b(horror|scary|terrifying|haunted)\b/i],
  ['Animation', /\b(animated|animation|anime)\b/i],
  ['Family', /\b(family friendly|for the family|kids)\b/i],
  ['Drama', /\b(drama|dramatic|emotional)\b/i],
  ['Action', /\b(action|fight|combat|adventure)\b/i],
];

const genericQueryWords = new Set([
  'something', 'show', 'series', 'watch', 'watching', 'please', 'want', 'like',
  'with', 'that', 'this', 'more', 'less', 'season', 'seasons', 'episode',
  'episodes', 'popular', 'good', 'great', 'really', 'very', 'under', 'than',
]);

let catalogueCache = { expiresAt: 0, shows: [] };

async function tvMazeJson(url) {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'ForFlickSakes/2.0' },
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
    [0, 1, 2, 3, 4, 5, 6, 7].map((page) =>
      tvMazeJson(`https://api.tvmaze.com/shows?page=${page}`),
    ),
  );
  const shows = pages.flat().filter((show) => show?.id && show?.name);
  catalogueCache = { shows, expiresAt: Date.now() + (60 * 60 * 1000) };
  return shows;
}

function queryTokens(query) {
  return String(query || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2 && !genericQueryWords.has(word));
}

function parsePrompt(query) {
  const raw = String(query || '').trim();
  const text = raw.toLowerCase();
  const result = {
    maxSeasons: null,
    maxRuntime: null,
    completedOnly: false,
    requiredGenres: [],
    excludedGenres: [],
    excludedTerms: [],
    referenceTitle: null,
    referenceGenres: [],
    labels: [],
  };

  const seasonMatch = text.match(/(?:no more than|up to|max(?:imum)?|under|less than)\s+(\d+)\s+seasons?/i);
  if (seasonMatch) {
    result.maxSeasons = Number(seasonMatch[1]);
    result.labels.push(`Maximum ${seasonMatch[1]} seasons`);
  }

  const runtimeMatch = text.match(/(?:under|less than|no more than|up to|max(?:imum)?)\s+(\d+)\s*(?:minutes?|mins?)/i);
  if (runtimeMatch) {
    result.maxRuntime = Number(runtimeMatch[1]);
    result.labels.push(`Episodes up to ${runtimeMatch[1]} min`);
  } else if (/short episodes?|quick watch|half[- ]hour/.test(text)) {
    result.maxRuntime = 35;
    result.labels.push('Short episodes');
  }

  if (/completed|finished series|complete story|already ended|no cliffhanger/.test(text)) {
    result.completedOnly = true;
    result.labels.push('Completed series');
  }

  for (const [genre, pattern] of genreRules) {
    if (pattern.test(raw)) result.requiredGenres.push(genre);
  }
  result.requiredGenres = [...new Set(result.requiredGenres)];

  const genreExclusions = [
    ['Horror', /(?:no|not|without|avoid)\s+(?:too\s+)?(?:much\s+)?horror|nothing scary|not scary/i],
    ['Romance', /(?:no|not|without|avoid)\s+romance/i],
    ['Comedy', /(?:no|not|without|avoid)\s+comedy|not funny/i],
    ['Animation', /(?:no|not|without|avoid)\s+(?:animation|animated|anime)/i],
    ['Reality', /(?:no|not|without|avoid)\s+reality/i],
  ];
  for (const [genre, pattern] of genreExclusions) {
    if (pattern.test(raw)) result.excludedGenres.push(genre);
  }

  const termExclusions = [
    ['dark', /not too dark|nothing bleak|not bleak/i],
    ['violence', /(?:no|not|without|avoid)\s+(?:too\s+)?(?:much\s+)?violence|not violent/i],
    ['slow', /not slow|fast paced|fast-paced/i],
  ];
  for (const [term, pattern] of termExclusions) {
    if (pattern.test(raw)) result.excludedTerms.push(term);
  }

  // Remove genres that were only mentioned as exclusions.
  result.requiredGenres = result.requiredGenres.filter(
    (genre) => !result.excludedGenres.includes(genre),
  );

  if (result.requiredGenres.length) {
    result.labels.push(`Required: ${result.requiredGenres.join(' / ')}`);
  }
  if (result.excludedGenres.length) {
    result.labels.push(`Exclude: ${result.excludedGenres.join(' / ')}`);
  }
  if (result.excludedTerms.length) {
    result.labels.push(`Avoid: ${result.excludedTerms.join(', ')}`);
  }

  const likeMatch = raw.match(/\blike\s+([^,.!?]+?)(?:\s+but\b|\s+with\b|\s+without\b|\s+and\b|$)/i);
  if (likeMatch) {
    const candidate = likeMatch[1].trim().replace(/^(the|a|an)\s+/i, '');
    if (candidate.length >= 2 && candidate.length <= 60) {
      result.referenceTitle = candidate;
      result.labels.push(`Similar to ${candidate}`);
    }
  }

  if (!result.labels.length && raw) result.labels.push('Natural-language request applied');
  return result;
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
    // Similarity is optional; strict prompt filters still apply.
  }
  return interpretation;
}

function showFacts(show) {
  const genres = Array.isArray(show.genres) ? show.genres : [];
  const summary = stripHtml(show.summary || '').toLowerCase();
  const title = String(show.name || '').toLowerCase();
  const haystack = `${title} ${summary} ${genres.join(' ').toLowerCase()}`;
  const seasons = Number(show?._embedded?.seasons?.length || 0);
  const runtime = Number(show.averageRuntime || show.runtime || 0);
  return { genres, summary, title, haystack, seasons, runtime };
}

function violatesExcludedTerms(facts, terms) {
  for (const term of terms || []) {
    if (term === 'dark' && /bleak|disturbing|grim|dystopian|murder|horror|serial killer/.test(facts.haystack)) return true;
    if (term === 'violence' && /violent|violence|war|murder|killer|combat|torture/.test(facts.haystack)) return true;
    if (term === 'slow' && /slow burn|slow-paced|meditative/.test(facts.haystack)) return true;
  }
  return false;
}

function passesPromptFilters(show, interpretation) {
  const facts = showFacts(show);
  if (interpretation.maxSeasons && facts.seasons && facts.seasons > interpretation.maxSeasons) return false;
  if (interpretation.maxRuntime && facts.runtime && facts.runtime > interpretation.maxRuntime) return false;
  if (interpretation.completedOnly && show.status !== 'Ended') return false;
  if (interpretation.excludedGenres.some((genre) => facts.genres.includes(genre))) return false;
  if (violatesExcludedTerms(facts, interpretation.excludedTerms)) return false;

  // Explicit requested genres are hard requirements. A result must match at least one.
  if (interpretation.requiredGenres.length) {
    const matchesRequired = interpretation.requiredGenres.some((genre) =>
      facts.genres.some((item) => item.toLowerCase() === genre.toLowerCase()),
    );
    if (!matchesRequired) return false;
  }
  return true;
}

function moodRelevance(show, mood) {
  const profile = moodProfiles[mood];
  if (!profile) return { relevant: false, score: 0, reasons: [] };
  const facts = showFacts(show);
  const genreMatches = profile.genres.filter((genre) =>
    facts.genres.some((item) => item.toLowerCase() === genre.toLowerCase()),
  );
  const keywordMatches = profile.positive.filter((word) => facts.haystack.includes(word));
  const negativeMatches = profile.negative.filter((word) => facts.haystack.includes(word));
  const relevant = genreMatches.length > 0 || keywordMatches.length >= 2;
  const score = genreMatches.length * 5 + keywordMatches.length * 1.8 - negativeMatches.length * 5;
  const reasons = [
    ...genreMatches.slice(0, 2).map((genre) => `${genre} tone`),
    ...keywordMatches.slice(0, 2).map((word) => `${word} themes`),
  ];
  return { relevant, score, reasons };
}

function promptScore(show, query, interpretation) {
  const facts = showFacts(show);
  let score = Number(show.rating?.average || 0) * 1.2;
  score += Math.min(Number(show.weight || 0), 100) / 45;

  for (const genre of interpretation.requiredGenres) {
    if (facts.genres.some((item) => item.toLowerCase() === genre.toLowerCase())) score += 7;
  }
  for (const genre of interpretation.referenceGenres || []) {
    if (facts.genres.some((item) => item.toLowerCase() === String(genre).toLowerCase())) score += 3;
  }
  for (const token of queryTokens(query)) {
    if (facts.title.includes(token)) score += 2.2;
    else if (facts.haystack.includes(token)) score += 0.8;
  }
  if (!show.image?.medium && !show.image?.original) score -= 8;
  if (!show.summary) score -= 2;
  return score;
}

function promptReasons(show, interpretation) {
  const facts = showFacts(show);
  const reasons = [];
  const matchedGenres = interpretation.requiredGenres.filter((genre) =>
    facts.genres.some((item) => item.toLowerCase() === genre.toLowerCase()),
  );
  if (matchedGenres.length) reasons.push(`Matches ${matchedGenres.join(' / ')}`);
  if (interpretation.completedOnly && show.status === 'Ended') reasons.push('Completed series');
  if (interpretation.maxSeasons && facts.seasons) reasons.push(`${facts.seasons} seasons`);
  if (interpretation.maxRuntime && facts.runtime) reasons.push(`${facts.runtime}-minute episodes`);
  if (interpretation.referenceGenres?.length) reasons.push(`Shares genres with ${interpretation.referenceName || interpretation.referenceTitle}`);
  if (show.rating?.average) reasons.push(`Rated ${show.rating.average}/10`);
  return reasons.slice(0, 5);
}

function moodReasons(show, mood, moodInfo) {
  const reasons = [`Mood: ${moodProfiles[mood].label}`, ...moodInfo.reasons];
  if (show.rating?.average) reasons.push(`Rated ${show.rating.average}/10`);
  return reasons.slice(0, 5);
}

function toShowItem(show, score = 0, matchReasons = []) {
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
    status: show.status || '',
    imdbId: show.externals?.imdb || null,
    officialUrl: show.officialSite || show.url || null,
    source: 'TVMaze',
    recommendationScore: score,
    matchReasons,
  };
}

async function promptCandidates(query, interpretation) {
  const catalogue = await catalogueShows();
  const pool = new Map(catalogue.map((show) => [show.id, show]));
  const cleaned = queryTokens(query).slice(0, 6).join(' ');
  if (cleaned) {
    try {
      for (const item of await tvMazeSearch(cleaned)) {
        if (item?.show?.id) pool.set(item.show.id, item.show);
      }
    } catch {
      // Catalogue remains available.
    }
  }

  return [...pool.values()]
    .filter((show) => passesPromptFilters(show, interpretation))
    .map((show) => ({
      show,
      score: promptScore(show, query, interpretation),
      reasons: promptReasons(show, interpretation),
    }))
    .filter((item) => item.score > 3)
    .sort((a, b) => b.score - a.score)
    .slice(0, 12);
}

async function moodCandidates(mood) {
  const catalogue = await catalogueShows();
  return catalogue
    .map((show) => {
      const info = moodRelevance(show, mood);
      const base = Number(show.rating?.average || 0) * 1.1 + Math.min(Number(show.weight || 0), 100) / 45;
      return { show, info, score: base + info.score };
    })
    .filter((item) => item.info.relevant && item.score > 5)
    .sort((a, b) => b.score - a.score)
    .slice(0, 12)
    .map((item) => ({
      show: item.show,
      score: item.score,
      reasons: moodReasons(item.show, mood, item.info),
    }));
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
    recommendationModes: ['prompt', 'mood'],
    providers: watchmodeKey ? 'Watchmode' : 'not-configured',
  });
});

app.post('/recommendations', async (request, response) => {
  try {
    const mode = String(request.body?.mode || 'prompt').trim().toLowerCase();
    if (!['prompt', 'mood'].includes(mode)) {
      return response.status(400).json({ error: 'mode must be prompt or mood.' });
    }

    let candidates;
    let interpretation;
    let mood = null;

    if (mode === 'mood') {
      mood = String(request.body?.mood || '').trim().toLowerCase();
      if (!moodProfiles[mood]) {
        return response.status(400).json({ error: 'Unknown mood.' });
      }
      interpretation = [`Mood: ${moodProfiles[mood].label}`];
      candidates = await moodCandidates(mood);
    } else {
      const query = String(request.body?.query || '').trim();
      if (query.length < 3) {
        return response.status(400).json({ error: 'Describe what you want to watch.' });
      }
      const parsed = await enrichInterpretation(parsePrompt(query));
      interpretation = parsed.labels;
      candidates = await promptCandidates(query, parsed);
    }

    const enriched = await Promise.all(
      candidates.slice(0, 8).map(async ({ show, score, reasons }) => {
        try {
          return toShowItem(await tvMazeShow(show.id), score, reasons);
        } catch {
          return toShowItem(show, score, reasons);
        }
      }),
    );

    response.json({
      mode,
      mood,
      interpretation,
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
        message: 'Verified streaming availability is not configured yet.',
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
        all.findIndex((candidate) => candidate.name === provider.name && candidate.type === provider.type) === index,
      );

    response.json({
      verified: providers.length > 0,
      providers,
      attribution: 'Streaming availability and links by Watchmode.',
      message: providers.length ? null : `No verified streaming option was returned for ${region}.`,
    });
  } catch (error) {
    console.error(error);
    response.status(502).json({ error: 'Provider lookup failed.' });
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`ForFlickSakes live backend running on http://localhost:${port}`);
});
