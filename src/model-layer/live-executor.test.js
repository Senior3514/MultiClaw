import test from 'node:test';
import assert from 'node:assert/strict';

import { executePlan } from './live-executor.js';

test('executePlan succeeds on the primary provider', async () => {
  const plan = {
    primary: {
      id: 'openai',
      apiStyle: 'openai-compatible',
      apiKeyEnv: 'OPENAI_API_KEY',
      defaultBaseUrl: 'https://api.openai.com/v1',
      baseUrlEnv: 'OPENAI_BASE_URL',
      defaultModel: 'gpt-4o-mini',
      modelEnv: 'OPENAI_MODEL',
    },
    fallbacks: [],
    execution: { timeoutMs: 1000, retries: 0, structuredOutput: 'none', failurePolicy: 'retry-then-fallback' },
  };

  const fetchImpl = async () => ({
    ok: true,
    json: async () => ({ choices: [{ message: { content: 'MULTICLAW_OK' } }] }),
  });

  const result = await executePlan(plan, { prompt: 'say MULTICLAW_OK' }, {
    fetchImpl,
    env: { OPENAI_API_KEY: 'test-key' },
  });

  assert.equal(result.ok, true);
  assert.equal(result.result.output, 'MULTICLAW_OK');
  assert.deepEqual(result.attempts.map((attempt) => attempt.action), ['success']);
});

test('executePlan falls back after a retryable primary failure', async () => {
  let calls = 0;
  const plan = {
    primary: {
      id: 'openrouter',
      apiStyle: 'openai-compatible',
      apiKeyEnv: 'OPENROUTER_API_KEY',
      defaultBaseUrl: 'https://openrouter.ai/api/v1',
      baseUrlEnv: 'OPENROUTER_BASE_URL',
      defaultModel: 'openai/gpt-4o-mini',
      modelEnv: 'OPENROUTER_MODEL',
    },
    fallbacks: [
      {
        id: 'openai',
        apiStyle: 'openai-compatible',
        apiKeyEnv: 'OPENAI_API_KEY',
        defaultBaseUrl: 'https://api.openai.com/v1',
        baseUrlEnv: 'OPENAI_BASE_URL',
        defaultModel: 'gpt-4o-mini',
        modelEnv: 'OPENAI_MODEL',
      },
    ],
    execution: { timeoutMs: 1000, retries: 0, structuredOutput: 'none', failurePolicy: 'retry-then-fallback' },
  };

  const fetchImpl = async (url) => {
    calls += 1;
    if (url.includes('openrouter')) {
      return {
        ok: false,
        status: 503,
        text: async () => 'temporarily unavailable',
      };
    }

    return {
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'FALLBACK_OK' } }] }),
    };
  };

  const result = await executePlan(plan, { prompt: 'say FALLBACK_OK' }, {
    fetchImpl,
    env: { OPENAI_API_KEY: 'test-key', OPENROUTER_API_KEY: 'router-key' },
  });

  assert.equal(result.ok, true);
  assert.equal(result.result.output, 'FALLBACK_OK');
  assert.equal(calls, 2);
  assert.deepEqual(result.attempts.map((attempt) => attempt.providerId), ['openrouter', 'openai']);
});

test('executePlan falls back when the first provider has no key or connector', async () => {
  const plan = {
    primary: {
      id: 'anthropic',
      apiStyle: 'anthropic',
      apiKeyEnv: 'ANTHROPIC_API_KEY',
      defaultModel: 'claude-3-5-sonnet-latest',
      modelEnv: 'ANTHROPIC_MODEL',
    },
    fallbacks: [
      {
        id: 'openai',
        apiStyle: 'openai-compatible',
        apiKeyEnv: 'OPENAI_API_KEY',
        defaultBaseUrl: 'https://api.openai.com/v1',
        baseUrlEnv: 'OPENAI_BASE_URL',
        defaultModel: 'gpt-4o-mini',
        modelEnv: 'OPENAI_MODEL',
      },
    ],
    execution: { timeoutMs: 1000, retries: 0, structuredOutput: 'none', failurePolicy: 'retry-then-fallback' },
  };

  const fetchImpl = async () => ({
    ok: true,
    json: async () => ({ choices: [{ message: { content: 'OPENAI_RECOVERED' } }] }),
  });

  const result = await executePlan(plan, { prompt: 'say OPENAI_RECOVERED' }, {
    fetchImpl,
    env: { OPENAI_API_KEY: 'test-key' },
  });

  assert.equal(result.ok, true);
  assert.equal(result.result.output, 'OPENAI_RECOVERED');
  assert.equal(result.attempts[0].providerId, 'anthropic');
  assert.equal(result.attempts[0].failure.type, 'provider-unavailable');
  assert.equal(result.attempts[1].providerId, 'openai');
});
