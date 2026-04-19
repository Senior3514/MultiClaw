import { advanceExecutionPlan, createExecutionState } from './execution-policy.js';

function providerChain(plan) {
  return [plan?.primary, ...(plan?.fallbacks || [])].filter(Boolean);
}

function timeoutSignal(timeoutMs) {
  if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
    return AbortSignal.timeout(timeoutMs);
  }

  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeoutMs);
  return controller.signal;
}

function normalizeMessages(request) {
  if (Array.isArray(request?.messages) && request.messages.length) {
    return request.messages;
  }

  return [
    {
      role: 'user',
      content: request?.prompt || 'Reply with a short acknowledgement.',
    },
  ];
}

function resolveProviderRuntime(provider, env = process.env) {
  return {
    ...provider,
    apiKey: provider.apiKeyEnv ? env[provider.apiKeyEnv] : '',
    baseUrl: provider.baseUrlEnv ? (env[provider.baseUrlEnv] || provider.defaultBaseUrl) : provider.defaultBaseUrl,
    model: provider.modelEnv ? (env[provider.modelEnv] || provider.defaultModel) : provider.defaultModel,
  };
}

function createFailure(type, message, extra = {}) {
  return { type, message, ...extra };
}

function normalizeHttpFailure(provider, response, bodyText = '') {
  if (response.status === 401 || response.status === 403) {
    return createFailure('provider-unavailable', `${provider.id} rejected authentication`, { status: response.status, bodyText });
  }

  if (response.status === 408 || response.status === 429 || response.status >= 500) {
    return createFailure('network', `${provider.id} returned ${response.status}`, { status: response.status, bodyText });
  }

  return createFailure('unknown', `${provider.id} returned ${response.status}`, { status: response.status, bodyText });
}

async function invokeOpenAiCompatible(provider, request, execution, fetchImpl, env) {
  const runtime = resolveProviderRuntime(provider, env);

  if (!runtime.baseUrl) {
    throw createFailure('provider-unavailable', `${provider.id} has no configured base URL`);
  }

  if (provider.id !== 'ollama' && !runtime.apiKey) {
    throw createFailure('provider-unavailable', `${provider.id} is missing ${provider.apiKeyEnv}`);
  }

  const response = await fetchImpl(`${runtime.baseUrl.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(runtime.apiKey ? { Authorization: `Bearer ${runtime.apiKey}` } : {}),
      ...(provider.id === 'openrouter' ? { 'HTTP-Referer': 'https://multiclaw.local', 'X-Title': 'MultiClaw' } : {}),
    },
    body: JSON.stringify({
      model: runtime.model,
      messages: normalizeMessages(request),
      temperature: request?.temperature ?? 0.2,
      response_format: execution?.structuredOutput && execution.structuredOutput !== 'none'
        ? { type: 'json_object' }
        : undefined,
    }),
    signal: timeoutSignal(execution?.timeoutMs || 30000),
  });

  if (!response.ok) {
    const bodyText = await response.text().catch(() => '');
    throw normalizeHttpFailure(provider, response, bodyText);
  }

  const payload = await response.json();
  const message = payload?.choices?.[0]?.message?.content;

  if (!message || typeof message !== 'string') {
    throw createFailure('malformed-output', `${provider.id} returned no assistant message`, { payload });
  }

  return {
    providerId: provider.id,
    model: runtime.model,
    output: message,
    raw: payload,
  };
}

async function invokeProvider(provider, request, execution, fetchImpl, env) {
  if (provider.apiStyle === 'openai-compatible') {
    return invokeOpenAiCompatible(provider, request, execution, fetchImpl, env);
  }

  throw createFailure('provider-unavailable', `${provider.id} connector is not implemented yet`);
}

function normalizeThrownFailure(error) {
  if (error?.type) return error;
  if (error?.name === 'TimeoutError' || error?.name === 'AbortError') {
    return createFailure('timeout', error.message || 'Request timed out');
  }
  if (error instanceof TypeError) {
    return createFailure('network', error.message || 'Network error');
  }
  return createFailure('unknown', error?.message || 'Unknown provider failure');
}

export async function executePlan(plan, request, options = {}) {
  const fetchImpl = options.fetchImpl || globalThis.fetch;
  const env = options.env || process.env;
  const chain = providerChain(plan);

  if (!fetchImpl) {
    throw new Error('executePlan requires a fetch implementation');
  }

  if (!chain.length) {
    return {
      ok: false,
      state: { providerIndex: -1, retryCount: 0, completed: false, failed: true },
      attempts: [],
      error: createFailure('provider-unavailable', 'No providers available in plan'),
    };
  }

  let state = createExecutionState(plan);
  const attempts = [];

  while (!state.failed && !state.completed && state.providerIndex >= 0) {
    const provider = chain[state.providerIndex];
    try {
      const result = await invokeProvider(provider, request, plan.execution || {}, fetchImpl, env);
      state = { ...state, completed: true, failed: false };
      attempts.push({ providerId: provider.id, action: 'success' });
      return { ok: true, provider, state, attempts, result };
    } catch (error) {
      const failure = normalizeThrownFailure(error);
      attempts.push({ providerId: provider.id, action: 'failure', failure });
      const decision = advanceExecutionPlan(plan, state, failure);
      state = decision.state;
      if (decision.action === 'fail') {
        return { ok: false, provider, state, attempts, error: failure, decision };
      }
    }
  }

  return {
    ok: false,
    state,
    attempts,
    error: createFailure('unknown', 'Execution loop exited unexpectedly'),
  };
}
