import test from 'node:test';
import assert from 'node:assert/strict';
import {
  auditPrompt,
  parsePrompt,
  rankMoodShows,
  rankPromptShows,
} from './recommendation_engine.js';

const show = ({
  id,
  name,
  genres,
  summary,
  status = 'Ended',
  seasons = 2,
  runtime = 45,
  rating = 8,
}) => ({
  id,
  name,
  genres,
  summary,
  status,
  averageRuntime: runtime,
  rating: { average: rating },
  weight: 80,
  image: { medium: 'poster.jpg' },
  _embedded: { seasons: Array.from({ length: seasons }, (_, index) => ({ id: index + 1 })) },
});

test('parses strict thriller constraints', () => {
  const intent = parsePrompt('A completed thriller with no more than 3 seasons');
  assert.equal(intent.completedOnly, true);
  assert.equal(intent.maxSeasons, 3);
  assert.deepEqual(intent.requiredGenres, ['Thriller']);
});

test('ordinary comedy fails a thriller request', () => {
  const intent = parsePrompt('A completed thriller with no more than 3 seasons');
  const comedy = show({
    id: 1,
    name: 'Office Laughs',
    genres: ['Comedy'],
    summary: 'A warm workplace sitcom about friends.',
  });
  const audit = auditPrompt(comedy, intent);
  assert.equal(audit.passed, false);
  assert.ok(audit.failures.some((failure) => failure.includes('Missing required genre')));
});

test('season and completed filters are hard constraints', () => {
  const intent = parsePrompt('A completed mystery with no more than 3 seasons');
  const ongoing = show({
    id: 2,
    name: 'Endless Case',
    genres: ['Mystery'],
    summary: 'A detective solves difficult cases.',
    status: 'Running',
    seasons: 5,
  });
  assert.equal(auditPrompt(ongoing, intent).passed, false);
});

test('prompt ranking never includes irrelevant comedy', () => {
  const query = 'A completed thriller with no more than 3 seasons';
  const intent = parsePrompt(query);
  const results = rankPromptShows([
    show({ id: 1, name: 'Office Laughs', genres: ['Comedy'], summary: 'A workplace sitcom.' }),
    show({ id: 2, name: 'Hidden Signal', genres: ['Thriller', 'Mystery'], summary: 'A tense conspiracy investigation.', rating: 7.8 }),
  ], query, intent);
  assert.deepEqual(results.map((item) => item.show.id), [2]);
});

test('comforting mood excludes bleak crime and keeps warm comedy', () => {
  const results = rankMoodShows([
    show({ id: 1, name: 'Warm Neighbours', genres: ['Comedy'], summary: 'A heartwarming community friendship in a small town.' }),
    show({ id: 2, name: 'Bleak Murders', genres: ['Crime', 'Drama'], summary: 'A disturbing serial killer investigation.' }),
  ], 'comforting');
  assert.deepEqual(results.map((item) => item.show.id), [1]);
});

test('dark mood is thematic and does not require dark in the title', () => {
  const results = rankMoodShows([
    show({ id: 1, name: 'The Hollow City', genres: ['Thriller', 'Drama'], summary: 'A bleak psychological conspiracy about corruption and revenge.' }),
  ], 'dark');
  assert.equal(results.length, 1);
});
