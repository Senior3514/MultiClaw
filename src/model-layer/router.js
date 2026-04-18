import { isCapabilitySupported } from './capabilities.js';

const VALID_PRIORITIES = new Set(['balanced', 'quality', 'speed']);
const VALID_PRIVACY = new Set(['standard', 'high', 'strict']);
const VALID_BUDGETS = new Set(['balanced', 'low', 'high']);
const VALID_STRUCTURED_OUTPUT = new Set(['none', 'json', 'strict-json']);
const VALID_FAILURE_POLICIES = new Set(['fail-fast', 'retry', 'retry-then-fallback']);
const DEFAULT_TIMEOUTS_MS = {
  chat: 30000,
  reasoning: 45000,
  vision: 45000,
  'speech-to-text': 60000,
  'text-to-speech': 45000,
  embeddings: 15000,
  'image-generation': 90000,
  'video-generation': 120000,
  'tool-use': 45000,
};

function normalizeEnum(value, validValues, fallback) {
  if (!value) return fallback;
  return validValues.has(value) ? value : fallback;
}

function normalizePriority(priority) {
  return normalizeEnum(priority, VALID_PRIORITIES, 'balanced');
}

function normalizePrivacy(privacy) {
  return normalizeEnum(privacy, VALID_PRIVACY, 'standard');
}

function normalizeBudget(budget) {
  return normalizeEnum(budget, VALID_BUDGETS, 'balanced');
}

function normalizeStructuredOutput(mode) {
  return normalizeEnum(mode, VALID_STRUCTURED_OUTPUT, 'none');
}

function normalizeFailurePolicy(policy) {
  return normalizeEnum(policy, VALID_FAILURE_POLICIES, 'retry-then-fallback');
}

function normalizeRetries(retries) {
  if (!Number.isFinite(retries)) return 1;
  return Math.max(0, Math.min(4, Math.trunc(retries)));
}

function normalizeFallbackCount(count) {
  if (!Number.isFinite(count)) return 2;
  return Math.max(0, Math.min(4, Math.trunc(count)));
}

function normalizeTimeoutMs(timeoutMs, capability) {
  if (Number.isFinite(timeoutMs)) {
    return Math.max(5000, Math.min(180000, Math.trunc(timeoutMs)));
  }
  return DEFAULT_TIMEOUTS_MS[capability] || 30000;
}

function scoreProvider(provider, options) {
  const priority = normalizePriority(options.priority);
  const privacy = normalizePrivacy(options.privacy);
  const budget = normalizeBudget(options.budget);
  const preferredProviders = options.preferredProviders || [];

  let score = 0;

  if (priority === 'quality') score += provider.scores.quality * 3 + provider.scores.speed;
  else if (priority === 'speed') score += provider.scores.speed * 3 + provider.scores.quality;
  else score += provider.scores.quality * 2 + provider.scores.speed * 2;

  if (budget === 'low') score += provider.scores.cost * 3;
  else if (budget === 'high') score += provider.scores.quality;
  else score += provider.scores.cost * 1.5;

  if (privacy === 'strict') {
    score += provider.scores.privacy * 4;
    if (provider.deployment === 'local') score += 10;
    else score -= 10;
  } else if (privacy === 'high') {
    score += provider.scores.privacy * 2.5;
  } else {
    score += provider.scores.privacy;
  }

  if (preferredProviders.includes(provider.id)) {
    score += 6;
  }

  return score;
}

export class ModelRouter {
  constructor(registry) {
    this.registry = registry;
  }

  select(options) {
    const { capability } = options;

    if (!capability) {
      throw new Error('Router selection requires a capability');
    }

    if (!isCapabilitySupported(capability)) {
      return {
        provider: null,
        reason: `Unsupported capability requested: ${capability}`,
        candidates: [],
      };
    }

    let candidates = this.registry.byCapability(capability);
    const filters = [];

    if (options.requireReady !== false) {
      candidates = candidates.filter((provider) => provider.ready !== false);
      filters.push('ready');
    }

    if (options.allowedDeployments?.length) {
      candidates = candidates.filter((provider) => options.allowedDeployments.includes(provider.deployment));
      filters.push(`deployments:${options.allowedDeployments.join(',')}`);
    }

    if (options.allowedProviders?.length) {
      candidates = candidates.filter((provider) => options.allowedProviders.includes(provider.id));
      filters.push(`allowedProviders:${options.allowedProviders.join(',')}`);
    }

    if (options.excludedProviders?.length) {
      candidates = candidates.filter((provider) => !options.excludedProviders.includes(provider.id));
      filters.push(`excludedProviders:${options.excludedProviders.join(',')}`);
    }

    if (!candidates.length) {
      return {
        provider: null,
        reason: `No providers available for capability: ${capability}${filters.length ? ` after filters (${filters.join('; ')})` : ''}`,
        candidates: [],
      };
    }

    const normalizedOptions = {
      ...options,
      priority: normalizePriority(options.priority),
      budget: normalizeBudget(options.budget),
      privacy: normalizePrivacy(options.privacy),
    };

    const ranked = candidates
      .map((provider) => {
        const deploymentBoost = options.preferredDeployments?.includes(provider.deployment) ? 4 : 0;
        return { provider, score: scoreProvider(provider, normalizedOptions) + deploymentBoost };
      })
      .sort((a, b) => b.score - a.score);

    return {
      provider: ranked[0].provider,
      reason: `Selected ${ranked[0].provider.id} for ${capability}${filters.length ? ` with filters (${filters.join('; ')})` : ''}`,
      candidates: ranked,
    };
  }

  plan(options) {
    const selection = this.select(options);
    const structuredOutput = normalizeStructuredOutput(options.structuredOutput);
    const failurePolicy = normalizeFailurePolicy(options.failurePolicy);
    const retries = normalizeRetries(options.retries);
    const maxFallbacks = normalizeFallbackCount(options.maxFallbacks);
    const timeoutMs = normalizeTimeoutMs(options.timeoutMs, options.capability);

    if (!selection.provider) {
      return {
        primary: null,
        fallbacks: [],
        execution: {
          timeoutMs,
          retries,
          structuredOutput,
          failurePolicy,
          malformedOutputAction: structuredOutput === 'none' ? 'none' : 'fail',
        },
        reason: selection.reason,
        candidates: selection.candidates,
      };
    }

    const fallbacks = selection.candidates
      .map((candidate) => candidate.provider)
      .filter((provider) => provider.id !== selection.provider.id)
      .slice(0, maxFallbacks);

    const malformedOutputAction = structuredOutput === 'none'
      ? 'none'
      : failurePolicy === 'fail-fast'
        ? 'fail'
        : failurePolicy === 'retry'
          ? 'retry'
          : 'retry-then-fallback';

    return {
      primary: selection.provider,
      fallbacks,
      execution: {
        timeoutMs,
        retries,
        structuredOutput,
        failurePolicy,
        malformedOutputAction,
      },
      reason: `${selection.reason}; execution plan prepared with ${fallbacks.length} fallback${fallbacks.length === 1 ? '' : 's'}`,
      candidates: selection.candidates,
    };
  }
}
