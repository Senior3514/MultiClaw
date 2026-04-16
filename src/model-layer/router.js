function normalizePriority(priority) {
  return priority || 'balanced';
}

function normalizePrivacy(privacy) {
  return privacy || 'standard';
}

function normalizeBudget(budget) {
  return budget || 'balanced';
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

    let candidates = this.registry.byCapability(capability);

    if (options.allowedDeployments?.length) {
      candidates = candidates.filter((provider) => options.allowedDeployments.includes(provider.deployment));
    }

    if (!candidates.length) {
      return {
        provider: null,
        reason: `No providers available for capability: ${capability}`,
        candidates: [],
      };
    }

    const ranked = candidates
      .map((provider) => ({ provider, score: scoreProvider(provider, options) }))
      .sort((a, b) => b.score - a.score);

    return {
      provider: ranked[0].provider,
      reason: `Selected ${ranked[0].provider.id} for ${capability}`,
      candidates: ranked,
    };
  }
}
