const stripHtml = (value = '') => String(value)
  .replace(/<[^>]*>/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const genericQueryWords = new Set([
  'something', 'show', 'series', 'watch', 'watching', 'please', 'want', 'like',
  'with', 'that', 'this', 'more', 'less', 'season', 'seasons', 'episode',
  'episodes', 'popular', 'good', 'great', 'really', 'very', 'under', 'than',
  'find', 'give', 'recommend', 'recommendation', 'tonight', 'kind', 'type',
]);

export const moodProfiles = {
  gripping: {
    label: 'Gripping',
    requiredAnyGenres: ['Thriller', 'Crime', 'Mystery', 'Action', 'Adventure'],
    positive: ['conspiracy', 'investigation', 'suspense', 'murder', 'secret', 'danger', 'missing', 'kidnap', 'spy', 'espionage', 'hunt', 'hostage', 'race against time'],
    negative: ['reality', 'talk show', 'preschool', 'makeover', 'cooking competition'],
    minimumEvidence: 2,
  },
  funny: {
    label: 'Funny',
    requiredAnyGenres: ['Comedy'],
    positive: ['witty', 'funny', 'humour', 'humor', 'satire', 'awkward', 'friends', 'workplace', 'sitcom', 'comic'],
    negative: ['serial killer', 'torture', 'war', 'bleak', 'disturbing'],
    minimumEvidence: 1,
  },
  comforting: {
    label: 'Comforting',
    requiredAnyGenres: ['Comedy', 'Romance', 'Family'],
    positive: ['friendship', 'community', 'heartwarming', 'small town', 'cooking', 'feel-good', 'kindness', 'home', 'warm', 'cozy', 'cosy', 'uplifting', 'gentle'],
    negative: ['horror', 'serial killer', 'war', 'torture', 'apocalypse', 'bleak', 'disturbing', 'murder investigation'],
    minimumEvidence: 2,
  },
  dark: {
    label: 'Dark',
    requiredAnyGenres: ['Crime', 'Horror', 'Thriller', 'Mystery', 'Drama', 'Science-Fiction'],
    positive: ['bleak', 'disturbing', 'psychological', 'murder', 'secret', 'dystopian', 'haunted', 'corruption', 'revenge', 'grim', 'noir', 'trauma'],
    negative: ['preschool', 'light-hearted', 'feel-good', 'uplifting family comedy'],
    minimumEvidence: 2,
  },
  clever: {
    label: 'Clever',
    requiredAnyGenres: ['Mystery', 'Science-Fiction', 'Crime', 'Drama', 'Thriller'],
    positive: ['puzzle', 'investigation', 'time', 'conspiracy', 'technology', 'strategy', 'genius', 'experiment', 'twist', 'mind', 'parallel', 'simulation'],
    negative: ['reality', 'talk show', 'preschool'],
    minimumEvidence: 2,
  },
};

const genrePatterns = {
  Comedy: /\b(comedy|sitcom|funny|witty|satire|comic|humou?r)\b/i,
  Mystery: /\b(mystery|detective|puzzle|whodunnit|investigation|twists?)\b/i,
  Crime: /\b(crime|criminal|police|murder|gangster|mafia|heist|corruption)\b/i,
  Thriller: /\b(thriller|tense|suspense|gripping|conspiracy|espionage|hostage|kidnap)\b/i,
  'Science-Fiction': /\b(sci[- ]?fi|science fiction|space|future|technology|dystopian|time travel|alien)\b/i,
  Romance: /\b(romance|romantic|love story)\b/i,
  Fantasy: /\b(fantasy|magic|mythical|witch|wizard|dragon)\b/i,
  Horror: /\b(horror|scary|terrifying|haunted|demon|ghost)\b/i,
  Animation: /\b(animated|animation|anime)\b/i,
  Family: /\b(family friendly|for the family|kids|children|all ages)\b/i,
  Drama: /\b(drama|dramatic|emotional)\b/i,
  Action: /\b(action|fight|combat|mission|adventure)\b/i,
};

const excludedGenrePatterns = [
  ['Horror', /(?:no|not|without|avoid)\s+(?:too\s+)?(?:much\s+)?horror|nothing scary|not scary/i],
  ['Romance', /(?:no|not|without|avoid)\s+romance/i],
  ['Comedy', /(?:no|not|without|avoid)\s+comedy|not funny/i],
  ['Animation', /(?:no|not|without|avoid)\s+(?:animation|animated|anime)/i],
  ['Reality', /(?:no|not|without|avoid)\s+reality/i],
];

const exclusionTermPatterns = [
  ['dark', /not too dark|nothing bleak|not bleak/i],
  ['violence', /(?:no|not|without|avoid)\s+(?:too\s+)?(?:much\s+)?violence|not violent/i],
  ['slow', /not slow|fast paced|fast-paced/i],
];

export function queryTokens(query) {
  return String(query || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2 && !genericQueryWords.has(word));
}

export function parsePrompt(query) {
  const raw = String(query || '').trim();
  const text = raw.toLowerCase();
  const intent = {
    maxSeasons: null,
    maxRuntime: null,
    completedOnly: false,
    requiredGenres: [],
    excludedGenres: [],
    excludedTerms: [],
    preferredTerms: [],
    referenceTitle: null,
    referenceGenres: [],
    referenceName: null,
    labels: [],
  };

  const seasonMatch = text.match(/(?:no more than|up to|max(?:imum)?|under|less than)\s+(\d+)\s+seasons?/i);
  if (seasonMatch) {
    intent.maxSeasons = Number(seasonMatch[1]);
    intent.labels.push(`Maximum ${seasonMatch[1]} seasons`);
  }

  const runtimeMatch = text.match(/(?:under|less than|no more than|up to|max(?:imum)?)\s+(\d+)\s*(?:minutes?|mins?)/i);
  if (runtimeMatch) {
    intent.maxRuntime = Number(runtimeMatch[1]);
    intent.labels.push(`Episodes up to ${runtimeMatch[1]} min`);
  } else if (/short episodes?|quick watch|half[- ]hour/.test(text)) {
    intent.maxRuntime = 35;
    intent.labels.push('Short episodes');
  }

  if (/completed|finished series|complete story|already ended|no cliffhanger/.test(text)) {
    intent.completedOnly = true;
    intent.labels.push('Completed series');
  }

  for (const [genre, pattern] of Object.entries(genrePatterns)) {
    if (pattern.test(raw)) intent.requiredGenres.push(genre);
  }

  for (const [genre, pattern] of excludedGenrePatterns) {
    if (pattern.test(raw)) intent.excludedGenres.push(genre);
  }

  for (const [term, pattern] of exclusionTermPatterns) {
    if (pattern.test(raw)) intent.excludedTerms.push(term);
  }

  intent.requiredGenres = [...new Set(intent.requiredGenres)]
    .filter((genre) => !intent.excludedGenres.includes(genre));
  intent.excludedGenres = [...new Set(intent.excludedGenres)];
  intent.excludedTerms = [...new Set(intent.excludedTerms)];

  const likeMatch = raw.match(/\blike\s+([^,.!?]+?)(?:\s+but\b|\s+with\b|\s+without\b|\s+and\b|$)/i);
  if (likeMatch) {
    const candidate = likeMatch[1].trim().replace(/^(the|a|an)\s+/i, '');
    if (candidate.length >= 2 && candidate.length <= 60) {
      intent.referenceTitle = candidate;
      intent.labels.push(`Similar to ${candidate}`);
    }
  }

  const tokens = queryTokens(raw);
  intent.preferredTerms = tokens.filter((token) =>
    !Object.keys(genrePatterns).some((genre) => genre.toLowerCase().includes(token)),
  ).slice(0, 8);

  if (intent.requiredGenres.length) {
    intent.labels.push(`Required: ${intent.requiredGenres.join(' / ')}`);
  }
  if (intent.excludedGenres.length) {
    intent.labels.push(`Exclude: ${intent.excludedGenres.join(' / ')}`);
  }
  if (intent.excludedTerms.length) {
    intent.labels.push(`Avoid: ${intent.excludedTerms.join(', ')}`);
  }
  if (!intent.labels.length && raw) intent.labels.push('Natural-language request applied');

  return intent;
}

export function showFacts(show) {
  const genres = Array.isArray(show?.genres) ? show.genres : [];
  const summary = stripHtml(show?.summary || '').toLowerCase();
  const title = String(show?.name || '').toLowerCase();
  const haystack = `${title} ${summary} ${genres.join(' ').toLowerCase()}`;
  const seasons = Number(show?._embedded?.seasons?.length || show?.seasonCount || 0);
  const runtime = Number(show?.averageRuntime || show?.runtime || 0);
  return { genres, summary, title, haystack, seasons, runtime };
}

export function semanticGenreMatch(facts, genre) {
  const normalized = String(genre).toLowerCase();
  if (facts.genres.some((item) => item.toLowerCase() === normalized)) return true;
  const pattern = genrePatterns[genre];
  return pattern ? pattern.test(facts.haystack) : facts.haystack.includes(normalized);
}

function violatesExcludedTerms(facts, terms) {
  for (const term of terms || []) {
    if (term === 'dark' && /bleak|disturbing|grim|dystopian|murder|horror|serial killer/.test(facts.haystack)) return true;
    if (term === 'violence' && /violent|violence|war|murder|killer|combat|torture/.test(facts.haystack)) return true;
    if (term === 'slow' && /slow burn|slow-paced|meditative/.test(facts.haystack)) return true;
  }
  return false;
}

export function auditPrompt(show, intent) {
  const facts = showFacts(show);
  const requiredMatches = intent.requiredGenres.filter((genre) => semanticGenreMatch(facts, genre));
  const requiredMisses = intent.requiredGenres.filter((genre) => !semanticGenreMatch(facts, genre));
  const failures = [];

  if (requiredMisses.length) failures.push(`Missing required genre: ${requiredMisses.join(' / ')}`);
  if (intent.maxSeasons && (!facts.seasons || facts.seasons > intent.maxSeasons)) failures.push('Season limit not met');
  if (intent.maxRuntime && (!facts.runtime || facts.runtime > intent.maxRuntime)) failures.push('Runtime limit not met');
  if (intent.completedOnly && show?.status !== 'Ended') failures.push('Series is not completed');

  const excludedGenreHits = intent.excludedGenres.filter((genre) => semanticGenreMatch(facts, genre));
  if (excludedGenreHits.length) failures.push(`Excluded genre present: ${excludedGenreHits.join(' / ')}`);
  if (violatesExcludedTerms(facts, intent.excludedTerms)) failures.push('Excluded tone or theme present');

  return {
    passed: failures.length === 0,
    failures,
    requiredMatches,
    requiredMisses,
    facts,
  };
}

export function scorePrompt(show, query, intent) {
  const audit = auditPrompt(show, intent);
  if (!audit.passed) return { passed: false, score: -Infinity, confidence: 0, reasons: [], failures: audit.failures };

  let score = 25;
  const reasons = [];

  if (audit.requiredMatches.length) {
    score += audit.requiredMatches.length * 22;
    reasons.push(`Required match: ${audit.requiredMatches.join(' / ')}`);
  }
  if (intent.completedOnly) {
    score += 8;
    reasons.push('Completed series');
  }
  if (intent.maxSeasons && audit.facts.seasons) {
    score += 6;
    reasons.push(`Within limit: ${audit.facts.seasons} seasons`);
  }
  if (intent.maxRuntime && audit.facts.runtime) {
    score += 6;
    reasons.push(`Within limit: ${audit.facts.runtime}-minute episodes`);
  }

  let preferenceHits = 0;
  for (const token of intent.preferredTerms || queryTokens(query)) {
    if (audit.facts.title.includes(token)) {
      score += 4;
      preferenceHits += 1;
    } else if (audit.facts.haystack.includes(token)) {
      score += 2;
      preferenceHits += 1;
    }
  }
  if (preferenceHits) reasons.push(`${preferenceHits} request detail${preferenceHits === 1 ? '' : 's'} matched`);

  const referenceMatches = (intent.referenceGenres || []).filter((genre) => semanticGenreMatch(audit.facts, genre));
  if (referenceMatches.length) {
    score += referenceMatches.length * 5;
    reasons.push(`Shares ${referenceMatches.slice(0, 2).join(' / ')} themes with ${intent.referenceName || intent.referenceTitle}`);
  }

  const rating = Number(show?.rating?.average || 0);
  if (rating) {
    score += Math.min(rating, 10) * 1.2;
    reasons.push(`Rated ${rating}/10`);
  }
  score += Math.min(Number(show?.weight || 0), 100) / 100;
  if (!show?.image?.medium && !show?.image?.original) score -= 15;
  if (!show?.summary) score -= 6;

  const confidence = Math.max(1, Math.min(99, Math.round(score)));
  return { passed: true, score, confidence, reasons: reasons.slice(0, 5), failures: [] };
}

function containsTerm(haystack, term) {
  const escaped = String(term).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(?:^|\\b)${escaped}(?:$|\\b)`, 'i').test(haystack);
}

export function scoreMood(show, mood) {
  const profile = moodProfiles[mood];
  if (!profile) return { passed: false, score: -Infinity, confidence: 0, reasons: [] };

  const facts = showFacts(show);
  const genreMatches = profile.requiredAnyGenres.filter((genre) => semanticGenreMatch(facts, genre));
  const positiveMatches = profile.positive.filter((word) => containsTerm(facts.haystack, word));
  const negativeMatches = profile.negative.filter((word) => containsTerm(facts.haystack, word));
  const evidence = genreMatches.length + positiveMatches.length;

  const passed = genreMatches.length > 0
    && evidence >= profile.minimumEvidence
    && negativeMatches.length === 0;
  if (!passed) return { passed: false, score: -Infinity, confidence: 0, reasons: [] };

  let score = 30 + genreMatches.length * 12 + positiveMatches.length * 5;
  const rating = Number(show?.rating?.average || 0);
  score += rating * 1.1;
  score += Math.min(Number(show?.weight || 0), 100) / 100;
  if (!show?.image?.medium && !show?.image?.original) score -= 15;

  const reasons = [
    `Mood: ${profile.label}`,
    ...genreMatches.slice(0, 2).map((genre) => `${genre} tone`),
    ...positiveMatches.slice(0, 2).map((word) => `${word} themes`),
  ];
  if (rating) reasons.push(`Rated ${rating}/10`);

  return {
    passed: true,
    score,
    confidence: Math.max(1, Math.min(99, Math.round(score))),
    reasons: reasons.slice(0, 5),
  };
}

export function rankPromptShows(shows, query, intent, limit = 12) {
  return shows
    .map((show) => ({ show, evaluation: scorePrompt(show, query, intent) }))
    .filter((item) => item.evaluation.passed)
    .sort((a, b) => b.evaluation.score - a.evaluation.score)
    .slice(0, limit);
}

export function rankMoodShows(shows, mood, limit = 12) {
  return shows
    .map((show) => ({ show, evaluation: scoreMood(show, mood) }))
    .filter((item) => item.evaluation.passed)
    .sort((a, b) => b.evaluation.score - a.evaluation.score)
    .slice(0, limit);
}
