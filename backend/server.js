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

const moodQueries = {
  funny: ['comedy', 'sitcom', 'funny'],
  gripping: ['thriller', 'crime', 'mystery'],
  comforting: ['family', 'comedy', 'romance'],
  dark: ['dark', 'crime', 'horror'],
  clever: ['mystery', 'science fiction', 'thriller'],
};

const uniqueById = (items) => {
  const seen = new Set();
  return items.filter((item) => {
    if (!item?.show?.id || seen.has(item.show.id)) return false;
    seen.add(item.show.id);
    return true;
  });
};

async function tvMazeSearch(query) {
  const url = new URL('https://api.tvmaze.com/search/shows');
  url.searchParams.set('q', query);
  const response = await fetch(url, {
    headers: { 'User-Agent': 'ForFlickSakes/1.0' },
  });
  if (!response.ok) throw new Error(`TVMaze search failed: ${response.status}`);
  return response.json();
}

async function tvMazeShow(id) {
  const response = await fetch(`https://api.tvmaze.com/shows/${id}?embed=seasons`, {
    headers: { 'User-Agent': 'ForFlickSakes/1.0' },
  });
  if (!response.ok) throw new Error(`TVMaze show lookup failed: ${response.status}`);
  return response.json();
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
    source: 'TVMaze',
    sourceScore: score,
  };
}

function regionalFallbackUrl(title, region) {
  const country = String(region || 'ZA').toLowerCase();
  return `https://www.justwatch.com/${country}/search?q=${encodeURIComponent(title)}`;
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
    providers: watchmodeKey ? 'Watchmode' : 'regional-search-fallback',
  });
});

app.post('/recommendations', async (request, response) => {
  try {
    const query = String(request.body?.query || '').trim();
    const mood = String(request.body?.mood || '').trim().toLowerCase();
    const terms = [
      query,
      ...(moodQueries[mood] || [mood]),
      'popular',
    ].filter(Boolean).slice(0, 4);

    const batches = await Promise.allSettled(terms.map(tvMazeSearch));
    const raw = uniqueById(
      batches.flatMap((batch) => batch.status === 'fulfilled' ? batch.value : []),
    ).slice(0, 12);

    const enriched = await Promise.all(
      raw.map(async (item) => {
        try {
          const show = await tvMazeShow(item.show.id);
          return toShowItem(show, item.score || 0);
        } catch {
          return toShowItem(item.show, item.score || 0);
        }
      }),
    );

    const ranked = enriched
      .filter((item) => item.poster && item.title)
      .sort((a, b) => {
        const ratingDiff = (b.rating || 0) - (a.rating || 0);
        return Math.abs(ratingDiff) > 0.1
          ? ratingDiff
          : (b.sourceScore || 0) - (a.sourceScore || 0);
      })
      .slice(0, 5);

    response.json({ results: ranked });
  } catch (error) {
    console.error(error);
    response.status(502).json({ error: 'Live catalogue lookup failed.' });
  }
});

app.get('/shows/:id/providers', async (request, response) => {
  try {
    const region = String(request.query.region || 'ZA').toUpperCase();
    const show = await tvMazeShow(request.params.id);
    const fallbackUrl = regionalFallbackUrl(show.name || 'TV show', region);

    if (!watchmodeKey) {
      return response.json({
        verified: false,
        providers: [],
        fallbackUrl,
        attribution: 'TV metadata by TVMaze. Viewing search opens JustWatch.',
      });
    }

    const watchmodeId = await watchmodeTitleId(show.externals?.imdb, show.name);
    const sources = await watchmodeSources(watchmodeId, region);

    const providers = sources
      .filter((source) => source?.name && source?.web_url)
      .map((source) => ({
        name: source.name,
        type: source.type || 'stream',
        webUrl: source.web_url || null,
        iosUrl: source.ios_url || null,
        androidUrl: source.android_url || null,
      }))
      .filter((provider, index, all) =>
        all.findIndex((candidate) =>
          candidate.name === provider.name && candidate.type === provider.type,
        ) === index,
      );

    response.json({
      verified: providers.length > 0,
      providers,
      fallbackUrl,
      attribution: providers.length > 0
        ? 'Streaming availability by Watchmode.'
        : 'TV metadata by TVMaze. Viewing search opens JustWatch.',
    });
  } catch (error) {
    console.error(error);
    response.status(502).json({ error: 'Provider lookup failed.' });
  }
});

app.listen(port, () => {
  console.log(`ForFlickSakes live backend running on http://localhost:${port}`);
});
