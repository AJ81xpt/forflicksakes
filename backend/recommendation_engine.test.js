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
  const intent = parsePrompt('A completed thriller under 3 seasons');
  const comedy = show({ genres: ['Comedy'], summary: '<p>Friends run a cafe and make jokes.</p>' });
  assert.equal(auditPrompt(comedy, intent).passed, false);
});

test('season limit is a hard filter', () => {
  const intent = parsePrompt('A thriller under 3 seasons');
  const thriller = show({
    genres: ['Thriller'],
    summary: '<p>A tense conspiracy.</p>',
    _embedded: { seasons: [{}, {}, {}, {}] },
  });
  assert.equal(auditPrompt(thriller, intent).passed, false);
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
  const intent = parsePrompt('A completed thriller under 3 seasons with twists');
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
  assert.equal(looksLikeTitleLookup('completed thriller under 3 seasons'), false);
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
