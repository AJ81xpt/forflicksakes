import { fileURLToPath } from 'node:url';
import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import { knownMoods, looksLikeTitleLookup, moodLabel, normalizeTitle, parsePrompt as parsePromptV2, scoreMood as scoreMoodV2, scorePrompt as scorePromptV2, showProfile as showProfileV2 } from './recommendation_engine.js';

const app = express();
const port = Number(process.env.PORT || 8080);
const streamingAvailabilityKey = process.env.STREAMING_AVAILABILITY_API_KEY?.trim();

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


const availabilityCache = new Map();
const availabilityInFlight = new Map();
const AVAILABILITY_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const AVAILABILITY_NEGATIVE_TTL_MS = 5 * 60 * 1000;
const AVAILABILITY_STALE_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const availabilityLastVerified = new Map();

const SUPPORTED_AVAILABILITY_REGIONS = new Set([
  'ZA', 'GB', 'US',
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR',
  'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK',
  'SI', 'ES', 'SE',
]);

function availabilityCacheKey(showId, region) {
  return `${showId}:${region}`;
}

function readAvailabilityCache(showId, region) {
  const entry = availabilityCache.get(availabilityCacheKey(showId, region));
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    availabilityCache.delete(availabilityCacheKey(showId, region));
    return null;
  }
  return { ...entry.value, cached: true };
}

function writeAvailabilityCache(showId, region, value, ttlMs = AVAILABILITY_TTL_MS) {
  availabilityCache.set(availabilityCacheKey(showId, region), {
    expiresAt: Date.now() + ttlMs,
    value,
  });
  return value;
}

function rememberVerifiedAvailability(showId, region, value) {
  if (!value?.providers?.length) return value;
  availabilityLastVerified.set(availabilityCacheKey(showId, region), {
    expiresAt: Date.now() + AVAILABILITY_STALE_TTL_MS,
    value: { ...value, cached: false },
  });
  return value;
}

function readLastVerifiedAvailability(showId, region) {
  const key = availabilityCacheKey(showId, region);
  const entry = availabilityLastVerified.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    availabilityLastVerified.delete(key);
    return null;
  }
  return {
    ...entry.value,
    status: 'verified-stale',
    verified: true,
    stale: true,
    message: 'Showing the last verified streaming availability while the provider refreshes.',
  };
}

function availabilityFallback(showId, region, message) {
  const stale = readLastVerifiedAvailability(showId, region);
  if (stale) return stale;
  return {
    region,
    checkedAt: new Date().toISOString(),
    status: 'unconfirmed',
    verified: false,
    providers: [],
    attribution: 'Streaming availability by Streaming Availability API (Movie of the Night).',
    message,
  };
}

function streamingOptionToProvider(option) {
  const service = option?.service || {};
  const link = option?.link || option?.videoLink || service?.homePage || null;
  return {
    name: normalizeProviderName(service?.name || service?.id || 'Provider'),
    type: option?.type || 'subscription',
    webUrl: link,
    iosUrl: link,
    androidUrl: link,
    format: option?.quality || null,
    price: option?.price?.amount ?? null,
  };
}

function dedupeProviders(providers) {
  const grouped = new Map();

  for (const provider of providers) {
    const name = normalizeProviderName(provider.name);
    const type = String(provider.type || 'subscription').toLowerCase();
    const key = `${name.toLowerCase()}|${type}`;
    const normalized = { ...provider, name, type };
    const existing = grouped.get(key);

    if (!existing || (!existing.webUrl && normalized.webUrl)) {
      grouped.set(key, normalized);
    }
  }

  const values = [...grouped.values()];
  const subscriptionBrands = new Set(
    values
      .filter((provider) => provider.type === 'subscription')
      .map((provider) => provider.name.toLowerCase()),
  );

  return values.filter((provider) =>
    !(provider.type === 'addon' && subscriptionBrands.has(provider.name.toLowerCase())),
  );
}

async function streamingAvailabilityShow(imdbId, region) {
  const url = new URL(`https://api.movieofthenight.com/v4/shows/${encodeURIComponent(imdbId)}`);
  url.searchParams.set('country', String(region).toLowerCase());
  url.searchParams.set('series_granularity', 'show');

  const response = await fetch(url, {
    headers: {
      'X-API-Key': streamingAvailabilityKey,
      'Accept': 'application/json',
      'User-Agent': 'ForFlickSakes/2.0',
    },
    signal: AbortSignal.timeout(12000),
  });

  if (response.status === 401 || response.status === 403) return { kind: 'auth' };
  if (response.status === 404) return { kind: 'not-found' };
  if (response.status === 429) return { kind: 'quota' };
  if (!response.ok) {
    const error = new Error(`Streaming Availability API returned ${response.status}`);
    error.status = response.status;
    throw error;
  }

  const data = await response.json();

  console.log('[MOVIE-OF-THE-NIGHT RAW]', JSON.stringify(data, null, 2));

  return { kind: 'ok', data };
}

async function resolveAvailability({ showId, region }) {
  const normalizedRegion = String(region || 'ZA').toUpperCase();
  const cached = readAvailabilityCache(showId, normalizedRegion);
  if (cached) return cached;

  if (!SUPPORTED_AVAILABILITY_REGIONS.has(normalizedRegion)) {
    return writeAvailabilityCache(showId, normalizedRegion, {
      region: normalizedRegion,
      checkedAt: new Date().toISOString(),
      status: 'unsupported-region',
      verified: false,
      providers: [],
      attribution: 'Streaming availability by Streaming Availability API (Movie of the Night).',
      message: 'Streaming availability is not yet supported for this region.',
    }, AVAILABILITY_NEGATIVE_TTL_MS);
  }

  if (!streamingAvailabilityKey) {
    return {
      region: normalizedRegion,
      checkedAt: new Date().toISOString(),
      status: 'not-configured',
      verified: false,
      providers: [],
      attribution: 'Streaming availability by Streaming Availability API (Movie of the Night).',
      message: 'Streaming availability service is not configured.',
    };
  }

  const key = availabilityCacheKey(showId, normalizedRegion);
  if (availabilityInFlight.has(key)) return availabilityInFlight.get(key);

  const task = (async () => {
    const show = await tvMazeShow(showId);
    const imdbId = show?.externals?.imdb;

    if (!imdbId) {
      return writeAvailabilityCache(showId, normalizedRegion, {
        region: normalizedRegion,
        checkedAt: new Date().toISOString(),
        status: 'unconfirmed',
        verified: false,
        providers: [],
        attribution: 'Streaming availability by Streaming Availability API (Movie of the Night).',
        message: 'This title does not have an IMDb identifier, so availability could not be verified.',
      }, AVAILABILITY_NEGATIVE_TTL_MS);
    }

    try {
      const external = await streamingAvailabilityShow(imdbId, normalizedRegion);

      if (external.kind === 'auth') {
        return availabilityFallback(
          showId,
          normalizedRegion,
          'Streaming availability could not be verified because the provider rejected authentication.',
        );
      }

      if (external.kind === 'quota') {
        return availabilityFallback(
          showId,
          normalizedRegion,
          'Streaming availability is temporarily rate limited. Try again shortly.',
        );
      }

      if (external.kind === 'not-found') {
        const result = availabilityFallback(
          showId,
          normalizedRegion,
          `No verified streaming availability was returned for ${normalizedRegion}.`,
        );
        return result.stale
          ? result
          : writeAvailabilityCache(showId, normalizedRegion, result, AVAILABILITY_NEGATIVE_TTL_MS);
      }

      const options = external.data?.streamingOptions?.[normalizedRegion.toLowerCase()]
        || external.data?.streamingOptions?.[normalizedRegion]
        || [];
      const providers = dedupeProviders(
        (Array.isArray(options) ? options : [])
          .map(streamingOptionToProvider)
          .filter((provider) => provider.name && provider.webUrl),
      );

      if (!providers.length) {
        const result = availabilityFallback(
          showId,
          normalizedRegion,
          `Streaming availability could not be verified for ${normalizedRegion}.`,
        );
        return result.stale
          ? result
          : writeAvailabilityCache(showId, normalizedRegion, result, AVAILABILITY_NEGATIVE_TTL_MS);
      }

      const verifiedResult = {
        region: normalizedRegion,
        checkedAt: new Date().toISOString(),
        status: 'verified',
        verified: true,
        providers,
        attribution: 'Streaming availability by Streaming Availability API (Movie of the Night).',
        message: null,
      };
      rememberVerifiedAvailability(showId, normalizedRegion, verifiedResult);
      return writeAvailabilityCache(
        showId,
        normalizedRegion,
        verifiedResult,
        AVAILABILITY_TTL_MS,
      );
    } catch (error) {
      console.error('Streaming availability lookup failed:', error);
      return availabilityFallback(
        showId,
        normalizedRegion,
        'Streaming availability is temporarily unavailable. Try again later.',
      );
    }
  })();

  availabilityInFlight.set(key, task);
  try {
    return await task;
  } finally {
    availabilityInFlight.delete(key);
  }
}

let catalogueCache = { expiresAt: 0, shows: [] };
const feedbackEvents = [];


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

async function tvMazeShowDetails(id) {
  return tvMazeJson(`https://api.tvmaze.com/shows/${id}?embed[]=seasons&embed[]=cast&embed[]=episodes`);
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

function semanticGenreMatch(facts, genre) {
  const normalized = String(genre).toLowerCase();
  if (facts.genres.some((item) => item.toLowerCase() === normalized)) return true;

  const patterns = {
    thriller: /suspense|conspiracy|espionage|danger|hunt|kidnap|hostage|psychological|serial killer|murder|investigation|secret|race against time/,
    mystery: /mystery|detective|investigation|missing|murder|secret|puzzle|whodunnit|twist/,
    crime: /crime|criminal|police|detective|murder|gang|mafia|heist|corruption/,
    comedy: /comedy|sitcom|funny|witty|satire|comic|humou?r/,
    romance: /romance|romantic|love story|relationship/,
    horror: /horror|haunted|supernatural terror|demon|ghost|terrifying/,
    'science-fiction': /science fiction|sci-fi|future|space|technology|dystopian|time travel|alien/,
    fantasy: /fantasy|magic|mythical|witch|wizard|dragon/,
    action: /action|combat|fight|mission|adventure|warrior/,
    drama: /drama|emotional|family conflict|relationship/,
    animation: /animated|animation|anime/,
    family: /family|kids|children|all ages/,
  };
  return patterns[normalized]?.test(facts.haystack) || false;
}

function promptMatchAudit(show, interpretation) {
  const facts = showFacts(show);
  const requiredMatches = interpretation.requiredGenres.filter((genre) =>
    semanticGenreMatch(facts, genre),
  );
  const requiredMisses = interpretation.requiredGenres.filter((genre) =>
    !semanticGenreMatch(facts, genre),
  );
  const passed = requiredMisses.length === 0
    && !(interpretation.maxSeasons && facts.seasons && facts.seasons > interpretation.maxSeasons)
    && !(interpretation.maxRuntime && facts.runtime && facts.runtime > interpretation.maxRuntime)
    && !(interpretation.completedOnly && show.status !== 'Ended')
    && !interpretation.excludedGenres.some((genre) => semanticGenreMatch(facts, genre))
    && !violatesExcludedTerms(facts, interpretation.excludedTerms);
  return { passed, requiredMatches, requiredMisses, facts };
}

function passesPromptFilters(show, interpretation) {
  return promptMatchAudit(show, interpretation).passed;
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
  const audit = promptMatchAudit(show, interpretation);
  const facts = audit.facts;
  let score = 0;

  // Relevance dominates popularity. Ratings only refine already-valid matches.
  score += audit.requiredMatches.length * 18;
  score += Number(show.rating?.average || 0) * 0.8;
  score += Math.min(Number(show.weight || 0), 100) / 80;

  for (const genre of interpretation.referenceGenres || []) {
    if (semanticGenreMatch(facts, genre)) score += 4;
  }
  for (const token of queryTokens(query)) {
    if (facts.title.includes(token)) score += 2;
    else if (facts.haystack.includes(token)) score += 1.1;
  }
  if (interpretation.completedOnly && show.status === 'Ended') score += 5;
  if (interpretation.maxSeasons && facts.seasons && facts.seasons <= interpretation.maxSeasons) score += 3;
  if (interpretation.maxRuntime && facts.runtime && facts.runtime <= interpretation.maxRuntime) score += 3;
  if (!show.image?.medium && !show.image?.original) score -= 12;
  if (!show.summary) score -= 4;
  return score;
}

function promptReasons(show, interpretation) {
  const audit = promptMatchAudit(show, interpretation);
  const reasons = [];
  if (audit.requiredMatches.length) reasons.push(`Required match: ${audit.requiredMatches.join(' / ')}`);
  if (interpretation.completedOnly && show.status === 'Ended') reasons.push('Completed series');
  if (interpretation.maxSeasons && audit.facts.seasons) reasons.push(`Within limit: ${audit.facts.seasons} seasons`);
  if (interpretation.maxRuntime && audit.facts.runtime) reasons.push(`Within limit: ${audit.facts.runtime}-minute episodes`);
  if (interpretation.referenceGenres?.length) reasons.push(`Shares themes with ${interpretation.referenceName || interpretation.referenceTitle}`);
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
    confidence: Math.max(0, Math.min(100, Math.round(score * 3))),
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
    .filter((item) => item.score >= (interpretation.requiredGenres.length ? 16 : 6))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
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



async function enrichReferenceV2(intent) {
  if (!intent.referenceTitle) return intent;
  try {
    const matches = await tvMazeSearch(intent.referenceTitle);
    const reference = matches?.[0]?.show;
    if (reference) {
      intent.referenceName = reference.name;
      intent.referenceGenres = Array.isArray(reference.genres) ? reference.genres : [];
      intent.referenceProfile = showProfileV2(reference);
      intent.labels = intent.labels.map((label) =>
        label.startsWith('Similar to ') ? `Similar to ${reference.name}` : label,
      );
    }
  } catch {
    // Similarity enrichment is optional.
  }
  return intent;
}

async function enrichShowsV2(shows, limit = 32) {
  const selected = shows.slice(0, limit);
  const enriched = await Promise.all(
    selected.map(async (show) => {
      try {
        return await tvMazeShow(show.id);
      } catch {
        return show;
      }
    }),
  );
  return enriched;
}




function levenshteinDistance(a, b) {
  const left = normalizeTitle(a);
  const right = normalizeTitle(b);
  const matrix = Array.from({ length: left.length + 1 }, () => Array(right.length + 1).fill(0));

  for (let i = 0; i <= left.length; i += 1) matrix[i][0] = i;
  for (let j = 0; j <= right.length; j += 1) matrix[0][j] = j;

  for (let i = 1; i <= left.length; i += 1) {
    for (let j = 1; j <= right.length; j += 1) {
      const cost = left[i - 1] === right[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      );
    }
  }
  return matrix[left.length][right.length];
}

function titleSimilarity(query, candidate) {
  const wanted = normalizeTitle(query);
  const actual = normalizeTitle(candidate);
  if (!wanted || !actual) return 0;
  if (wanted === actual) return 1;

  const maxLength = Math.max(wanted.length, actual.length);
  const editScore = maxLength ? 1 - (levenshteinDistance(wanted, actual) / maxLength) : 0;

  const wantedWords = new Set(wanted.split(' ').filter(Boolean));
  const actualWords = new Set(actual.split(' ').filter(Boolean));
  const overlap = [...wantedWords].filter((word) => actualWords.has(word)).length;
  const union = new Set([...wantedWords, ...actualWords]).size || 1;
  const wordScore = overlap / union;

  return Math.max(editScore, wordScore);
}

function conservativeFuzzyTitleMatch(query, shows) {
  const normalized = normalizeTitle(query);
  if (!normalized) return null;

  const ranked = shows
    .filter(Boolean)
    .map((show) => ({ show, similarity: titleSimilarity(query, show.name) }))
    .sort((a, b) => b.similarity - a.similarity);

  const best = ranked[0];
  const second = ranked[1];
  if (!best) return null;

  const minimum = normalized.length <= 5 ? 0.86 : 0.78;
  const margin = second ? best.similarity - second.similarity : 1;

  if (best.similarity < minimum) return null;
  if (second && margin < 0.06 && best.similarity < 0.92) return null;

  return best;
}

function shouldTryDirectTitleLookup(query) {
  const normalized = normalizeTitle(query);
  if (!normalized) return false;

  // Preserve the recommendation engine's own title-intent detection.
  if (looksLikeTitleLookup(query)) return true;

  // A short, title-like phrase should still get a direct catalogue lookup.
  // This is what makes typos such as "Severence" -> "Severance" work.
  const words = normalized.split(' ').filter(Boolean);
  if (words.length > 5 || normalized.length > 70) return false;

  const descriptiveWords = new Set([
    'something', 'show', 'series', 'watch', 'watching', 'want', 'looking',
    'recommend', 'recommendation', 'genre', 'mood', 'funny', 'dark', 'lighter',
    'gripping', 'comforting', 'clever', 'romantic', 'scary', 'short', 'shorter',
    'season', 'seasons', 'episode', 'episodes', 'under', 'maximum', 'max',
    'completed', 'complete', 'finished', 'exclude', 'without', 'like',
  ]);

  const descriptiveCount = words.filter((word) => descriptiveWords.has(word)).length;
  return descriptiveCount === 0;
}

async function exactTitleCandidate(query) {
  if (!shouldTryDirectTitleLookup(query)) return null;

  let searchResults = [];
  try {
    searchResults = await tvMazeSearch(query);
  } catch {
    // We can still try the cached catalogue below.
  }

  const wanted = normalizeTitle(query);
  const searchShows = searchResults.map((item) => item?.show).filter(Boolean);

  let match = searchShows.find((show) => normalizeTitle(show.name) === wanted);
  let reason = 'Exact title match';

  if (!match) {
    const fuzzy = conservativeFuzzyTitleMatch(query, searchShows);
    match = fuzzy?.show || null;
    if (match) reason = `Title match: ${match.name}`;
  }

  // TVMaze search can occasionally rank a typo poorly. For short title-like
  // requests, compare against our cached catalogue as a second pass.
  if (!match) {
    try {
      const catalogue = await catalogueShows();
      const fuzzy = conservativeFuzzyTitleMatch(query, catalogue);
      match = fuzzy?.show || null;
      if (match) reason = `Title match: ${match.name}`;
    } catch {
      // Normal prompt recommendations remain available.
    }
  }

  if (!match) return null;

  let show = match;
  try {
    show = await tvMazeShow(match.id);
  } catch {
    // Search/catalogue payload remains usable.
  }

  return {
    show,
    score: 100,
    reasons: [reason],
  };
}

async function promptCandidatesV2(query, intent) {
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

  // Cheap pre-ranking limits detail calls, then strict filters run against
  // enriched shows where season counts are known.
  const preRanked = [...pool.values()]
    .map((show) => {
      const provisional = scorePromptV2(show, query, {
        ...intent,
        maxSeasons: null,
        maxRuntime: null,
        completedOnly: false,
      });
      return { show, score: provisional.score };
    })
    .sort((a, b) => b.score - a.score)
    .map((item) => item.show);

  const enriched = await enrichShowsV2(preRanked, 36);
  return enriched
    .map((show) => ({ show, ...scorePromptV2(show, query, intent) }))
    .filter((item) => item.passed && item.score >= (intent.requiredGenres.length ? 24 : 8))
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);
}

async function moodCandidatesV2(mood) {
  const catalogue = await catalogueShows();
  const ranked = catalogue
    .map((show) => ({ show, ...scoreMoodV2(show, mood) }))
    .filter((item) => item.passed)
    .sort((a, b) => b.score - a.score)
    .slice(0, 14)
    .map((item) => item.show);
  const enriched = await enrichShowsV2(ranked, 10);
  return enriched
    .map((show) => ({ show, ...scoreMoodV2(show, mood) }))
    .filter((item) => item.passed)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);
}

app.get('/health', (_request, response) => {
  response.json({
    ok: true,
    catalogue: 'TVMaze',
    recommendationModes: ['prompt', 'mood'],
    providers: streamingAvailabilityKey ? 'streaming-availability-api' : 'not-configured',
    feedbackEvents: feedbackEvents.length,
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
      if (!knownMoods().includes(mood)) {
        return response.status(400).json({ error: 'Unknown mood.' });
      }
      interpretation = [`Mood: ${moodLabel(mood)}`];
      candidates = await moodCandidatesV2(mood);
    } else {
      const query = String(request.body?.query || '').trim();
      if (query.length < 3) {
        return response.status(400).json({ error: 'Describe what you want to watch.' });
      }
      const exact = await exactTitleCandidate(query);
      if (exact) {
        interpretation = [`Exact title: ${exact.show.name}`];
        candidates = [exact];
      } else {
        const parsed = await enrichReferenceV2(parsePromptV2(query));
        interpretation = parsed.labels;
        candidates = await promptCandidatesV2(query, parsed);
      }
    }

    response.json({
      mode,
      mood,
      interpretation,
      results: candidates
        .map(({ show, score, reasons }) => toShowItem(show, score, reasons))
        .filter((item) => item.poster && item.title)
        .sort((a, b) => b.recommendationScore - a.recommendationScore)
        .slice(0, 5),
    });
  } catch (error) {
    console.error(error);
    response.status(502).json({ error: 'Live catalogue lookup failed.' });
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

function normalizeProviderName(name = '') {
  const value = String(name).trim();
  if (!value) return value;
  const lower = value.toLowerCase();

  if (
    lower === 'max' ||
    lower === 'hbo max' ||
    lower === 'hbo' ||
    lower.includes('hbo max') ||
    lower.includes('max amazon channel') ||
    lower.includes('max channel')
  ) {
    return 'HBO Max';
  }

  if (lower === 'amazon prime video' || lower === 'prime video') return 'Prime Video';
  if (lower === 'apple tv' || lower === 'apple tv plus' || lower === 'apple tv+') return 'Apple TV+';

  return value;
}


app.get('/shows/:id/details', async (request, response) => {
  try {
    const show = await tvMazeShowDetails(request.params.id);
    const cast = Array.isArray(show?._embedded?.cast)
      ? show._embedded.cast.slice(0, 12).map((entry) => ({
          name: entry?.person?.name || '',
          character: entry?.character?.name || '',
          imageUrl: entry?.person?.image?.medium || entry?.person?.image?.original || '',
        })).filter((entry) => entry.name)
      : [];
    const episodes = Array.isArray(show?._embedded?.episodes) ? show._embedded.episodes : [];
    const network = show?.webChannel?.name || show?.network?.name || '';

    response.json({
      language: show?.language || '',
      type: show?.type || '',
      network,
      premiered: show?.premiered || '',
      ended: show?.ended || '',
      episodeCount: episodes.length,
      cast,
    });
  } catch (error) {
    console.error(error);
    response.status(502).json({ error: 'Show details lookup failed.' });
  }
});

app.post('/availability/cache/clear', (_request, response) => {
  availabilityCache.clear();
  response.json({ ok: true, cleared: true });
});

app.get('/availability/debug', (_request, response) => {
  response.json({
    provider: 'movie-of-the-night',
    configured: Boolean(streamingAvailabilityKey),
    negativeCacheMinutes: Math.round(AVAILABILITY_NEGATIVE_TTL_MS / 60000),
    rememberedVerifiedEntries: availabilityLastVerified.size,
  });
});

app.get('/shows/:id/providers', async (request, response) => {
  try {
    const showId = Number(request.params.id);
    const region = String(request.query.region || 'ZA').toUpperCase();
    if (!Number.isFinite(showId) || showId <= 0) {
      return response.status(400).json({ error: 'Invalid show id.' });
    }
    const result = await resolveAvailability({ showId, region });
    return response.json(result);
  } catch (error) {
    console.error('Provider resolver failed:', error);
    return response.status(500).json({
      region: String(request.query.region || 'ZA').toUpperCase(),
      checkedAt: new Date().toISOString(),
      status: 'error',
      verified: false,
      providers: [],
      attribution: 'Streaming availability by Streaming Availability API (Movie of the Night).',
      message: 'Availability check failed.',
    });
  }
});


app.get('/privacy', (req, res) => {
  res.sendFile(fileURLToPath(new URL('./privacy.html', import.meta.url)));
});
app.listen(port, '0.0.0.0', () => {
  console.log(`ForFlickSakes live backend running on http://localhost:${port}`);
});


