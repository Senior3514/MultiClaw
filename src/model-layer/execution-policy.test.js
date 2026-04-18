import test from 'node:test';
import assert from 'node:assert/strict';

import { createExecutionState, advanceExecutionPlan } from './execution-policy.js';

const samplePlan = {
  primary: { id: 'openai' },
  fallbacks: [{ id: 'google' }, { id: 'ollama' }],
  execution: {
    retries: 1,
    failurePolicy: 'retry-then-fallback',
    malformedOutputAction: 'retry-then-fallback',
  },
};

test('createExecutionState starts on the primary provider', () => {
  const state = createExecutionState(samplePlan);
  assert.equal(state.providerIndex, 0);
  assert.equal(state.retryCount, 0);
  assert.equal(state.failed, false);
});

test('timeout retries the current provider first', () => {
  const state = createExecutionState(samplePlan);
  const result = advanceExecutionPlan(samplePlan, state, { type: 'timeout' });
  assert.equal(result.action, 'retry');
  assert.equal(result.provider.id, 'openai');
  assert.equal(result.state.retryCount, 1);
});

test('timeout falls back after retries are exhausted', () => {
  const state = { providerIndex: 0, retryCount: 1, completed: false, failed: false };
  const result = advanceExecutionPlan(samplePlan, state, { type: 'timeout' });
  assert.equal(result.action, 'fallback');
  assert.equal(result.provider.id, 'google');
  assert.equal(result.state.providerIndex, 1);
  assert.equal(result.state.retryCount, 0);
});

test('malformed output can fail fast when policy says fail', () => {
  const plan = {
    ...samplePlan,
    execution: {
      retries: 2,
      failurePolicy: 'fail-fast',
      malformedOutputAction: 'fail',
    },
  };
  const state = createExecutionState(plan);
  const result = advanceExecutionPlan(plan, state, { type: 'malformed-output' });
  assert.equal(result.action, 'fail');
  assert.equal(result.state.failed, true);
});

test('provider unavailable falls back when another provider exists', () => {
  const state = createExecutionState(samplePlan);
  const result = advanceExecutionPlan(samplePlan, state, { type: 'provider-unavailable' });
  assert.equal(result.action, 'fallback');
  assert.equal(result.provider.id, 'google');
});

test('execution fails cleanly when no providers are available', () => {
  const plan = {
    primary: null,
    fallbacks: [],
    execution: { retries: 1, failurePolicy: 'retry-then-fallback', malformedOutputAction: 'retry' },
  };
  const result = advanceExecutionPlan(plan, createExecutionState(plan), { type: 'timeout' });
  assert.equal(result.action, 'fail');
  assert.equal(result.provider, null);
});
