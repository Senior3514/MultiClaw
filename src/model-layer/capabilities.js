export const CAPABILITIES = [
  'chat',
  'reasoning',
  'vision',
  'speech-to-text',
  'text-to-speech',
  'embeddings',
  'image-generation',
  'video-generation',
  'tool-use',
];

export function isCapabilitySupported(capability) {
  return CAPABILITIES.includes(capability);
}
