import test from 'node:test';
import assert from 'node:assert/strict';

import { DEFAULT_PROVIDERS } from './providers.js';
import { ProviderRegistry } from './provider-registry.js';
import { ModelRouter } from './router.js';

function buildRouter() {
  const registry = new ProviderRegistry();
  registry.registerMany(DEFAULT_PROVIDERS);
  return new ModelRouter(registry);
}

test('strict privacy prefers local deployment when capable', () => {
  const router = buildRouter();
  const result = router.select({ capability: 'chat', priority: 'balanced', budget: 'low', privacy: 'strict' });
  assert.equal(result.provider.id, 'ollama');
});

test('vision selects a provider that supports vision', () => {
  const router = buildRouter();
  const result = router.select({ capability: 'vision', priority: 'quality', budget: 'balanced', privacy: 'standard' });
  assert.ok(result.provider.capabilities.includes('vision'));
});

test('returns null provider when capability has no candidates after deployment filter', () => {
  const router = buildRouter();
  const result = router.select({ capability: 'vision', allowedDeployments: ['local'] });
  assert.equal(result.provider, null);
});
