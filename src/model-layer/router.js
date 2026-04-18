import { isCapabilitySupported } from './capabilities.js';

const VALID_PRIORITIES = new Set(['balanced', 'quality', 'speed']);
const VALID_PRIVACY = new Set(['standard', 'high', 'strict']);
const VALID_BUDGETS = new Set(['balanced', 'low', 'high']);

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
      .map((provider) => ({ provider, score: scoreProvider(provider, normalizedOptions) }))
      .sort((a, b) => b.score - a.score);

    return {
      provider: ranked[0].provider,
      reason: `Selected ${ranked[0].provider.id} for ${capability}${filters.length ? ` with filters (${filters.join('; ')})` : ''}`,
      candidates: ranked,
    };
  }
}
