import { isCapabilitySupported } from './capabilities.js';

const VALID_DEPLOYMENTS = new Set(['cloud', 'local', 'hybrid']);
const SCORE_KEYS = ['quality', 'speed', 'cost', 'privacy'];

function assertFiniteScore(providerId, scores, key) {
  if (!Number.isFinite(scores?.[key])) {
    throw new Error(`Provider ${providerId} must define a finite ${key} score`);
  }
}

export class ProviderRegistry {
  constructor() {
    this.providers = new Map();
  }

  register(provider) {
    if (!provider?.id) {
      throw new Error('Provider must have an id');
    }

    if (!provider.label) {
      throw new Error(`Provider ${provider.id} must have a label`);
    }

    if (!VALID_DEPLOYMENTS.has(provider.deployment)) {
      throw new Error(`Provider ${provider.id} has unsupported deployment: ${provider.deployment}`);
    }

    if (!Array.isArray(provider.capabilities) || provider.capabilities.length === 0) {
      throw new Error(`Provider ${provider.id} must define at least one capability`);
    }

    for (const capability of provider.capabilities) {
      if (!isCapabilitySupported(capability)) {
        throw new Error(`Unsupported capability in provider ${provider.id}: ${capability}`);
      }
    }

    for (const scoreKey of SCORE_KEYS) {
      assertFiniteScore(provider.id, provider.scores, scoreKey);
    }

    const normalizedProvider = {
      ...provider,
      ready: provider.ready !== false,
    };

    this.providers.set(normalizedProvider.id, normalizedProvider);
    return normalizedProvider;
  }

  registerMany(providers) {
    for (const provider of providers) {
      this.register(provider);
    }
  }

  list() {
    return Array.from(this.providers.values());
  }

  get(providerId) {
    return this.providers.get(providerId) || null;
  }

  byCapability(capability) {
    return this.list().filter((provider) => provider.capabilities.includes(capability));
  }
}
