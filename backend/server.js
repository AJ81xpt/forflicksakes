import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import {
  moodProfiles,
  parsePrompt,
  queryTokens,
  rankMoodShows,
  rankPromptShows,
} from './recommendation_engine.js';

const app = express();
const port = Number(process.env.PORT || 8080);
const watchmodeKey = process.env.WATCHMODE_API_KEY?.trim();
const cataloguePages = Math.max(2, Math.min(20, Number(process.env.TVMAZE_PAGES || 8)));
const catalogueTtlMs = Math.max(5, Number(process.env.CATALOGUE_CACHE_MINUTES || 60)) * 60 * 1000;

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

let catalogueCache = { expiresAt: 0, shows: [], loading: null };
const detailCache = new Map();
const feedbackEvents = [];

async function fetchJson(url, timeoutMs = 12000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'ForFlickSakes/1.0' },
    });
    if (!response.ok) throw new Error(`Request failed: ${response.status}`);
    return response.json();
  } finally {
    clearTimeout(timer);
  }
}

async function tvMazeSearch(query) {
  const url = new URL('https://api.tvmaze.com/search/shows');
  url.searchParams.set('q', query);
  return fetchJson(url);
}

async function tvMazeShow(id) {
  const cached = detailCache.get(Number(id));
  if (cached?.expiresAt > Date.now()) return cached.show;
  const show = await fetchJson(`https://api.tvmaze.com/shows/${id}?embed=seasons`);
  detailCache.set(Number(id), { show, expiresAt: Date.now() + 6 * 60 * 60 * 1000 });
  return show;
}

async function loadCatalogue() {
  const pages = [];
  for (let start = 0; start < cataloguePages; start += 4) {
    const batch = await Promise.all(
      Array.from({ length: Math.min(4, cataloguePages - start) }, (_, index) =>
        fetchJson(`https://api.tvmaze.com/shows?page=${start + index}`),
      ),
    );
    pages.push(...batch);
  }
  const shows = pages.flat().filter((show) => show?.id && show?.name);
  catalogueCache = {
    shows,
    expiresAt: Date.now() + catalogueTtlMs,
    loading: null,
  };
  return shows;
}

async function catalogueShows() {
  if (catalogueCache.expiresAt > Date.now() && catalogueCache.shows.length) {
    return catalogueCache.shows;
  }
  if (!catalogueCache.loading) {
    catalogueCache.loading = loadCatalogue().catch((error) => {
      catalogueCache.loading = null;
      throw error;
    });
  }
  return catalogueCache.loading;
}

async function enrichReference(intent) {
  if (!intent.referenceTitle) return intent;
  try {
    const matches = await tvMazeSearch(intent.referenceTitle);
    const reference = matches?.[0]?.show;
    if (reference?.genres?.length) {
      intent.referenceGenres = reference.genres;
      intent.referenceName = reference.name;
      intent.labels = intent.labels.map((label) =>
        label.startsWith('Similar to ') ? `Similar to ${reference.name}` : label,
      );
    }
  } catch {
    // Similarity is optional. Hard constraints continue to work.
  }
  return intent;
}

function toShowItem(show, evaluation) {
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
    recommendationScore: evaluation.score,
    confidence: evaluation.confidence,
    matchReasons: evaluation.reasons,
  };
}

async function promptCandidates(query, intent) {
  const catalogue = await catalogueShows();
  const pool = new Map(catalogue.map((show) => [show.id, show]));
  const cleaned = queryTokens(query).slice(0, 6).join(' ');
  if (cleaned) {
    try {
      for (const item of await tvMazeSearch(cleaned)) {
        if (item?.show?.id) pool.set(item.show.id, item.show);
      }
    } catch {
      // Cached catalogue remains available.
    }
  }
  return rankPromptShows([...pool.values()], query, intent, 10);
}

async function moodCandidates(mood) {
  return rankMoodShows(await catalogueShows(), mood, 12);
}

async function watchmodeTitleId(imdbId, title) {
  if (!watchmodeKey) return null;
  const url = new URL('https://api.watchmode.com/v1/search/');
  url.searchParams.set('apiKey', watchmodeKey);
  url.searchParams.set('search_field', imdbId ? 'imdb_id' : 'name');
  url.searchParams.set('search_value', imdbId || title);
  const data = await fetchJson(url, 10000);
  return data?.title_results?.[0]?.id || null;
}

async function watchmodeSources(titleId, region) {
  if (!watchmodeKey || !titleId) return [];
  const url = new URL(`https://api.watchmode.com/v1/title/${titleId}/sources/`);
  url.searchParams.set('apiKey', watchmodeKey);
  url.searchParams.set('regions', region || 'ZA');
  const data = await fetchJson(url, 10000);
  return Array.isArray(data) ? data : [];
}

app.get('/health', (_request, response) => {
  response.json({
    ok: true,
    catalogue: 'TVMaze',
    cachedShows: catalogueCache.shows.length,
    recommendationModes: ['prompt', 'mood'],
    providers: watchmodeKey ? 'Watchmode' : 'not-configured',
    feedbackEvents: feedbackEvents.length,
  });
});

app.post('/recommendations', async (request, response) => {
  try {
    const mode = String(request.body?.mode || 'prompt').trim().toLowerCase();
    if (!['prompt', 'mood'].includes(mode)) {
      return response.status(400).json({ error: 'mode must be prompt or mood.' });
    }

    let ranked;
    let interpretation;
    let mood = null;

    if (mode === 'mood') {
      mood = String(request.body?.mood || '').trim().toLowerCase();
      if (!moodProfiles[mood]) return response.status(400).json({ error: 'Unknown mood.' });
      interpretation = [`Mood: ${moodProfiles[mood].label}`];
      ranked = await moodCandidates(mood);
    } else {
      const query = String(request.body?.query || '').trim();
      if (query.length < 3) return response.status(400).json({ error: 'Describe what you want to watch.' });
      const intent = await enrichReference(parsePrompt(query));
      interpretation = intent.labels;
      ranked = await promptCandidates(query, intent);
    }

    const enriched = await Promise.all(
      ranked.slice(0, 8).map(async ({ show, evaluation }) => {
        try {
          return toShowItem(await tvMazeShow(show.id), evaluation);
        } catch {
          return toShowItem(show, evaluation);
        }
      }),
    );

    return response.json({
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
    return response.status(502).json({ error: 'Live catalogue lookup failed.' });
  }
});

app.post('/feedback', (request, response) => {
  const event = {
    at: new Date().toISOString(),
    type: String(request.body?.type || 'general'),
    reason: String(request.body?.reason || '').slice(0, 120),
    showId: Number(request.body?.showId || 0) || null,
    mode: String(request.body?.mode || ''),
    mood: String(request.body?.mood || ''),
    query: String(request.body?.query || '').slice(0, 300),
    resultIds: Array.isArray(request.body?.resultIds)
      ? request.body.resultIds.map(Number).filter(Number.isFinite).slice(0, 10)
      : [],
  };
  feedbackEvents.push(event);
  if (feedbackEvents.length > 500) feedbackEvents.shift();
  response.status(202).json({ ok: true });
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

    return response.json({
      verified: providers.length > 0,
      providers,
      attribution: 'Streaming availability and links by Watchmode.',
      message: providers.length ? null : `No verified streaming option was returned for ${region}.`,
    });
  } catch (error) {
    console.error(error);
    return response.status(502).json({ error: 'Provider lookup failed.' });
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`ForFlickSakes live backend running on http://localhost:${port}`);
  catalogueShows().catch((error) => console.warn('Catalogue warm-up failed:', error.message));
});
