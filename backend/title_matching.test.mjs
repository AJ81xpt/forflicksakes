import test from 'node:test';
import assert from 'node:assert/strict';

const normalizeTitle = (value) => String(value || '')
  .toLowerCase()
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/&/g, ' and ')
  .replace(/[^a-z0-9]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

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

function similarity(a, b) {
  const left = normalizeTitle(a);
  const right = normalizeTitle(b);
  return 1 - levenshteinDistance(left, right) / Math.max(left.length, right.length);
}

test('Severence strongly matches Severance', () => {
  assert.ok(similarity('Severence', 'Severance') > 0.85);
});

test('descriptive prompt does not strongly match Severance', () => {
  assert.ok(similarity('something dark', 'Severance') < 0.5);
});
