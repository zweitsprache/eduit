import 'server-only';

import { createGateway } from '@ai-sdk/gateway';
import { wrapLanguageModel, type LanguageModelMiddleware } from 'ai';

export const EDUCATIONAL_CONTENT_MODEL = 'anthropic/claude-sonnet-5';
export const MINI_FORM_CONTENT_MODEL = 'anthropic/claude-sonnet-4.5';
export const VERB_GENERATION_MODEL = 'openai/gpt-5.6-luna';
export const DAZIT_METADATA_MODEL = 'openai/gpt-5.6-luna';

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

const globalEducationalContentRulesMiddleware: LanguageModelMiddleware = {
  transformParams: async ({ params }) => ({
    ...params,
    prompt: [
      {
        role: 'system',
        content: `Mandatory Swiss typography rule: In every generated
human-readable text, always use Swiss guillemets «…» for quotations. Never use
straight quotation marks ("…"), German quotation marks („…“), English curly
quotation marks (“…”), or single quotation marks for quotations. This rule also
applies to dialogue, examples, exercises, titles, explanations, and structured
output fields.

Mandatory multicultural representation rule: Whenever examples, exercises,
dialogues, scenarios, or texts require personal names, use a culturally diverse
and balanced range of names that reflects adult DaZ courses and contemporary
Swiss society. Across multiple people or items, vary names across different
linguistic and cultural naming traditions instead of defaulting mainly to
German-speaking, Western European, or Anglo-American names. Do not associate a
person's apparent cultural background with stereotypical jobs, behaviours,
family roles, abilities, or social situations. Keep every name natural for the
stated context, vary genders fairly, and do not mention or infer ethnicity,
nationality, religion, or migration status unless the task explicitly requires
that information. Do not add personal names when they are not useful to the
content.`,
      },
      ...params.prompt,
    ],
  }),
};

function withGlobalEducationalContentRules(modelId: string) {
  return wrapLanguageModel({
    model: aiGateway(modelId),
    middleware: globalEducationalContentRulesMiddleware,
  });
}

export const educationalContentModel = withGlobalEducationalContentRules(
  EDUCATIONAL_CONTENT_MODEL,
);

export const occupationAutomationModel = withGlobalEducationalContentRules(
  'anthropic/claude-opus-5',
);

export const miniFormContentModel = withGlobalEducationalContentRules(
  MINI_FORM_CONTENT_MODEL,
);

export const verbGenerationModel = withGlobalEducationalContentRules(
  VERB_GENERATION_MODEL,
);

export const dazitMetadataModel = withGlobalEducationalContentRules(
  DAZIT_METADATA_MODEL,
);
