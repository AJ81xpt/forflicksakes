const stripHtml = (value = '') => String(value)
  .replace(/<[^>]*>/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();



export function normalizeTitle(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function looksLikeTitleLookup(query) {
  const raw = String(query || '').trim();
  if (!raw) return false;
  const lower = raw.toLowerCase();
  const words = normalizeTitle(raw).split(' ').filter(Boolean);
  if (!words.length || words.length > 8) return false;

  // These constructions clearly describe intent rather than naming a title.
  const intentPatterns = [
    /\b(?:something|anything|show|series|programme|program|watch|documentary|docuseries|movie|film)\b/i,
    /\b(?:i\s+(?:want|need|feel like|am looking for)|looking for|find me|recommend)\b/i,
    /\b(?:like|similar to)\b/i,
    /\b(?:under|over|less than|more than|no more than|up to|max(?:imum)?)\b/i,
    /\b(?:completed|finished|ended|ongoing|running)\b/i,
    /\b(?:no|not|without|avoid)\b/i,
    /\b(?:minutes?|mins?|seasons?|episodes?)\b/i,
    /\b(?:happy|happier|cheerful|joyful|feel[- ]good|uplifting|comforting|funny|gripping|clever)\b/i,
  ];

  // Bare "Dark" is intentionally allowed as a title lookup. "Something dark"
  // is caught by the descriptive construction above.
  if (lower === 'dark') return true;
  return !intentPatterns.some((pattern) => pattern.test(raw));
}

const GENRE_ALIASES = {
  thriller: ['Thriller'],
  suspense: ['Thriller'],
  mystery: ['Mystery'],
  detective: ['Mystery', 'Crime'],
  crime: ['Crime'],
  comedy: ['Comedy'],
  funny: ['Comedy'],
  funnier: ['Comedy'],
  sitcom: ['Comedy'],
  romance: ['Romance'],
  romantic: ['Romance'],
  horror: ['Horror'],
  scary: ['Horror'],
  fantasy: ['Fantasy'],
  action: ['Action'],
  adventure: ['Adventure'],
  drama: ['Drama'],
  emotional: ['Drama'],
  animation: ['Animation'],
  animated: ['Animation'],
  anime: ['Animation'],
  family: ['Family'],
  'sci-fi': ['Science-Fiction'],
  scifi: ['Science-Fiction'],
  'science fiction': ['Science-Fiction'],
  documentary: ['Documentary'],
};

const MOOD_PROFILES = {
  gripping: {
    label: 'Gripping',
    minScore: 8,
    genres: { Thriller: 8, Crime: 6, Mystery: 7, Action: 4, Adventure: 2 },
    themes: { suspense: 6, conspiracy: 5, investigation: 4, murder: 4, danger: 3, missing: 3, espionage: 5, hostage: 4, hunt: 3, secret: 2 },
    penalties: { preschool: 12, reality: 8, 'talk show': 8 },
  },
  dark: {
    label: 'Dark',
    minScore: 9,
    genres: { Horror: 8, Thriller: 6, Crime: 5, Mystery: 4, Drama: 2 },
    themes: { psychological: 6, bleak: 6, disturbing: 6, dystopian: 5, corruption: 4, revenge: 4, noir: 5, grim: 5, haunted: 5, murder: 3 },
    penalties: { 'feel-good': 9, preschool: 12, uplifting: 6, wholesome: 6 },
  },
  funny: {
    label: 'Funny',
    minScore: 8,
    genres: { Comedy: 10 },
    themes: { witty: 5, funny: 5, satire: 5, sitcom: 6, awkward: 3, workplace: 3, comic: 4, humour: 4, humor: 4 },
    penalties: { torture: 8, bleak: 6, 'serial killer': 8 },
  },
  comforting: {
    label: 'Comforting',
    minScore: 8,
    genres: { Comedy: 5, Romance: 4, Family: 5 },
    themes: { heartwarming: 7, friendship: 5, community: 5, 'small town': 4, cooking: 4, warm: 5, cozy: 6, cosy: 6, uplifting: 6, kindness: 5, home: 3, wholesome: 6 },
    penalties: { horror: 12, torture: 12, apocalypse: 10, disturbing: 10, bleak: 9, 'serial killer': 12 },
  },
  clever: {
    label: 'Clever',
    minScore: 8,
    genres: { Mystery: 7, 'Science-Fiction': 6, Crime: 4, Thriller: 4, Drama: 2 },
    themes: { puzzle: 7, twist: 6, investigation: 4, strategy: 6, genius: 5, experiment: 4, technology: 4, conspiracy: 3, 'time travel': 5, mind: 3 },
    penalties: { preschool: 10, reality: 7, 'talk show': 7 },
  },
};

const NEGATION_PATTERNS = [
  ['Horror', /\b(?:no|not|without|avoid)\s+(?:any\s+|too\s+much\s+)?(?:horror|scary|gore)\b/i],
  ['Comedy', /\b(?:no|not|without|avoid)\s+(?:any\s+)?(?:comedy|funny|sitcom)\b/i],
  ['Romance', /\b(?:no|not|without|avoid)\s+(?:any\s+)?(?:romance|romantic)\b/i],
  ['Animation', /\b(?:no|not|without|avoid)\s+(?:any\s+)?(?:animation|animated|anime)\b/i],
  ['Reality', /\b(?:no|not|without|avoid)\s+(?:any\s+)?reality\b/i],
];

const THEME_RULES = {
  twisty: /\b(?:twist|twists|unexpected|surprising|puzzle|mind[- ]bending)\b/i,
  psychological: /\b(?:psychological|mind games?|identity|obsession|paranoia)\b/i,
  slowBurn: /\b(?:slow[- ]burn|patient|atmospheric|meditative)\b/i,
  fastPaced: /\b(?:fast[- ]paced|quick|propulsive|nonstop|high[- ]energy)\b/i,
  gripping: /\b(?:gripping|suspenseful|tense|edge of (?:my|your) seat)\b/i,
  light: /\b(?:light|lighter|easy watch|comforting)\b/i,
  feelGood: /\b(?:happy|happier|cheerful|joyful|feel[- ]good|uplifting|positive|lighthearted|heartwarming)\b/i,
  dark: /(?<!not )(?:\bdark\b|\bbleak\b|\bgrim\b|\bdisturbing\b|\bunsettling\b)/i,
};

export function parsePrompt(query) {
  const raw = String(query || '').trim();
  const lower = raw.toLowerCase();
  const requiredGenres = new Set();
  const excludedGenres = new Set();
  const themes = [];
  const exclusions = [];
  const labels = [];

  for (const [genre, pattern] of NEGATION_PATTERNS) {
    if (pattern.test(raw)) excludedGenres.add(genre);
  }

  for (const [term, genres] of Object.entries(GENRE_ALIASES)) {
    const pattern = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}\\b`, 'i');
    if (pattern.test(raw)) {
      for (const genre of genres) {
        if (!excludedGenres.has(genre)) requiredGenres.add(genre);
      }
    }
  }

  const seasonMatch = lower.match(/(?:no more than|up to|max(?:imum)?|under|less than)\s+(\d+)\s+seasons?/i);
  const runtimeMatch = lower.match(/(?:no more than|up to|max(?:imum)?|under|less than)\s+(\d+)\s*(?:minutes?|mins?)/i);
  const referenceMatch = raw.match(/\b(?:like|similar to)\s+([^,.!?]+?)(?:\s+but\b|\s+without\b|\s+with\b|\s+and\b|$)/i);

  const intent = {
    raw,
    maxSeasons: seasonMatch ? Number(seasonMatch[1]) : null,
    maxRuntime: runtimeMatch ? Number(runtimeMatch[1]) : (/\b(?:half[- ]hour|short episodes?|quick watch)\b/i.test(raw) ? 35 : null),
    completedOnly: /\b(?:completed|finished|ended|complete story|no cliffhanger)\b/i.test(raw),
    requiredGenres: [...requiredGenres],
    excludedGenres: [...excludedGenres],
    themes,
    exclusions,
    referenceTitle: referenceMatch?.[1]?.trim() || null,
    referenceGenres: [],
    topicTerms: (lower.match(/[a-z0-9-]{4,}/g) || []).filter((token) => !new Set([
      'documentary','series','show','shows','movie','movies','film','films','watch','something',
      'completed','finished','under','seasons','season','with','about','that','this','from','like',
      'want','looking','recommend','please','good','best'
    ]).has(token)),
    labels,
  };

  for (const [name, pattern] of Object.entries(THEME_RULES)) {
    if (pattern.test(raw)) themes.push(name);
  }

  if (/\b(?:not too dark|less dark|lighter|nothing bleak|not bleak|less depressing|not depressing)\b/i.test(raw)) exclusions.push('dark');
  if (exclusions.includes('dark')) {
    const darkIndex = themes.indexOf('dark');
    if (darkIndex >= 0) themes.splice(darkIndex, 1);
  }
  if (/\b(?:no|not|without|avoid)\s+(?:too\s+much\s+)?(?:violence|violent|gore)\b/i.test(raw)) exclusions.push('violence');
  if (/\b(?:not slow|avoid slow|fast[- ]paced)\b/i.test(raw)) exclusions.push('slow');

  if (intent.requiredGenres.length) labels.push(`Required: ${intent.requiredGenres.join(' / ')}`);
  if (intent.excludedGenres.length) labels.push(`Exclude: ${intent.excludedGenres.join(' / ')}`);
  if (intent.maxSeasons) labels.push(`Maximum ${intent.maxSeasons} seasons`);
  if (intent.maxRuntime) labels.push(`Episodes up to ${intent.maxRuntime} min`);
  if (intent.completedOnly) labels.push('Completed series');
  if (intent.referenceTitle) labels.push(`Similar to ${intent.referenceTitle}`);
  if (intent.themes.length) labels.push(`Themes: ${intent.themes.join(', ')}`);
  if (intent.exclusions.length) labels.push(`Avoid: ${intent.exclusions.join(', ')}`);
  if (!labels.length) labels.push('Natural-language request applied');

  return intent;
}

export function showProfile(show) {
  const genres = Array.isArray(show?.genres) ? show.genres : [];
  const summary = stripHtml(show?.summary || '').toLowerCase();
  const title = String(show?.name || '').toLowerCase();
  const text = `${title} ${summary} ${genres.join(' ').toLowerCase()}`;
  const seasons = Array.isArray(show?._embedded?.seasons) ? show._embedded.seasons.length : Number(show?.seasonCount || 0);
  const runtime = Number(show?.averageRuntime || show?.runtime || 0);

  const scoreWords = (words) => words.reduce((score, word) => score + (text.includes(word) ? 1 : 0), 0);
  return {
    genres,
    summary,
    title,
    text,
    seasons,
    runtime,
    status: String(show?.status || ''),
    rating: Number(show?.rating?.average || 0),
    popularity: Math.min(Number(show?.weight || 0), 100),
    attributes: {
      humour: Math.min(5, (genres.includes('Comedy') ? 3 : 0) + scoreWords(['funny', 'witty', 'satire', 'sitcom', 'comic'])),
      darkness: Math.min(5, (genres.some((g) => ['Horror', 'Thriller', 'Crime'].includes(g)) ? 2 : 0) + scoreWords(['bleak', 'grim', 'disturbing', 'psychological', 'dystopian', 'murder'])),
      complexity: Math.min(5, (genres.some((g) => ['Mystery', 'Science-Fiction'].includes(g)) ? 2 : 0) + scoreWords(['puzzle', 'twist', 'conspiracy', 'strategy', 'time travel', 'experiment'])),
      comfort: Math.min(5, (genres.some((g) => ['Comedy', 'Romance', 'Family'].includes(g)) ? 2 : 0) + scoreWords(['heartwarming', 'friendship', 'community', 'warm', 'cozy', 'cosy', 'uplifting', 'kindness'])),
      intensity: Math.min(5, (genres.some((g) => ['Thriller', 'Action', 'Crime'].includes(g)) ? 2 : 0) + scoreWords(['danger', 'suspense', 'hostage', 'hunt', 'war', 'murder'])),
      pace: scoreWords(['fast-paced', 'nonstop', 'propulsive', 'race against time']) > 0 ? 5 : (scoreWords(['slow burn', 'meditative', 'patient']) > 0 ? 1 : 3),
    },
  };
}

function genreMatches(profile, genre) {
  const target = genre.toLowerCase();
  if (profile.genres.some((g) => g.toLowerCase() === target)) return true;
  const semantic = {
    Thriller: /suspense|conspiracy|espionage|hostage|danger|psychological|serial killer|race against time/,
    Mystery: /mystery|detective|investigation|missing|puzzle|whodunnit|twist/,
    Crime: /crime|criminal|police|detective|murder|gang|mafia|heist|corruption/,
    Comedy: /comedy|sitcom|funny|witty|satire|comic|humou?r/,
    Romance: /romance|romantic|love story|relationship/,
    Horror: /horror|haunted|demon|ghost|terrifying/,
    'Science-Fiction': /science fiction|sci-fi|future|space|technology|dystopian|time travel|alien/,
    Fantasy: /fantasy|magic|mythical|witch|wizard|dragon/,
    Action: /action|combat|fight|mission|warrior/,
    Adventure: /adventure|quest|expedition|journey/,
    Drama: /drama|emotional|family conflict/,
    Animation: /animated|animation|anime/,
    Family: /family|children|kids|all ages/,
    Documentary: /documentary|docuseries|nonfiction|non-fiction|real-life|true story/,
  };
  return semantic[genre]?.test(profile.text) || false;
}

export function auditPrompt(show, intent) {
  const profile = showProfile(show);
  const requiredMatches = intent.requiredGenres.filter((genre) => genreMatches(profile, genre));
  const requiredMisses = intent.requiredGenres.filter((genre) => !genreMatches(profile, genre));
  const excludedMatches = intent.excludedGenres.filter((genre) => genreMatches(profile, genre));
  const violations = [];

  if (requiredMisses.length) violations.push(`Missing ${requiredMisses.join(' / ')}`);
  if (excludedMatches.length) violations.push(`Contains excluded ${excludedMatches.join(' / ')}`);
  if (intent.maxSeasons && (!profile.seasons || profile.seasons > intent.maxSeasons)) violations.push('Season limit');
  if (intent.maxRuntime && (!profile.runtime || profile.runtime > intent.maxRuntime)) violations.push('Runtime limit');
  if (intent.completedOnly && profile.status !== 'Ended') violations.push('Not completed');
  if (intent.exclusions.includes('dark') && profile.attributes.darkness >= 4) violations.push('Too dark');
  if (intent.exclusions.includes('violence') && /violence|violent|war|murder|killer|combat|torture|gore/.test(profile.text)) violations.push('Violence');
  if (intent.exclusions.includes('slow') && profile.attributes.pace <= 2) violations.push('Too slow');
  if (intent.themes.includes('feelGood') && (profile.attributes.comfort < 2 || profile.attributes.darkness >= 4)) violations.push('Not feel-good');
  const topicTerms = Array.isArray(intent.topicTerms) ? intent.topicTerms : [];
  if (topicTerms.length && intent.requiredGenres.length) {
    const topicMatches = topicTerms.filter((term) => profile.text.includes(term));
    if (!topicMatches.length) violations.push('Missing requested topic');
  }

  return { passed: violations.length === 0, violations, requiredMatches, profile };
}

function themeScore(profile, themes) {
  let score = 0;
  for (const theme of themes) {
    if (theme === 'twisty') score += profile.attributes.complexity * 2;
    if (theme === 'psychological') score += profile.attributes.darkness + profile.attributes.complexity;
    if (theme === 'slowBurn') score += profile.attributes.pace <= 2 ? 7 : -4;
    if (theme === 'fastPaced') score += profile.attributes.pace >= 4 ? 7 : -5;
    if (theme === 'light') score += profile.attributes.comfort * 2 - profile.attributes.darkness;
    if (theme === 'feelGood') score += profile.attributes.comfort * 3 + profile.attributes.humour - profile.attributes.darkness * 2;
    if (theme === 'dark') score += profile.attributes.darkness * 2;
    if (theme === 'gripping') score += profile.attributes.intensity * 3;
  }
  return score;
}

export function scorePrompt(show, query, intent) {
  const audit = auditPrompt(show, intent);
  if (!audit.passed) return { passed: false, score: -999, reasons: [], audit };
  const p = audit.profile;
  let score = audit.requiredMatches.length * 30;
  score += themeScore(p, intent.themes);
  score += Math.min(p.rating, 10) * 1.2;
  score += p.popularity / 40;

  if (intent.completedOnly) score += 8;
  if (intent.maxSeasons && p.seasons <= intent.maxSeasons) score += 5;
  if (intent.maxRuntime && p.runtime <= intent.maxRuntime) score += 5;
  for (const genre of intent.referenceGenres || []) if (genreMatches(p, genre)) score += 6;
  if (intent.referenceProfile?.attributes) {
    const reference = intent.referenceProfile.attributes;
    const current = p.attributes;
    const similarity = ['humour', 'darkness', 'complexity', 'comfort', 'intensity', 'pace']
      .reduce((total, key) => total + Math.max(0, 5 - Math.abs((reference[key] || 0) - (current[key] || 0))), 0);
    score += similarity * 0.8;
  }

  const intentWords = new Set([
    'happy', 'happier', 'cheerful', 'joyful', 'feel-good', 'uplifting',
    'positive', 'lighthearted', 'heartwarming', 'comforting', 'funny',
    'dark', 'gripping', 'clever', 'completed', 'finished', 'seasons',
    'season', 'series', 'shows', 'show', 'something', 'watch',
  ]);
  const tokens = (String(query || '').toLowerCase().match(/[a-z0-9-]{4,}/g) || [])
    .filter((token) => !intentWords.has(token));
  for (const token of tokens) {
    if (p.title.includes(token)) score += 1;
    else if (p.text.includes(token)) score += 0.4;
  }
  if (!show?.image?.medium && !show?.image?.original) score -= 15;

  const reasons = [];
  if (audit.requiredMatches.length) reasons.push(`Required match: ${audit.requiredMatches.join(' / ')}`);
  if (intent.completedOnly) reasons.push('Completed series');
  if (intent.maxSeasons) reasons.push(`${p.seasons} seasons — within your limit`);
  if (intent.maxRuntime) reasons.push(`${p.runtime}-minute episodes — within your limit`);
  if (intent.referenceGenres?.length) reasons.push(`Shares genres with ${intent.referenceName || intent.referenceTitle}`);
  if (intent.referenceProfile?.attributes) reasons.push(`Similar tone and intensity to ${intent.referenceName || intent.referenceTitle}`);
  if (intent.themes.includes('twisty') && p.attributes.complexity >= 3) reasons.push('Twisty, puzzle-led storytelling');
  if (intent.themes.includes('light') && p.attributes.comfort >= 3) reasons.push('Lighter, more comforting tone');
  if (intent.themes.includes('feelGood') && p.attributes.comfort >= 2) reasons.push('Warm, upbeat feel-good tone');
  if (p.rating) reasons.push(`Rated ${p.rating}/10`);

  return { passed: true, score, reasons: reasons.slice(0, 5), audit };
}

export function scoreMood(show, mood) {
  const profileDefinition = MOOD_PROFILES[mood];
  if (!profileDefinition) return { passed: false, score: -999, reasons: [] };
  const profile = showProfile(show);
  let score = 0;
  const evidence = [];

  for (const [genre, weight] of Object.entries(profileDefinition.genres)) {
    if (genreMatches(profile, genre)) {
      score += weight;
      evidence.push(`${genre} tone`);
    }
  }
  for (const [word, weight] of Object.entries(profileDefinition.themes)) {
    if (profile.text.includes(word)) {
      score += weight;
      evidence.push(`${word} themes`);
    }
  }
  for (const [word, penalty] of Object.entries(profileDefinition.penalties)) {
    if (profile.text.includes(word)) score -= penalty;
  }

  if (mood === 'dark') score += profile.attributes.darkness * 1.8;
  if (mood === 'funny') score += profile.attributes.humour * 2;
  if (mood === 'comforting') score += profile.attributes.comfort * 2 - profile.attributes.darkness;
  if (mood === 'clever') score += profile.attributes.complexity * 2;
  if (mood === 'gripping') score += profile.attributes.intensity * 2;

  score += profile.rating * 0.7 + profile.popularity / 60;
  const passed = score >= profileDefinition.minScore && evidence.length > 0;
  return {
    passed,
    score,
    reasons: [`Mood: ${profileDefinition.label}`, ...evidence.slice(0, 3), profile.rating ? `Rated ${profile.rating}/10` : null].filter(Boolean),
    profile,
  };
}

export function moodLabel(mood) {
  return MOOD_PROFILES[mood]?.label || null;
}

export function knownMoods() {
  return Object.keys(MOOD_PROFILES);
}
