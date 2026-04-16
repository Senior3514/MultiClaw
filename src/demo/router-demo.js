import { DEFAULT_PROVIDERS } from '../model-layer/providers.js';
import { ProviderRegistry } from '../model-layer/provider-registry.js';
import { ModelRouter } from '../model-layer/router.js';

const registry = new ProviderRegistry();
registry.registerMany(DEFAULT_PROVIDERS);

const router = new ModelRouter(registry);

const tasks = [
  {
    name: 'Fast chat routing',
    request: { capability: 'chat', priority: 'speed', budget: 'balanced', privacy: 'standard' },
  },
  {
    name: 'Strict privacy reasoning',
    request: { capability: 'reasoning', priority: 'quality', budget: 'low', privacy: 'strict' },
  },
  {
    name: 'Vision task',
    request: { capability: 'vision', priority: 'quality', budget: 'balanced', privacy: 'standard' },
  },
];

for (const task of tasks) {
  const result = router.select(task.request);
  console.log(`\n# ${task.name}`);
  console.log(`Selected: ${result.provider?.label || 'none'}`);
  console.log(`Reason: ${result.reason}`);
  console.log('Top candidates:');
  for (const candidate of result.candidates.slice(0, 3)) {
    console.log(`- ${candidate.provider.label}: ${candidate.score}`);
  }
}
