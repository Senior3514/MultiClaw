import { DEFAULT_PROVIDERS } from '../model-layer/providers.js';
import { ProviderRegistry } from '../model-layer/provider-registry.js';
import { ModelRouter } from '../model-layer/router.js';
import { executePlan } from '../model-layer/live-executor.js';

const registry = new ProviderRegistry();
registry.registerMany(DEFAULT_PROVIDERS);

const router = new ModelRouter(registry);
const plan = router.plan({
  capability: 'chat',
  priority: 'quality',
  budget: 'balanced',
  privacy: 'standard',
  preferredProviders: ['openai'],
  allowedProviders: ['openai', 'openrouter', 'groq', 'ollama', 'anthropic', 'google'],
  retries: 1,
  maxFallbacks: 3,
  timeoutMs: 30000,
});

console.log('# Execution plan');
console.log(JSON.stringify({
  primary: plan.primary?.id,
  fallbacks: plan.fallbacks.map((provider) => provider.id),
  execution: plan.execution,
  reason: plan.reason,
}, null, 2));

const result = await executePlan(plan, {
  prompt: 'Reply with exactly: MULTICLAW_LIVE_OK',
  temperature: 0,
});

console.log('\n# Live execution result');
console.log(JSON.stringify({
  ok: result.ok,
  provider: result.provider?.id,
  attempts: result.attempts,
  output: result.result?.output,
  error: result.error,
}, null, 2));
