# External AI worksheet documentation

This directory is the complete handoff package for an external AI system that creates EduIT worksheets.

## Files

| File | Use |
| --- | --- |
| [worksheet-authoring.md](worksheet-authoring.md) | Human-readable node catalogue, field rules, content syntax, composition guidance, and preflight checklist. |
| [worksheet.schema.json](worksheet.schema.json) | Draft 2020-12 JSON Schema for structured output and automated validation. Generated from the application's Zod validator. |
| [system-prompt-template.md](system-prompt-template.md) | Ready-to-adapt system prompt for worksheet generation. |
| [examples/complete-language-worksheet.json](examples/complete-language-worksheet.json) | Valid multi-block worksheet example. |
| [examples/learning-cards.json](examples/learning-cards.json) | Valid exclusive-block document example. |

## Recommended integration

1. Give the model the contents of `worksheet-authoring.md` as reference material or retrieval context.
2. Use `worksheet.schema.json` as the model provider's structured-output schema when supported.
3. Start from `system-prompt-template.md` and append the user's worksheet request and known context.
4. Validate the response against `worksheet.schema.json` in the external system.
5. Submit the validated JSON to the EduIT worksheet JSON import endpoint or paste it into the AI import in Automations.
6. Treat a failed import as contract feedback. Return the exact validation path and message to the model for one repair attempt.

Do not paste the full JSON Schema into an ordinary prompt when the provider has a dedicated schema or tool-definition parameter. The schema is large and works better as a structured-output constraint. Use the authoring guide for semantic guidance.

## Maintaining the contract

The runtime source of truth remains `generatedWorksheetSchema` and `generatedWorksheetEnvelopeSchema` in `apps/app/src/lib/worksheet-json-import.ts`.

After changing a worksheet node or its accepted JSON, run:

```sh
npm run docs:external-ai
```

This regenerates `worksheet.schema.json` and validates every JSON example in this directory against the runtime Zod schema. Commit the generated schema together with the runtime change.
