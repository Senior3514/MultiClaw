export const DEFAULT_PROVIDERS = [
  {
    id: 'openai',
    label: 'OpenAI',
    deployment: 'cloud',
    capabilities: ['chat', 'reasoning', 'vision', 'speech-to-text', 'text-to-speech', 'embeddings', 'image-generation', 'tool-use'],
    scores: { quality: 9, speed: 8, cost: 5, privacy: 4 },
  },
  {
    id: 'anthropic',
    label: 'Anthropic',
    deployment: 'cloud',
    capabilities: ['chat', 'reasoning', 'vision', 'tool-use'],
    scores: { quality: 9, speed: 7, cost: 4, privacy: 4 },
  },
  {
    id: 'google',
    label: 'Google',
    deployment: 'cloud',
    capabilities: ['chat', 'reasoning', 'vision', 'speech-to-text', 'text-to-speech', 'embeddings', 'image-generation', 'video-generation', 'tool-use'],
    scores: { quality: 8, speed: 8, cost: 6, privacy: 4 },
  },
  {
    id: 'openrouter',
    label: 'OpenRouter',
    deployment: 'cloud',
    capabilities: ['chat', 'reasoning', 'vision', 'tool-use'],
    scores: { quality: 8, speed: 7, cost: 8, privacy: 3 },
  },
  {
    id: 'groq',
    label: 'Groq',
    deployment: 'cloud',
    capabilities: ['chat', 'reasoning', 'tool-use'],
    scores: { quality: 7, speed: 10, cost: 7, privacy: 3 },
  },
  {
    id: 'ollama',
    label: 'Ollama / Local',
    deployment: 'local',
    capabilities: ['chat', 'reasoning', 'embeddings', 'tool-use'],
    scores: { quality: 6, speed: 6, cost: 10, privacy: 10 },
  },
];
