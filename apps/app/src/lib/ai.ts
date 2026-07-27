import 'server-only';

import { createGateway } from '@ai-sdk/gateway';

export const EDUCATIONAL_CONTENT_MODEL = 'anthropic/claude-sonnet-5';
export const MINI_FORM_CONTENT_MODEL = 'anthropic/claude-sonnet-4.5';

function gatewayApiKey() {
  const apiKey = process.env.AI_GATEWAY_API_KEY;
  if (!apiKey) {
    throw new Error('AI_GATEWAY_API_KEY is not configured.');
  }
  return apiKey;
}

export const aiGateway = createGateway({
  apiKey: gatewayApiKey(),
});

export const educationalContentModel = aiGateway(
  EDUCATIONAL_CONTENT_MODEL,
);

export const miniFormContentModel = aiGateway(
  MINI_FORM_CONTENT_MODEL,
);
