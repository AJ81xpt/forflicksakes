import test from 'node:test';
import assert from 'node:assert/strict';
import { auditPrompt, showProfile, looksLikeTitleLookup, normalizeTitle, parsePrompt, scoreMood, scorePrompt } from './recommendation_engine.js';

const show = (overrides = {}) => ({
  id: 1,
  name: 'Example',
  genres: ['Drama'],
  summary: '<p>A quiet story.</p>',
  status: 'Ended',
  averageRuntime: 45,
  rating: { average: 8 },
  weight: 70,
  image: { medium: 'poster.jpg' },
  _embedded: { seasons: [{}, {}] },
  ...overrides,
});

test('thriller request rejects ordinary comedy', () => {
  const intent = parsePrompt('A completed thriller');
  const comedy = show({ genres: ['Comedy'], summary: '<p>Friends run a cafe and make jokes.</p>' });
  assert.equal(auditPrompt(comedy, intent).passed, false);
});


test('completed only rejects running shows', () => {
  const intent = parsePrompt('A completed mystery');
  const running = show({ genres: ['Mystery'], status: 'Running', summary: '<p>A detective investigates.</p>' });
  assert.equal(auditPrompt(running, intent).passed, false);
});

test('comforting mood rewards warm comedy and rejects bleak horror', () => {
  const warm = show({ genres: ['Comedy'], summary: '<p>A heartwarming community cooking story about friendship.</p>' });
  const bleak = show({ genres: ['Horror'], summary: '<p>A bleak disturbing serial killer nightmare.</p>' });
  assert.equal(scoreMood(warm, 'comforting').passed, true);
  assert.equal(scoreMood(bleak, 'comforting').passed, false);
});

test('dark mood does not require dark in title', () => {
  const psychological = show({ name: 'The Quiet Room', genres: ['Thriller'], summary: '<p>A bleak psychological mystery about corruption and revenge.</p>' });
  assert.equal(scoreMood(psychological, 'dark').passed, true);
});

test('prompt score returns transparent reasons', () => {
  const intent = parsePrompt('A completed thriller with twists');
  const candidate = show({ genres: ['Thriller', 'Mystery'], summary: '<p>A suspense conspiracy full of twists.</p>' });
  const result = scorePrompt(candidate, intent.raw, intent);
  assert.equal(result.passed, true);
  assert.ok(result.reasons.some((reason) => reason.includes('Required match')));
});


test('happy prompt is treated as feel-good intent, not a title-word search', () => {
  const intent = parsePrompt('I want a happy show');
  assert.ok(intent.themes.includes('feelGood'));

  const bleakTitleMatch = show({
    name: 'Happy Valley Murders',
    genres: ['Crime', 'Thriller'],
    summary: 'A bleak murder investigation in a grim town.',
  });
  const warmComedy = show({
    name: 'Sunshine Club',
    genres: ['Comedy'],
    summary: 'A warm, uplifting comedy about friendship and community.',
  });

  assert.equal(scorePrompt(bleakTitleMatch, intent.raw, intent).passed, false);
  assert.equal(scorePrompt(warmComedy, intent.raw, intent).passed, true);
  assert.ok(scorePrompt(warmComedy, intent.raw, intent).score > 0);
});


test('bare known-looking names are treated as title lookups', () => {
  assert.equal(looksLikeTitleLookup('Severance'), true);
  assert.equal(looksLikeTitleLookup('The Bear'), true);
  assert.equal(looksLikeTitleLookup('Dark'), true);
});

test('descriptive requests are not mistaken for exact title searches', () => {
  assert.equal(looksLikeTitleLookup('something dark'), false);
  assert.equal(looksLikeTitleLookup('something like Dark'), false);
  assert.equal(looksLikeTitleLookup('I want a happy show'), false);
});

test('title normalization ignores punctuation and case', () => {
  assert.equal(normalizeTitle('Happy!'), normalizeTitle('happy'));
  assert.equal(normalizeTitle('MR. ROBOT'), normalizeTitle('Mr Robot'));
});


test('less dark refinement is an exclusion, not a request for dark content', () => {
  const intent = parsePrompt('something like Severance, less dark and nothing bleak');
  assert.ok(intent.exclusions.includes('dark'));
  assert.equal(intent.themes.includes('dark'), false);
});

test('funnier refinement becomes a comedy requirement', () => {
  const intent = parsePrompt('something clever, make it funnier');
  assert.ok(intent.requiredGenres.includes('Comedy'));
});

test('more gripping refinement rewards intense thrillers', () => {
  const intent = parsePrompt('a mystery, more gripping and suspenseful');
  assert.ok(intent.themes.includes('gripping'));
  const candidate = show({ genres: ['Mystery', 'Thriller'], summary: '<p>A tense suspense conspiracy full of danger.</p>' });
  assert.equal(scorePrompt(candidate, intent.raw, intent).passed, true);
});


test('reference profile rewards a closer vibe match', () => {
  const intent = parsePrompt('something like Reference Show');
  intent.referenceGenres = ['Mystery', 'Science-Fiction'];
  intent.referenceName = 'Reference Show';
  intent.referenceProfile = showProfile(show({ genres: ['Mystery', 'Science-Fiction'], summary: '<p>A psychological puzzle with a conspiracy.</p>' })).attributes ? showProfile(show({ genres: ['Mystery', 'Science-Fiction'], summary: '<p>A psychological puzzle with a conspiracy.</p>' })) : null;
  const close = show({ name: 'Close Match', genres: ['Mystery', 'Science-Fiction'], summary: '<p>A psychological puzzle with a conspiracy.</p>' });
  const far = show({ name: 'Far Match', genres: ['Comedy', 'Romance'], summary: '<p>A warm uplifting community romance.</p>' });
  assert.ok(scorePrompt(close, intent.raw, intent).score > scorePrompt(far, intent.raw, intent).score);
});


test('surfing documentary requires both documentary format and surfing topic', () => {
  const intent = parsePrompt('surfing documentary');
  assert.equal(looksLikeTitleLookup('surfing documentary'), false);
  assert.deepEqual(intent.requiredGenres, ['Documentary']);
  const unrelated = show({ name: 'Breaking Bad', genres: ['Drama', 'Crime'], summary: 'A chemistry teacher enters the drug trade.' });
  assert.equal(scorePrompt(unrelated, 'surfing documentary', intent).passed, false);
  const surfing = show({ name: 'Surf Stories', genres: ['Documentary'], summary: 'A documentary following surfers and surfing culture around the world.' });
  assert.equal(scorePrompt(surfing, 'surfing documentary', intent).passed, true);
});

test('documentary format must be a real genre, not a synopsis mention', () => {
  const intent = parsePrompt('surfing documentary');
  const fake = show({
    name: 'Place of Execution',
    genres: ['Drama', 'Crime'],
    summary: 'A journalist makes a documentary about an old murder case.',
  });
  assert.equal(scorePrompt(fake, intent.raw, intent).passed, false);
});

test('generic topic words are recommendation intents, not title lookups', () => {
  for (const query of ['surfing', 'nature', 'wildlife', 'science', 'history', 'space', 'technology', 'food', 'travel', 'music', 'sport']) {
    assert.equal(looksLikeTitleLookup(query), false, query);
  }
});

test('topic constraints reject unrelated popular drama', () => {
  const breakingBad = show({
    name: 'Breaking Bad',
    genres: ['Drama', 'Crime', 'Thriller'],
    summary: 'A chemistry teacher enters the drug trade.',
  });
  for (const query of ['surfing', 'nature', 'science', 'history', 'space', 'food', 'travel']) {
    const intent = parsePrompt(query);
    assert.equal(scorePrompt(breakingBad, query, intent).passed, false, query);
  }
});

test('topic families accept genuinely related titles', () => {
  const cases = [
    ['nature', show({ name: 'Wild Earth', genres: ['Documentary'], summary: 'Wildlife and wilderness ecosystems across Africa.' })],
    ['science', show({ name: 'Science Now', genres: ['Documentary'], summary: 'Scientists explore physics, biology and new research.' })],
    ['history', show({ name: 'Ancient Worlds', genres: ['Documentary'], summary: 'A history of ancient civilizations and empires.' })],
    ['space', show({ name: 'Cosmos Beyond', genres: ['Documentary'], summary: 'Astronomy, planets and the universe.' })],
    ['food', show({ name: 'Chef Stories', genres: ['Documentary'], summary: 'Chefs explore food, cuisine and restaurants.' })],
  ];
  for (const [query, candidate] of cases) {
    const intent = parsePrompt(query);
    assert.equal(scorePrompt(candidate, query, intent).passed, true, query);
  }
});

test('100ft title normalization matches 100 Foot spelling', () => {
  assert.equal(normalizeTitle('100ft Wave'), normalizeTitle('100 Foot Wave'));
});


test('TVMaze Documentary type satisfies documentary format even when genres are Sports', () => {
  const intent = parsePrompt('surfing documentary');
  const wave = show({
    name: '100 Foot Wave',
    type: 'Documentary',
    genres: ['Sports'],
    summary: 'A series about surfing pioneer Garrett McNamara and big-wave surfing in Nazare.',
  });
  assert.equal(scorePrompt(wave, intent.raw, intent).passed, true);
});


test('true crime documentary rejects fictional crime drama', () => {
  const intent = parsePrompt('true crime documentary');
  const fiction = show({ type: 'Scripted', genres: ['Crime', 'Drama'], summary: 'A detective investigates a serial killer murder case.' });
  assert.equal(scorePrompt(fiction, intent.raw, intent).passed, false);
  const doc = show({ type: 'Documentary', genres: ['Crime'], summary: 'A true crime documentary examining an unsolved murder case.' });
  assert.equal(scorePrompt(doc, intent.raw, intent).passed, true);
});

test('preferred genres are a soft ranking boost, not a hard filter', () => {
  const intent = parsePrompt('something gripping');
  intent.preferredGenres = ['Documentary'];
  const doc = show({ type: 'Documentary', genres: ['Documentary'], summary: 'A gripping investigation full of suspense and danger.' });
  const drama = show({ type: 'Scripted', genres: ['Drama'], summary: 'A gripping investigation full of suspense and danger.' });
  assert.equal(scorePrompt(drama, intent.raw, intent).passed, true);
  assert.ok(scorePrompt(doc, intent.raw, intent).score > scorePrompt(drama, intent.raw, intent).score);
});

test('explicit romantic drama requires real Romance and Drama metadata', () => {
  const intent = parsePrompt('romantic drama');
  const falsePositive = show({
    name: 'Historical Action Story',
    genres: ['Drama', 'Action', 'History'],
    summary: 'A warrior has an intense relationship while fighting for survival.',
  });
  const realMatch = show({
    name: 'Actual Romance',
    genres: ['Drama', 'Romance'],
    summary: 'Two people fall in love while navigating family expectations.',
  });
  assert.equal(scorePrompt(falsePositive, intent.raw, intent).passed, false);
  assert.equal(scorePrompt(realMatch, intent.raw, intent).passed, true);
});

test('drug crime action drama requires drug-topic evidence as well as all genres', () => {
  const intent = parsePrompt('drug crime action drama');
  assert.ok(intent.topicGroups.includes('drugs'));
  assert.deepEqual(intent.requiredGenres.sort(), ['Action', 'Crime', 'Drama'].sort());

  const buffyLike = show({
    name: 'Vampire Slayer',
    genres: ['Drama', 'Action', 'Supernatural'],
    summary: 'A teenager fights vampires and demons.',
  });
  const genericCrimeAction = show({
    name: 'City Vigilante',
    genres: ['Drama', 'Action', 'Crime'],
    summary: 'A masked vigilante fights organized crime across the city.',
  });
  const drugCrime = show({
    name: 'Cartel City',
    genres: ['Drama', 'Action', 'Crime'],
    summary: 'Detectives battle a cocaine cartel and a violent drug trafficking network.',
  });

  assert.equal(scorePrompt(buffyLike, intent.raw, intent).passed, false);
  assert.equal(scorePrompt(genericCrimeAction, intent.raw, intent).passed, false);
  assert.equal(scorePrompt(drugCrime, intent.raw, intent).passed, true);
});

test('compound prompt confidence is meaningful rather than automatically 100', () => {
  const intent = parsePrompt('drug crime action drama');
  const candidate = show({
    name: 'Cartel City',
    genres: ['Drama', 'Action', 'Crime'],
    summary: 'Detectives battle a cocaine cartel and a violent drug trafficking network.',
    rating: { average: 8.2 },
  });
  const result = scorePrompt(candidate, intent.raw, intent);
  assert.equal(result.passed, true);
  assert.ok(result.confidence >= 90 && result.confidence < 100);
});


test('season count is not treated as a recommendation constraint', () => {
  const intent = parsePrompt('a thriller under 3 seasons');
  assert.equal('maxSeasons' in intent, false);
  const longRunner = show({ genres: ['Thriller'], _embedded: { seasons: [{}, {}, {}, {}, {}, {}] }, summary: 'A tense conspiracy.' });
  assert.equal(scorePrompt(longRunner, intent.raw, intent).passed, true);
});

test('WW2 documentary keeps World War II as a hard era constraint', () => {
  const intent = parsePrompt('WW2 documentary');
  assert.ok(intent.requiredGenres.includes('Documentary'));
  assert.ok(intent.eraGroups.includes('ww2'));
  const nature = show({ type: 'Documentary', genres: ['Nature'], summary: 'Wildlife across remote islands.' });
  const war = show({ type: 'Documentary', genres: ['History'], summary: 'The Second World War from 1939 to 1945, including Allied forces and Nazi Germany.' });
  assert.equal(scorePrompt(nature, intent.raw, intent).passed, false);
  assert.equal(scorePrompt(war, intent.raw, intent).passed, true);
});

test('British crime comedy requires British origin evidence', () => {
  const intent = parsePrompt('funny British crime show');
  assert.ok(intent.requiredGenres.includes('Crime'));
  assert.ok(intent.requiredGenres.includes('Comedy'));
  assert.ok(intent.originGroups.includes('british'));
  const american = show({ genres: ['Comedy', 'Crime'], network: { country: { code: 'US', name: 'United States' } }, summary: 'Detectives solve crimes with jokes.' });
  const british = show({ genres: ['Comedy', 'Crime'], network: { country: { code: 'GB', name: 'United Kingdom' } }, summary: 'Detectives solve crimes with jokes.' });
  assert.equal(scorePrompt(american, intent.raw, intent).passed, false);
  assert.equal(scorePrompt(british, intent.raw, intent).passed, true);
});

test('period romance does not collapse into generic romance', () => {
  const intent = parsePrompt('romantic period drama');
  assert.ok(intent.eraGroups.includes('period'));
  const modern = show({ genres: ['Drama', 'Romance'], summary: 'A modern relationship in present-day New York.' });
  const period = show({ genres: ['Drama', 'Romance', 'History'], summary: 'A historical drama about a family estate and romance.' });
  assert.equal(scorePrompt(modern, intent.raw, intent).passed, false);
  assert.equal(scorePrompt(period, intent.raw, intent).passed, true);
});

test('Korean revenge thriller keeps origin and unknown subject intent', () => {
  const intent = parsePrompt('Korean revenge thriller');
  assert.ok(intent.originGroups.includes('korean'));
  assert.ok(intent.semanticTerms.includes('revenge'));
  const wrong = show({ genres: ['Thriller'], network: { country: { code: 'KR', name: 'Korea, Republic of' } }, summary: 'A tense political conspiracy.' });
  const right = show({ genres: ['Thriller'], network: { country: { code: 'KR', name: 'Korea, Republic of' } }, summary: 'A woman seeks revenge after a betrayal.' });
  assert.equal(scorePrompt(wrong, intent.raw, intent).passed, false);
  assert.equal(scorePrompt(right, intent.raw, intent).passed, true);
});

test('generic subject fallback retains Formula 1 instead of dropping it', () => {
  const intent = parsePrompt('Formula 1 documentary');
  assert.ok(intent.semanticTerms.includes('formula 1'));
  const unrelated = show({ type: 'Documentary', genres: ['Sports'], summary: 'A documentary about professional tennis.' });
  const f1 = show({ type: 'Documentary', genres: ['Sports'], summary: 'Formula One drivers compete across the F1 season and Grand Prix circuit.' });
  assert.equal(scorePrompt(unrelated, intent.raw, intent).passed, false);
  assert.equal(scorePrompt(f1, intent.raw, intent).passed, true);
});

test('cartel wording is more specific than generic drug subject', () => {
  const intent = parsePrompt('drug cartel action drama');
  assert.ok(intent.topicGroups.includes('drugs'));
  assert.ok(intent.topicQualifierTerms.includes('cartel'));
  const genericDrugs = show({ genres: ['Action', 'Drama'], summary: 'Police investigate street drug dealers and narcotics.' });
  const cartel = show({ genres: ['Action', 'Drama'], summary: 'Agents infiltrate a cocaine cartel controlling the drug trade.' });
  assert.equal(scorePrompt(genericDrugs, intent.raw, intent).passed, false);
  assert.equal(scorePrompt(cartel, intent.raw, intent).passed, true);
});

test('vampire wording is stricter than generic supernatural subject', () => {
  const intent = parsePrompt('vampire action drama');
  assert.ok(intent.topicGroups.includes('supernatural'));
  assert.ok(intent.topicQualifierTerms.includes('vampire'));
  const ghosts = show({ genres: ['Action', 'Drama'], summary: 'Hunters battle ghosts and demons.' });
  const vampires = show({ genres: ['Action', 'Drama'], summary: 'A vampire hunter battles ancient vampires.' });
  assert.equal(scorePrompt(ghosts, intent.raw, intent).passed, false);
  assert.equal(scorePrompt(vampires, intent.raw, intent).passed, true);
});

test('descriptive semantic prompts are not mistaken for exact titles', () => {
  assert.equal(looksLikeTitleLookup('Korean revenge thriller'), false);
  assert.equal(looksLikeTitleLookup('WW2 documentary'), false);
  assert.equal(looksLikeTitleLookup('funny British crime show'), false);
});

test('courtroom drama rejects a superhero who is merely a lawyer', () => {
  const intent = parsePrompt('courtroom drama');
  const daredevilLike = show({
    name: 'Masked Advocate',
    genres: ['Drama', 'Action', 'Crime'],
    summary: 'A blind lawyer fights criminals at night as a masked vigilante.',
  });
  const courtroom = show({
    name: 'The Trial',
    genres: ['Drama', 'Legal'],
    summary: 'Attorneys argue a murder trial in the courtroom before a judge and jury.',
  });
  assert.equal(scorePrompt(daredevilLike, intent.raw, intent).passed, false);
  assert.equal(scorePrompt(courtroom, intent.raw, intent).passed, true);
});

test('Korean origin cannot be inferred from unrelated synopsis text or language', () => {
  const intent = parsePrompt('Korean revenge thriller');
  const breakingBadLike = show({
    name: 'American Crime Story',
    genres: ['Thriller'],
    network: { country: { code: 'US', name: 'United States' } },
    language: 'English',
    summary: 'An American man seeks revenge after entering the drug trade.',
  });
  assert.equal(scorePrompt(breakingBadLike, intent.raw, intent).passed, false);
});

test('1990s teen drama requires both 1990s evidence and teen evidence', () => {
  const intent = parsePrompt('90s teen drama');
  assert.ok(intent.eraGroups.includes('1990s'));
  assert.ok(intent.topicGroups.includes('teen'));
  const modernTeen = show({ premiered: '2021-01-01', genres: ['Drama'], summary: 'Teenagers navigate high school and friendship.' });
  const ninetiesAdult = show({ premiered: '1996-01-01', genres: ['Drama'], summary: 'Adults navigate corporate politics.' });
  const right = show({ premiered: '1997-01-01', genres: ['Drama'], summary: 'Teenagers navigate high school, friendship and coming of age.' });
  assert.equal(scorePrompt(modernTeen, intent.raw, intent).passed, false);
  assert.equal(scorePrompt(ninetiesAdult, intent.raw, intent).passed, false);
  assert.equal(scorePrompt(right, intent.raw, intent).passed, true);
});

test('South African crime drama requires South African origin evidence', () => {
  const intent = parsePrompt('South African crime drama');
  const us = show({ genres: ['Crime', 'Drama'], network: { country: { code: 'US', name: 'United States' } }, summary: 'Detectives investigate a murder.' });
  const za = show({ genres: ['Crime', 'Drama'], network: { country: { code: 'ZA', name: 'South Africa' } }, summary: 'Detectives investigate a murder.' });
  assert.equal(scorePrompt(us, intent.raw, intent).passed, false);
  assert.equal(scorePrompt(za, intent.raw, intent).passed, true);
});

test('Formula 1 documentary rejects generic sports documentaries', () => {
  const intent = parsePrompt('Formula 1 documentary');
  const generic = show({ type: 'Documentary', genres: ['Sports'], summary: 'Elite athletes compete for a championship.' });
  const motorsport = show({ type: 'Documentary', genres: ['Sports'], summary: 'Formula One teams and drivers compete through a Grand Prix season.' });
  assert.equal(scorePrompt(generic, intent.raw, intent).passed, false);
  assert.equal(scorePrompt(motorsport, intent.raw, intent).passed, true);
});
