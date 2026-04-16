import { isCapabilitySupported } from './capabilities.js';

export class ProviderRegistry {
  constructor() {
    this.providers = new Map();
  }

  register(provider) {
    if (!provider?.id) {
      throw new Error('Provider must have an id');
    }

    for (const capability of provider.capabilities || []) {
      if (!isCapabilitySupported(capability)) {
        throw new Error(`Unsupported capability in provider ${provider.id}: ${capability}`);
      }
    }

    this.providers.set(provider.id, provider);
    return provider;
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
