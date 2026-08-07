import test from 'node:test';
import assert from 'node:assert/strict';
import { auditPrompt, looksLikeTitleLookup, normalizeTitle, parsePrompt, scoreMood, scorePrompt } from './recommendation_engine.js';

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
