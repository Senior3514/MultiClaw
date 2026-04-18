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

test('excluded providers remove otherwise winning candidate', () => {
  const router = buildRouter();
  const result = router.select({ capability: 'chat', privacy: 'strict', excludedProviders: ['ollama'] });
  assert.notEqual(result.provider.id, 'ollama');
});

test('unsupported capability returns null provider instead of crashing the routing result', () => {
  const router = buildRouter();
  const result = router.select({ capability: 'quantum-planning' });
  assert.equal(result.provider, null);
  assert.match(result.reason, /Unsupported capability/);
});

test('registry rejects malformed provider definitions', () => {
  const registry = new ProviderRegistry();
  assert.throws(() => {
    registry.register({
      id: 'broken',
      label: 'Broken',
      deployment: 'cloud',
      capabilities: ['chat'],
      scores: { quality: 1, speed: 1, privacy: 1 },
    });
  }, /finite cost score/);
});

test('router skips providers marked as not ready by default', () => {
  const registry = new ProviderRegistry();
  registry.register({
    id: 'offline-best',
    label: 'Offline Best',
    deployment: 'local',
    capabilities: ['chat'],
    ready: false,
    scores: { quality: 10, speed: 10, cost: 10, privacy: 10 },
  });
  registry.register({
    id: 'online-good',
    label: 'Online Good',
    deployment: 'cloud',
    capabilities: ['chat'],
    scores: { quality: 7, speed: 7, cost: 7, privacy: 7 },
  });

  const router = new ModelRouter(registry);
  const result = router.select({ capability: 'chat' });
  assert.equal(result.provider.id, 'online-good');
});

test('execution plan returns primary provider with fallback chain', () => {
  const router = buildRouter();
  const plan = router.plan({ capability: 'chat', priority: 'quality', privacy: 'standard', maxFallbacks: 2 });
  assert.ok(plan.primary);
  assert.ok(Array.isArray(plan.fallbacks));
  assert.ok(plan.fallbacks.length <= 2);
  assert.ok(plan.fallbacks.every((provider) => provider.id !== plan.primary.id));
});

test('execution plan normalizes retries, timeout, and malformed output handling', () => {
  const router = buildRouter();
  const plan = router.plan({
    capability: 'reasoning',
    retries: 9,
    timeoutMs: 999999,
    structuredOutput: 'strict-json',
    failurePolicy: 'retry-then-fallback',
  });
  assert.equal(plan.execution.retries, 4);
  assert.equal(plan.execution.timeoutMs, 180000);
  assert.equal(plan.execution.structuredOutput, 'strict-json');
  assert.equal(plan.execution.malformedOutputAction, 'retry-then-fallback');
});

test('execution plan returns no primary when capability is unsupported', () => {
  const router = buildRouter();
  const plan = router.plan({ capability: 'quantum-planning', structuredOutput: 'json' });
  assert.equal(plan.primary, null);
  assert.equal(plan.fallbacks.length, 0);
  assert.equal(plan.execution.structuredOutput, 'json');
});

test('preferred deployments can boost local providers in fallback planning', () => {
  const router = buildRouter();
  const plan = router.plan({ capability: 'chat', preferredDeployments: ['local'], privacy: 'standard' });
  assert.equal(plan.primary.id, 'ollama');
});
