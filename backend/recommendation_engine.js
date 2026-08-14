const stripHtml = (value = '') => String(value)
  .replace(/<[^>]*>/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

export function normalizeTitle(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\b(\d+)\s*ft\b/g, '$1 foot')
    .replace(/\b(\d+)ft\b/g, '$1 foot')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const TOPIC_FAMILIES = {
  surfing: {
    aliases: ['surfing', 'surf', 'surfer', 'surfers', 'big wave', 'big-wave'],
    evidence: /\b(?:surf(?:ing|er|ers)?|big[- ]wave|wave riding)\b/i,
    strongEvidence: /\b(?:surf(?:ing|er|ers)?|big[- ]wave|wave riding)\b/i,
    searchTerms: ['surfing', 'surfer', 'big wave'],
  },
  ocean: {
    aliases: ['ocean', 'oceans', 'sea', 'marine', 'underwater'],
    evidence: /\b(?:ocean|oceans|marine|underwater|sea life|seabed|deep sea)\b/i,
    strongEvidence: /\b(?:ocean|oceans|marine|underwater|sea life|seabed|deep sea)\b/i,
    searchTerms: ['ocean', 'marine', 'underwater'],
  },
  nature: {
    aliases: ['nature', 'natural world'],
    evidence: /\b(?:nature|natural world|wilderness|ecosystem|habitat)\b/i,
    strongEvidence: /\b(?:nature|natural world|wilderness|ecosystem|habitat|natural environment)\b/i,
    searchTerms: ['nature', 'wilderness'],
  },
  wildlife: {
    aliases: ['wildlife', 'animals', 'animal'],
    evidence: /\b(?:wildlife|wild animals?|animals?|species|habitat|safari)\b/i,
    strongEvidence: /\b(?:wildlife|wild animals?|animals?|animal behaviour|animal behavior|species|safari)\b/i,
    searchTerms: ['wildlife', 'animals'],
  },
  science: {
    aliases: ['science', 'scientific'],
    evidence: /\b(?:science|scientific|scientist|scientists|physics|biology|genetics|neuroscience|astronomy|research laboratory|research lab)\b/i,
    searchTerms: ['science', 'scientist', 'physics', 'biology'],
  },
  space: {
    aliases: ['space', 'astronomy', 'cosmos', 'universe'],
    evidence: /\b(?:space|astronomy|cosmos|universe|planet|planets|galaxy|galaxies|nasa|astronaut|astronauts|moon|mars)\b/i,
    strongEvidence: /\b(?:outer space|deep space|astronomy|cosmos|universe|galaxy|galaxies|nasa|astronaut|astronauts|moon|mars|astrophysics|planetary|planets)\b/i,
    searchTerms: ['space', 'astronomy', 'universe'],
  },
  technology: {
    aliases: ['technology', 'tech', 'computers', 'computer', 'internet', 'ai', 'artificial intelligence'],
    evidence: /\b(?:technology|tech|computer|computers|internet|artificial intelligence|\bai\b|robot|robots|software|cyber)\b/i,
    searchTerms: ['technology', 'computer', 'artificial intelligence'],
  },
  history: {
    aliases: ['history', 'historical'],
    evidence: /\b(?:history|historical|historic|ancient|century|civilization|civilisation|empire|dynasty|medieval|victorian|archive|archival)\b/i,
    searchTerms: ['history', 'historical', 'ancient'],
  },
  war: {
    aliases: ['war', 'warfare', 'military'],
    evidence: /\b(?:war|warfare|military|battle|army|soldier|soldiers|world war|conflict)\b/i,
    searchTerms: ['war', 'military'],
  },
  archaeology: {
    aliases: ['archaeology', 'archeology', 'archaeological', 'archeological'],
    evidence: /\b(?:archaeolog|archeolog|excavation|ancient ruins|artifact|artefact)\w*/i,
    searchTerms: ['archaeology', 'ancient ruins'],
  },
  drugs: {
    aliases: ['drug', 'drugs', 'drug trade', 'drug trafficking', 'narcotics', 'cartel', 'cartels', 'cocaine', 'heroin', 'meth', 'dealer', 'dealers'],
    evidence: /\b(?:drug(?:s| trade| trafficking)?|narcotics?|cartels?|cocaine|heroin|meth(?:amphetamine)?|dealer(?:s)?|traffick(?:ing|er|ers)|narco(?:s)?)\b/i,
    strongEvidence: /\b(?:drug trade|drug trafficking|narcotics?|cartels?|cocaine|heroin|meth(?:amphetamine)?|dealer(?:s)?|traffick(?:ing|er|ers)|narco(?:s)?)\b/i,
    searchTerms: ['drug trafficking', 'drug cartel', 'narcotics', 'cocaine'],
  },
  mafia: {
    aliases: ['mafia', 'mob', 'gangster', 'gangsters', 'organized crime', 'organised crime'],
    evidence: /\b(?:mafia|mobster(?:s)?|gangster(?:s)?|organized crime|organised crime|crime family)\b/i,
    searchTerms: ['mafia', 'organized crime', 'gangster'],
  },
  legal: {
    aliases: ['legal', 'lawyer', 'lawyers', 'courtroom', 'court', 'attorney', 'attorneys'],
    evidence: /\b(?:lawyer(?:s)?|attorney(?:s)?|courtroom|court case|legal case|law firm|prosecutor(?:s)?|defen[cs]e attorney)\b/i,
    searchTerms: ['courtroom', 'lawyer', 'legal drama'],
  },
  espionage: {
    aliases: ['spy', 'spies', 'espionage', 'intelligence agency', 'secret agent'],
    evidence: /\b(?:spy|spies|espionage|intelligence agency|secret agent|cia|mi6|counterintelligence)\b/i,
    searchTerms: ['espionage', 'spy', 'secret agent'],
  },
  supernatural: {
    aliases: ['supernatural', 'vampire', 'vampires', 'witch', 'witches', 'werewolf', 'werewolves', 'ghost', 'ghosts'],
    evidence: /\b(?:supernatural|vampire(?:s)?|witch(?:es)?|werewolv(?:es|e)|ghost(?:s)?|demon(?:s)?)\b/i,
    searchTerms: ['supernatural', 'vampire', 'witch'],
  },
  'true crime': {
    aliases: ['true crime', 'real crime'],
    evidence: /\b(?:true crime|real[- ]life crime|murder case|criminal case|serial killer|unsolved crime)\b/i,
    strongEvidence: /\b(?:true crime|real[- ]life crime|real crime|actual crime|real[- ]world crime|documentary investigation|unsolved crime)\b/i,
    searchTerms: ['true crime', 'unsolved crime'],
  },
  food: {
    aliases: ['food', 'cooking', 'chef', 'chefs', 'culinary', 'cuisine'],
    evidence: /\b(?:food|cooking|chef|chefs|culinary|cuisine|restaurant|restaurants|baking|gastronomy)\b/i,
    searchTerms: ['food', 'cooking', 'chef'],
  },
  travel: {
    aliases: ['travel', 'travelling', 'traveling', 'journey', 'journeys'],
    evidence: /\b(?:travel|travelling|traveling|journey|journeys|tourism|destination|destinations|road trip|around the world)\b/i,
    searchTerms: ['travel', 'journey'],
  },
  music: {
    aliases: ['music', 'musician', 'musicians', 'band', 'bands'],
    evidence: /\b(?:music|musician|musicians|band|bands|singer|singers|songwriter|concert|album|rock star|hip hop|jazz)\b/i,
    searchTerms: ['music', 'musician'],
  },
  sport: {
    aliases: ['sport', 'sports', 'football', 'soccer', 'rugby', 'cricket', 'basketball', 'tennis', 'cycling', 'athletics'],
    evidence: /\b(?:sport|sports|football|soccer|rugby|cricket|basketball|tennis|cycling|athlete|athletes|athletics|championship|tournament|team)\b/i,
    searchTerms: ['sports', 'athlete'],
  },
  politics: {
    aliases: ['politics', 'political', 'government', 'election', 'elections'],
    evidence: /\b(?:politics|political|government|election|elections|president|prime minister|parliament|congress|campaign)\b/i,
    searchTerms: ['politics', 'government'],
  },
  biography: {
    aliases: ['biography', 'biographical', 'biopic', 'life story'],
    evidence: /\b(?:biography|biographical|biopic|life story|portrait of|career of)\b/i,
    searchTerms: ['biography', 'life story'],
  },
  medicine: {
    aliases: ['medicine', 'medical', 'health', 'doctor', 'doctors'],
    evidence: /\b(?:medicine|medical|health|doctor|doctors|hospital|disease|patient|patients|surgery|public health)\b/i,
    searchTerms: ['medicine', 'medical', 'health'],
  },
  environment: {
    aliases: ['environment', 'environmental', 'climate', 'climate change', 'conservation'],
    evidence: /\b(?:environment|environmental|climate|climate change|conservation|global warming|pollution|sustainability)\b/i,
    searchTerms: ['environment', 'climate', 'conservation'],
  },
  art: {
    aliases: ['art', 'artist', 'artists', 'painting', 'photography', 'design'],
    evidence: /\b(?:art|artist|artists|painting|painter|photography|photographer|design|museum|gallery|sculpture)\b/i,
    searchTerms: ['art', 'artist'],
  },
  culture: {
    aliases: ['culture', 'cultural', 'society', 'tradition', 'traditions'],
    evidence: /\b(?:culture|cultural|society|tradition|traditions|community|communities|heritage|identity)\b/i,
    searchTerms: ['culture', 'cultural'],
  },
};

const GENERIC_TOPIC_PHRASES = new Set(
  Object.values(TOPIC_FAMILIES).flatMap((family) => family.aliases.map(normalizeTitle)),
);

export function looksLikeTitleLookup(query) {
  const raw = String(query || '').trim();
  if (!raw) return false;
  const normalized = normalizeTitle(raw);
  const lower = raw.toLowerCase();
  const words = normalized.split(' ').filter(Boolean);
  if (!words.length || words.length > 8) return false;

  if (GENERIC_TOPIC_PHRASES.has(normalized)) return false;

  const intentPatterns = [
    /\b(?:something|anything|show|series|programme|program|watch|documentary|documentaries|docuseries|movie|film)\b/i,
    /\b(?:i\s+(?:want|need|feel like|am looking for)|looking for|find me|recommend)\b/i,
    /\b(?:like|similar to)\b/i,
    /\b(?:under|over|less than|more than|no more than|up to|max(?:imum)?)\b/i,
    /\b(?:completed|finished|ended|ongoing|running)\b/i,
    /\b(?:no|not|without|avoid)\b/i,
    /\b(?:minutes?|mins?|seasons?|episodes?)\b/i,
    /\b(?:happy|happier|cheerful|joyful|feel[- ]good|uplifting|comforting|funny|gripping|clever)\b/i,
  ];

  if (lower === 'dark') return true;
  return !intentPatterns.some((pattern) => pattern.test(raw));
}

const GENRE_ALIASES = {
  thriller: ['Thriller'], suspense: ['Thriller'], mystery: ['Mystery'], detective: ['Mystery', 'Crime'],
  crime: ['Crime'], comedy: ['Comedy'], funny: ['Comedy'], funnier: ['Comedy'], sitcom: ['Comedy'],
  romance: ['Romance'], romantic: ['Romance'], horror: ['Horror'], scary: ['Horror'], fantasy: ['Fantasy'],
  action: ['Action'], adventure: ['Adventure'], drama: ['Drama'], emotional: ['Drama'], animation: ['Animation'],
  animated: ['Animation'], anime: ['Animation'], family: ['Family'], 'sci-fi': ['Science-Fiction'],
  scifi: ['Science-Fiction'], 'science fiction': ['Science-Fiction'], documentary: ['Documentary'], documentaries: ['Documentary'],
  docuseries: ['Documentary'],
};

const MOOD_PROFILES = {
  gripping: { label: 'Gripping', minScore: 8, genres: { Thriller: 8, Crime: 6, Mystery: 7, Action: 4, Adventure: 2 }, themes: { suspense: 6, conspiracy: 5, investigation: 4, murder: 4, danger: 3, missing: 3, espionage: 5, hostage: 4, hunt: 3, secret: 2 }, penalties: { preschool: 12, reality: 8, 'talk show': 8 } },
  dark: { label: 'Dark', minScore: 9, genres: { Horror: 8, Thriller: 6, Crime: 5, Mystery: 4, Drama: 2 }, themes: { psychological: 6, bleak: 6, disturbing: 6, dystopian: 5, corruption: 4, revenge: 4, noir: 5, grim: 5, haunted: 5, murder: 3 }, penalties: { 'feel-good': 9, preschool: 12, uplifting: 6, wholesome: 6 } },
  funny: { label: 'Funny', minScore: 8, genres: { Comedy: 10 }, themes: { witty: 5, funny: 5, satire: 5, sitcom: 6, awkward: 3, workplace: 3, comic: 4, humour: 4, humor: 4 }, penalties: { torture: 8, bleak: 6, 'serial killer': 8 } },
  comforting: { label: 'Comforting', minScore: 8, genres: { Comedy: 5, Romance: 4, Family: 5 }, themes: { heartwarming: 7, friendship: 5, community: 5, 'small town': 4, cooking: 4, warm: 5, cozy: 6, cosy: 6, uplifting: 6, kindness: 5, home: 3, wholesome: 6 }, penalties: { horror: 12, torture: 12, apocalypse: 10, disturbing: 10, bleak: 9, 'serial killer': 12 } },
  clever: { label: 'Clever', minScore: 8, genres: { Mystery: 7, 'Science-Fiction': 6, Crime: 4, Thriller: 4, Drama: 2 }, themes: { puzzle: 7, twist: 6, investigation: 4, strategy: 6, genius: 5, experiment: 4, technology: 4, conspiracy: 3, 'time travel': 5, mind: 3 }, penalties: { preschool: 10, reality: 7, 'talk show': 7 } },
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

function detectedTopics(raw) {
  const normalized = ` ${normalizeTitle(raw)} `;
  const topics = [];
  for (const [key, family] of Object.entries(TOPIC_FAMILIES)) {
    if (family.aliases.some((alias) => normalized.includes(` ${normalizeTitle(alias)} `))) topics.push(key);
  }
  // Avoid requiring both broad + narrow families for obvious overlaps.
  if (topics.includes('surfing')) return topics.filter((key) => key !== 'ocean');
  if (topics.includes('wildlife')) return topics.filter((key) => key !== 'nature');
  return topics;
}

export function parsePrompt(query) {
  const raw = String(query || '').trim();
  const lower = raw.toLowerCase();
  const requiredGenres = new Set();
  const excludedGenres = new Set();
  const themes = [];
  const exclusions = [];
  const labels = [];

  for (const [genre, pattern] of NEGATION_PATTERNS) if (pattern.test(raw)) excludedGenres.add(genre);
  for (const [term, genres] of Object.entries(GENRE_ALIASES)) {
    const pattern = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}\\b`, 'i');
    if (pattern.test(raw)) for (const genre of genres) if (!excludedGenres.has(genre)) requiredGenres.add(genre);
  }

  const runtimeMatch = lower.match(/(?:no more than|up to|max(?:imum)?|under|less than)\s+(\d+)\s*(?:minutes?|mins?)/i);
  const referenceMatch = raw.match(/\b(?:like|similar to)\s+([^,.!?]+?)(?:\s+but\b|\s+without\b|\s+with\b|\s+and\b|$)/i);
  const topicGroups = detectedTopics(raw);

  const intent = {
    raw,
    maxRuntime: runtimeMatch ? Number(runtimeMatch[1]) : (/\b(?:half[- ]hour|short episodes?|quick watch)\b/i.test(raw) ? 35 : null),
    completedOnly: /\b(?:completed|finished|ended|complete story|no cliffhanger|finished airing)\b/i.test(raw),
    requiredGenres: [...requiredGenres], excludedGenres: [...excludedGenres], themes, exclusions,
    referenceTitle: referenceMatch?.[1]?.trim() || null, referenceGenres: [],
    topicGroups,
    topicTerms: topicGroups,
    searchTerms: topicGroups.flatMap((key) => TOPIC_FAMILIES[key]?.searchTerms || []).slice(0, 12),
    labels,
  };

  for (const [name, pattern] of Object.entries(THEME_RULES)) if (pattern.test(raw)) themes.push(name);
  if (/\b(?:not too dark|less dark|lighter|nothing bleak|not bleak|less depressing|not depressing)\b/i.test(raw)) exclusions.push('dark');
  if (exclusions.includes('dark')) { const i = themes.indexOf('dark'); if (i >= 0) themes.splice(i, 1); }
  if (/\b(?:no|not|without|avoid)\s+(?:too\s+much\s+)?(?:violence|violent|gore)\b/i.test(raw)) exclusions.push('violence');
  if (/\b(?:not slow|avoid slow|fast[- ]paced)\b/i.test(raw)) exclusions.push('slow');

  if (intent.requiredGenres.length) labels.push(`Required: ${intent.requiredGenres.join(' / ')}`);
  if (intent.topicGroups.length) labels.push(`Topic: ${intent.topicGroups.join(' / ')}`);
  if (intent.excludedGenres.length) labels.push(`Exclude: ${intent.excludedGenres.join(' / ')}`);
  if (intent.maxRuntime) labels.push(`Episodes up to ${intent.maxRuntime} min`);
  if (intent.completedOnly) labels.push('Finished series');
  if (intent.referenceTitle) labels.push(`Similar to ${intent.referenceTitle}`);
  if (intent.themes.length) labels.push(`Themes: ${intent.themes.join(', ')}`);
  if (intent.exclusions.length) labels.push(`Avoid: ${intent.exclusions.join(', ')}`);
  if (!labels.length) labels.push('Natural-language request applied');
  return intent;
}

export function showProfile(show) {
  const genres = Array.isArray(show?.genres) ? show.genres : [];
  const type = String(show?.type || '');
  const summary = stripHtml(show?.summary || '').toLowerCase();
  const title = String(show?.name || '').toLowerCase();
  const text = `${title} ${summary} ${genres.join(' ').toLowerCase()}`;
  const seasons = Array.isArray(show?._embedded?.seasons) ? show._embedded.seasons.length : Number(show?.seasonCount || 0);
  const runtime = Number(show?.averageRuntime || show?.runtime || 0);
  const scoreWords = (words) => words.reduce((score, word) => score + (text.includes(word) ? 1 : 0), 0);
  return {
    genres, type, summary, title, text, seasons, runtime, status: String(show?.status || ''), rating: Number(show?.rating?.average || 0), popularity: Math.min(Number(show?.weight || 0), 100),
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

function strictGenreMatches(profile, genre) {
  const target = String(genre || '').toLowerCase();
  if (profile.genres.some((g) => String(g).toLowerCase() === target)) return true;
  // TVMaze often represents factual series as type=Documentary while genres are
  // topical (Sports, Crime, History, etc.). Treat that as authoritative format evidence.
  if (genre === 'Documentary') return profile.type.toLowerCase() === 'documentary';
  return false;
}

function genreMatches(profile, genre) {
  if (strictGenreMatches(profile, genre)) return true;
  // Semantic genre inference is deliberately reserved for soft ranking signals
  // (moods, taste, reference similarity). Explicit user-requested genres use
  // strictGenreMatches so a synopsis word cannot turn Buffy into Crime or
  // Spartacus into Romance.
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
  };
  return semantic[genre]?.test(profile.text) || false;
}

function topicMatches(profile, key, documentaryRequired = false) {
  const family = TOPIC_FAMILIES[key];
  if (!family) return false;

  const pattern = documentaryRequired
    ? (family.strongEvidence || family.evidence)
    : family.evidence;

  return Boolean(pattern?.test(profile.text));
}

export function auditPrompt(show, intent) {
  const profile = showProfile(show);
  const requiredMatches = intent.requiredGenres.filter((genre) => strictGenreMatches(profile, genre));
  const requiredMisses = intent.requiredGenres.filter((genre) => !strictGenreMatches(profile, genre));
  const excludedMatches = intent.excludedGenres.filter((genre) => strictGenreMatches(profile, genre));
  const topicGroups = Array.isArray(intent.topicGroups) ? intent.topicGroups : [];
  const documentaryRequired = intent.requiredGenres.includes('Documentary');
  const topicHits = topicGroups.filter((key) => topicMatches(profile, key, documentaryRequired));
  const topicMisses = topicGroups.filter((key) => !topicMatches(profile, key, documentaryRequired));
  const violations = [];

  if (requiredMisses.length) violations.push(`Missing ${requiredMisses.join(' / ')}`);
  if (topicMisses.length) violations.push(`Missing topic ${topicMisses.join(' / ')}`);
  if (excludedMatches.length) violations.push(`Contains excluded ${excludedMatches.join(' / ')}`);
  if (intent.maxRuntime && (!profile.runtime || profile.runtime > intent.maxRuntime)) violations.push('Runtime limit');
  if (intent.completedOnly && profile.status !== 'Ended') violations.push('Not finished');
  if (intent.exclusions.includes('dark') && profile.attributes.darkness >= 4) violations.push('Too dark');
  if (intent.exclusions.includes('violence') && /violence|violent|war|murder|killer|combat|torture|gore/.test(profile.text)) violations.push('Violence');
  if (intent.exclusions.includes('slow') && profile.attributes.pace <= 2) violations.push('Too slow');
  if (intent.themes.includes('feelGood') && (profile.attributes.comfort < 2 || profile.attributes.darkness >= 4)) violations.push('Not feel-good');
  return { passed: violations.length === 0, violations, requiredMatches, topicHits, profile };
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

function promptConfidence(intent, audit, profile) {
  const hardCount = (intent.requiredGenres?.length || 0)
    + (intent.topicGroups?.length || 0)
    + (intent.maxRuntime ? 1 : 0)
    + (intent.completedOnly ? 1 : 0)
    + (intent.excludedGenres?.length || 0)
    + (intent.exclusions?.length || 0);
  const satisfiedHard = (audit.requiredMatches?.length || 0)
    + (audit.topicHits?.length || 0)
    + (intent.maxRuntime && profile.runtime && profile.runtime <= intent.maxRuntime ? 1 : 0)
    + (intent.completedOnly && profile.status === 'Ended' ? 1 : 0)
    + (intent.excludedGenres?.length || 0)
    + (intent.exclusions?.length || 0);

  // Hard requirements dominate confidence. Rating/popularity only fine-tune it.
  let confidence = hardCount
    ? 72 + Math.round((satisfiedHard / hardCount) * 20)
    : 58;
  if ((intent.themes || []).length) confidence += Math.min(5, Math.round(themeScore(profile, intent.themes) / 5));
  if (profile.rating >= 8) confidence += 3;
  else if (profile.rating >= 7) confidence += 2;
  if ((intent.preferredGenres || []).some((genre) => strictGenreMatches(profile, genre))) confidence += 2;
  return Math.max(1, Math.min(99, confidence));
}

export function scorePrompt(show, query, intent) {
  const audit = auditPrompt(show, intent);
  if (!audit.passed) return { passed: false, score: -999, confidence: 0, reasons: [], audit };
  const p = audit.profile;
  let score = audit.requiredMatches.length * 30 + audit.topicHits.length * 35;
  score += themeScore(p, intent.themes);
  score += Math.min(p.rating, 10) * 1.2 + p.popularity / 80;
  if (intent.completedOnly) score += 8;
  if (intent.maxRuntime && p.runtime <= intent.maxRuntime) score += 5;
  for (const genre of intent.referenceGenres || []) if (genreMatches(p, genre)) score += 6;
  for (const genre of intent.preferredGenres || []) if (genreMatches(p, genre)) score += 7;
  if (intent.referenceProfile?.attributes) {
    const reference = intent.referenceProfile.attributes;
    const current = p.attributes;
    const similarity = ['humour', 'darkness', 'complexity', 'comfort', 'intensity', 'pace']
      .reduce((total, key) => total + Math.max(0, 5 - Math.abs((reference[key] || 0) - (current[key] || 0))), 0);
    score += similarity * 0.8;
  }
  if (!show?.image?.medium && !show?.image?.original) score -= 15;

  const reasons = [];
  if (audit.requiredMatches.length) reasons.push(`Required match: ${audit.requiredMatches.join(' / ')}`);
  if (audit.topicHits.length) reasons.push(`Topic match: ${audit.topicHits.join(' / ')}`);
  if (intent.completedOnly) reasons.push('Finished series');
  if (intent.maxRuntime) reasons.push(`${p.runtime}-minute episodes — within your limit`);
  if (intent.referenceGenres?.length) reasons.push(`Shares genres with ${intent.referenceName || intent.referenceTitle}`);
  const preferredHits = (intent.preferredGenres || []).filter((genre) => genreMatches(p, genre));
  if (preferredHits.length) reasons.push(`Matches your taste: ${preferredHits.slice(0, 2).join(' / ')}`);
  if (intent.referenceProfile?.attributes) reasons.push(`Similar tone and intensity to ${intent.referenceName || intent.referenceTitle}`);
  if (intent.themes.includes('twisty') && p.attributes.complexity >= 3) reasons.push('Twisty, puzzle-led storytelling');
  if (intent.themes.includes('light') && p.attributes.comfort >= 3) reasons.push('Lighter, more comforting tone');
  if (intent.themes.includes('feelGood') && p.attributes.comfort >= 2) reasons.push('Warm, upbeat feel-good tone');
  if (p.rating) reasons.push(`Rated ${p.rating}/10`);
  return { passed: true, score, confidence: promptConfidence(intent, audit, p), reasons: reasons.slice(0, 5), audit };
}

export function scoreMood(show, mood) {
  const def = MOOD_PROFILES[mood];
  if (!def) return { passed: false, score: -999, reasons: [] };
  const profile = showProfile(show);
  let score = 0;
  const evidence = [];
  for (const [genre, weight] of Object.entries(def.genres)) if (genreMatches(profile, genre)) { score += weight; evidence.push(`${genre} tone`); }
  for (const [word, weight] of Object.entries(def.themes)) if (profile.text.includes(word)) { score += weight; evidence.push(`${word} themes`); }
  for (const [word, penalty] of Object.entries(def.penalties)) if (profile.text.includes(word)) score -= penalty;
  if (mood === 'dark') score += profile.attributes.darkness * 1.8;
  if (mood === 'funny') score += profile.attributes.humour * 2;
  if (mood === 'comforting') score += profile.attributes.comfort * 2 - profile.attributes.darkness;
  if (mood === 'clever') score += profile.attributes.complexity * 2;
  if (mood === 'gripping') score += profile.attributes.intensity * 2;
  score += profile.rating * 0.7 + profile.popularity / 60;
  const passed = score >= def.minScore && evidence.length > 0;
  return { passed, score, reasons: [`Mood: ${def.label}`, ...evidence.slice(0, 3), profile.rating ? `Rated ${profile.rating}/10` : null].filter(Boolean), profile };
}

export function moodLabel(mood) { return MOOD_PROFILES[mood]?.label || null; }
export function knownMoods() { return Object.keys(MOOD_PROFILES); }
