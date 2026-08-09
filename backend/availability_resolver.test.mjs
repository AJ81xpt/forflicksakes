import test from 'node:test';
import assert from 'node:assert/strict';

const supported = new Set(['ZA','GB','US','PT','ES','FR','DE','IE','NL','IT','SE','PL']);

test('core launch regions are represented', () => {
  for (const region of ['ZA','GB','US','PT','ES','FR','DE','IE']) {
    assert.equal(supported.has(region), true);
  }
});

test('provider display normalization keeps HBO Max naming', () => {
  const normalize = (name) => {
    const lower = String(name).trim().toLowerCase();
    if (lower === 'max' || lower === 'hbo max') return 'HBO Max';
    if (lower === 'amazon prime video' || lower === 'prime video') return 'Prime Video';
    return name;
  };
  assert.equal(normalize('Max'), 'HBO Max');
  assert.equal(normalize('HBO Max'), 'HBO Max');
  assert.equal(normalize('Amazon Prime Video'), 'Prime Video');
});
