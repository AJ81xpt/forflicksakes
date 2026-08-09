import test from 'node:test';
import assert from 'node:assert/strict';

function normalizeProviderName(name = '') {
  const value = String(name).trim();
  const lower = value.toLowerCase();
  if (lower === 'max' || lower === 'hbo max') return 'HBO Max';
  if (lower === 'amazon prime video' || lower === 'prime video') return 'Prime Video';
  if (lower === 'apple tv' || lower === 'apple tv plus' || lower === 'apple tv+') return 'Apple TV+';
  return value;
}

function streamingOptionToProvider(option) {
  const service = option?.service || {};
  const link = option?.link || option?.videoLink || service?.homePage || null;
  return {
    name: normalizeProviderName(service?.name || service?.id || 'Provider'),
    type: option?.type || 'subscription',
    webUrl: link,
    price: option?.price?.amount ?? null,
  };
}

test('normalizes major provider brands', () => {
  assert.equal(normalizeProviderName('Max'), 'HBO Max');
  assert.equal(normalizeProviderName('Amazon Prime Video'), 'Prime Video');
  assert.equal(normalizeProviderName('Apple TV'), 'Apple TV+');
});

test('maps a subscription streaming option', () => {
  const provider = streamingOptionToProvider({
    service: { name: 'Netflix' },
    type: 'subscription',
    link: 'https://www.netflix.com/title/123',
  });
  assert.deepEqual(provider, {
    name: 'Netflix',
    type: 'subscription',
    webUrl: 'https://www.netflix.com/title/123',
    price: null,
  });
});

test('maps rent price without inventing values', () => {
  const provider = streamingOptionToProvider({
    service: { name: 'Prime Video' },
    type: 'rent',
    link: 'https://www.primevideo.com/detail/example',
    price: { amount: 3.99, currency: 'USD', formatted: '$3.99' },
  });
  assert.equal(provider.type, 'rent');
  assert.equal(provider.price, 3.99);
});
