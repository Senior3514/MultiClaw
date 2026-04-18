function providerChain(plan) {
  return [plan?.primary, ...(plan?.fallbacks || [])].filter(Boolean);
}

export function createExecutionState(plan) {
  const chain = providerChain(plan);
  return {
    providerIndex: chain.length ? 0 : -1,
    retryCount: 0,
    completed: false,
    failed: chain.length === 0,
  };
}

function currentProvider(plan, state) {
  const chain = providerChain(plan);
  return chain[state.providerIndex] || null;
}

function nextFallbackAvailable(plan, state) {
  const chain = providerChain(plan);
  return state.providerIndex + 1 < chain.length;
}

export function advanceExecutionPlan(plan, state, failure) {
  const chain = providerChain(plan);
  if (!chain.length) {
    return {
      action: 'fail',
      provider: null,
      state: { ...state, failed: true },
      reason: 'No providers available in execution plan',
    };
  }

  const activeState = state?.providerIndex >= 0 ? state : createExecutionState(plan);
  const provider = currentProvider(plan, activeState);
  const failureType = failure?.type || 'unknown';
  const execution = plan.execution || {};
  const canRetry = activeState.retryCount < (execution.retries || 0);
  const malformedAction = execution.malformedOutputAction || 'none';
  const failurePolicy = execution.failurePolicy || 'retry-then-fallback';

  const retryable = failureType === 'timeout'
    || failureType === 'network'
    || (failureType === 'malformed-output' && malformedAction === 'retry')
    || (failureType === 'malformed-output' && malformedAction === 'retry-then-fallback');

  if (retryable && canRetry) {
    return {
      action: 'retry',
      provider,
      state: {
        ...activeState,
        retryCount: activeState.retryCount + 1,
      },
      reason: `Retry ${provider.id} after ${failureType}`,
    };
  }

  const canFallback = nextFallbackAvailable(plan, activeState);
  const shouldFallback = failurePolicy === 'retry-then-fallback'
    && canFallback
    && (
      failureType === 'timeout'
      || failureType === 'network'
      || (failureType === 'malformed-output' && malformedAction === 'retry-then-fallback')
      || failureType === 'provider-unavailable'
    );

  if (shouldFallback) {
    const nextState = {
      ...activeState,
      providerIndex: activeState.providerIndex + 1,
      retryCount: 0,
    };
    return {
      action: 'fallback',
      provider: currentProvider(plan, nextState),
      state: nextState,
      reason: `Fallback after ${provider.id} failed with ${failureType}`,
    };
  }

  return {
    action: 'fail',
    provider,
    state: {
      ...activeState,
      failed: true,
    },
    reason: `Execution stopped after ${failureType}`,
  };
}
