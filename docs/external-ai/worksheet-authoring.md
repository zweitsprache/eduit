# EduIT worksheet authoring contract

This document describes the JSON contract for external AI systems that create complete EduIT worksheets. The authoritative runtime validator is `generatedWorksheetSchema` in `apps/app/src/lib/worksheet-json-import.ts`. The companion machine-readable contract is [worksheet.schema.json](worksheet.schema.json).

## Output rules

Return JSON only. Do not wrap it in Markdown or add commentary.

Always use this canonical envelope:

```json
{
  "schemaVersion": 1,
  "worksheets": [
    {
      "title": "Worksheet title",
      "documentSize": "a4-portrait",
      "showSolutions": true,
      "status": "draft",
      "context": {},
      "blocks": []
    }
  ]
}
```

- `schemaVersion` must be `1`.
- `worksheets` must contain 1 to 100 worksheets.
- Each new worksheet needs at least one block.
- Omit optional presentation and technical fields unless they are intentional. The importer applies defaults.
- Use stable, unique IDs within a block when IDs are supplied. Simple IDs such as `row-1`, `column-term`, and `pair-3` are sufficient.
- Use `status: "draft"` unless publication was explicitly requested by the calling system.
- Do not invent block types or properties.
- Do not use `sourceWorksheetId` when composing a new worksheet. It copies an existing worksheet instead of using `blocks`.

## Worksheet properties

| Property | Type | Meaning |
| --- | --- | --- |
| `title` | string, 1-200 characters | Worksheet title. |
| `documentSize` | enum | `a4-portrait`, `a4-landscape`, `a5-landscape`, `letter-portrait`, or `letter-landscape`. Default: `a4-portrait`. |
| `showSolutions` | boolean | Whether the rendered document exposes solutions. Default: `false`. Correct-answer data should still be populated when this is false. |
| `status` | enum | `draft` or `published`. Default: `draft`. |
| `brandProfileId` | UUID or null | Existing EduIT brand profile. Omit unless supplied by the caller. |
| `folderId` | UUID or null | Existing EduIT folder. Omit unless supplied by the caller. |
| `sourceWorksheetId` | UUID or null | Existing worksheet to copy. Do not combine this workflow with generated blocks. |
| `context` | object | Learner, language, subject, and curriculum metadata. |
| `blocks` | array, maximum 1000 | Ordered worksheet content. |

## Context properties

All context properties are optional. Use known caller-provided values; do not guess IDs or curriculum metadata.

| Property | Accepted value |
| --- | --- |
| `worksheetLanguage` | `en`, `de-formal`, or `de-informal` |
| `worksheetType` | `worksheet`, `fact-sheet`, `verb-table`, `declension-table`, `learning-cards`, `information-gap`, or `domino` |
| `sourceProfileId` | string up to 100 characters or null |
| `subject` | string up to 100 characters |
| `customSubject` | string up to 150 characters |
| `learnerStage` | string up to 100 characters |
| `ageGroups` | up to 8 strings, each up to 40 characters |
| `ageMin`, `ageMax` | integer from 0 to 120 or null |
| `contentLanguage` | string up to 100 characters, preferably a locale such as `de-CH` |
| `translationLanguages` | up to 20 language codes, each up to 20 characters |
| `country` | string up to 100 characters |
| `localLevel` | string up to 150 characters |
| `curriculum` | string up to 250 characters |
| `languageLevel` | string up to 100 characters, for example `A2` |
| `actionField` | string up to 100 characters |
| `actionCompetencies`, `languageCompetencies` | up to 10 strings, each up to 80 characters |
| `learnerContext` | string up to 1000 characters |
| `contextPdfName` | string up to 250 characters |
| `contextPdfText` | string up to 1,000,000 characters; normally supplied by the caller, not generated |
| `contextPdfPageCount` | positive integer or null |

## Shared content syntax

Exercise text can contain answer-bearing blanks:

- `{{blank:answer}}` creates a blank whose solution is `answer`.
- `{{blank:answer|1.5}}` creates the same blank with a width factor of `1.5`.
- Width factors are clamped by the editor; use values from `0.5` to `5`.
- Do not place `{` or `}` inside an answer.
- Preserve punctuation outside the token: `Ich kaufe {{blank:einen Mantel}}.`

This syntax is supported in fill-in-the-blank items, dialogue lines, worksheet-table cells, and learning-card text. Markdown-like emphasis may be used in worksheet-table cells. `richText.html` uses HTML instead.

## Block catalogue

### `heading`

Use for worksheet titles and section headings.

| Field | Constraint |
| --- | --- |
| `text` | required, 1-500 characters |
| `level` | required integer, 1-5 |
| `numbered` | boolean, default `false` |
| `gapAfter` | integer 1-3, default `1` |
| `restartInstructionNumbering` | boolean, default `true` |

### `richText`

Use for explanations, reading passages, examples, lists, and supporting prose.

| Field | Constraint |
| --- | --- |
| `html` | required HTML string, 1-100,000 characters |

Use semantic, simple HTML such as `p`, `strong`, `em`, `ul`, `ol`, `li`, `blockquote`, and headings. Do not include scripts, styles, full HTML documents, or interactive elements.

### `pageBreak`

Use only when a deliberate new page is required.

| Field | Constraint |
| --- | --- |
| `restartPagination` | boolean, default `false` |

### `spacer`

Use for deliberate vertical whitespace between worksheet blocks.

| Field | Constraint |
| --- | --- |
| `height` | integer pixels, 0-400, default `32` |

### `glossary`

Use for vocabulary, verb, noun, or adjective reference tables.

| Field | Constraint |
| --- | --- |
| `preset` | `default`, `verbs`, `nouns`, or `adjectives`; default `default` |
| `showInstruction` | boolean, default `false` |
| `showColumnHeaders` | boolean, default `true` |
| `showExample` | boolean, default `true` |
| `showAdditionalColumn` | boolean, default `false` |
| `instruction` | optional string up to 1000 characters or null |
| `headerLabels` | up to 4 strings, each up to 200 characters |
| `termWidth`, `definitionWidth`, `additionalWidth` | `10`, `15`, `20`, `25`, `33`, `50`, or `66`; relevant mainly to `default` preset |
| `entries` | required array of 1-500 entries |

Each entry requires `term` (1-500 characters) and `definition` (up to 2000). It may include `additional` and `example`, each up to 3000 characters.

### `fillInTheBlank`

Use for sentences or short texts with explicit answer tokens.

| Field | Constraint |
| --- | --- |
| `instruction` | required, 1-1000 characters |
| `title` | up to 500 characters, default empty |
| `items` | required array of 1-500 strings, each 1-5000 characters |
| `distractors` | up to 500 strings, each 1-500 characters |
| `widthFactor` | number 0.5-5, default `1` |
| `hideBlankNumbers`, `hideItemNumbers`, `showLineNumbers`, `showWordBank`, `showFirstAsExample` | booleans, default `false` |

Every assessed item should contain at least one `{{blank:...}}` token. Populate `distractors` only when `showWordBank` is true.

### `worksheetTable`

Use for structured comparisons, forms, schedules, paradigms, or tabular blanks.

| Field | Constraint |
| --- | --- |
| `instruction` | up to 1000 characters, default `Complete the table.` |
| `showInstruction` | boolean, default `true` |
| `columns` | required array of 1-6 columns |
| `rows` | required array of 1-1000 rows |
| `showHeader`, `hideBlankNumbers`, `showFirstAsExample` | booleans, default `false` |
| `blankWidthFactor` | number 1-5, default `1` |

A column has required `id` (1-100 characters), `label` (up to 500), and `span` (0.5-24). It also has `align` (`left`, `center`, or `right`) and `useTabularNums` (boolean). A row has `id`, `isHeader`, and a `cells` object. Every cell key must match a column ID. Column spans should normally total 24.

Use meaningful learner-facing labels such as `Person`, `Verb`, or `Beispiel`; never leave generated placeholders such as `Column 1`. Prefer `showHeader: true` with labels in `columns` for a normal header. If an explicit row has `isHeader: true`, its cell text is rendered as the header and should agree with the column labels.

### `dialogue`

Use for conversations between two to four speakers.

| Field | Constraint |
| --- | --- |
| `instruction` | required, 1-1000 characters |
| `context` | up to 2000 characters |
| `speakerNames` | required object with keys `1`, `2`, `3`, `4`; values up to 100 characters |
| `items` | required array of 2-500 lines |
| `showSpeakerNames`, `showOriginal`, `showWordBank`, `hideBlankNumbers`, `showFirstAsExample` | booleans, default `false` |

Each line has `speaker`, an integer from 1 to 4, and `text`, 1-5000 characters. Use only speaker numbers that represent actual participants. Dialogue text may contain blank tokens.

### `mcq`

Use for one or more multiple-choice questions.

| Field | Constraint |
| --- | --- |
| `instruction` | up to 1000 characters |
| `blockQuestion` | shared prompt or source question, up to 2000 characters |
| `questions` | required array of 1-50 questions |
| `questionNumber` | positive integer or `null`; omit for grouped questions so numbering follows array order |
| `columns` | integer 1-3, default `1` |
| `shuffleAnswers`, `showInstruction` | booleans; defaults `false` and `true` |

Each question has `question` (1-2000 characters), `answerMode` (`single` or `multiple`), and 2-10 options. Each option has `text` (1-1000) and `correct` (boolean). For `single`, mark exactly one option correct. For `multiple`, mark at least one option correct. Optional IDs are up to 100 characters.

### `mcm`

Use for a matrix where each statement is evaluated against up to three labeled choices.

| Field | Constraint |
| --- | --- |
| `instruction` | up to 1000 characters |
| `question` | up to 2000 characters |
| `rows` | required array of 1-100 rows |
| `showFirstAsExample`, `hideStatement` | booleans, default `false` |

Each row contains `text` (1-2000 characters) and 1-3 options. Each option contains `text` (1-1000) and `correct` (boolean). Use a consistent option set across rows when the matrix represents categories.

If option IDs are supplied, they must be unique across the entire block, not only within one row. Prefer IDs such as `row-1-frueher` and `row-1-heute`, or omit IDs and let the importer generate them.

### `articlePlural`

Use specifically for German noun article and plural practice.

| Field | Constraint |
| --- | --- |
| `instruction` | must be exactly `Kreuzen Sie den richtigen Artikel an. Schreiben Sie die Pluralform.` |
| `rows` | required array of 1-1000 rows |
| `order` | `alphabetical` or `shuffle`, default `alphabetical` |
| `shuffleSeed` | integer 0-1,000,000, default `0` |
| `continuation` | boolean, default `false` |
| `rowNumberOffset` | integer 0-1,000,000, default `0` |

Each row contains `term`, `articles`, and `plural`. `articles` is an array containing the correct values from `der`, `das`, and `die`; it can contain multiple values. Use the singular noun without its article in `term`. Leave `continuation` and `rowNumberOffset` at defaults; the importer handles pagination.

### `trueFalse`

Use for statements assessed as true, false, or optionally not applicable.

| Field | Constraint |
| --- | --- |
| `instruction` | up to 1000 characters |
| `question` | up to 2000 characters |
| `trueLabel`, `falseLabel`, `naLabel` | up to 100 characters |
| `showNa`, `showFirstAsExample` | booleans, default `false` |
| `rows` | required array of 1-100 rows |

Each row has `text` (1-2000 characters) and `correctValue`: `true`, `false`, `na`, or null. Use the strings, not JSON booleans. Use `na` only when `showNa` is true.

### `matchingPairs`

Use for term-definition, question-answer, or concept-example matching.

| Field | Constraint |
| --- | --- |
| `instruction` | up to 1000 characters |
| `question` | up to 2000 characters |
| `pairs` | required array of 2-100 pairs |
| `rightOrder` | optional array of pair IDs |
| `shuffleLeft`, `shuffleRight`, `showWordBank`, `shuffleWordBank`, `showFirstAsExample` | booleans |
| `shuffleSeed` | nonnegative integer |
| `answerStyle` | `checkboxes` or `writingLines` |

Each pair requires `left` and `right`, each 1-2000 characters. Give every pair an ID if supplying `rightOrder`. Omit `rightOrder` to let the importer derive it. Avoid duplicate right-hand answers.

### `timeMatching`

Use for matching representations of clock times.

| Field | Constraint |
| --- | --- |
| `leftRepresentation`, `rightRepresentation` | `analog`, `digital`, `official`, or `informal` |
| `times` | required array of 2-100 times |
| `rightOrder` | optional array of time IDs |
| `allowedMinutes` | up to 60 integers from 0 to 59 |
| `rangeStart`, `rangeEnd` | strings in `HH:MM` form |
| `shuffleLeft`, `shuffleRight`, `showFirstAsExample` | booleans |
| `answerStyle` | `checkboxes` or `writingLines` |

Each time contains `hour` (integer 0-23), `minute` (integer 0-59), and an optional ID. Omit `rightOrder` to let the importer generate it.

### `communicationCards`

Use for role-play cards. This block must be the only block in its worksheet.

| Field | Constraint |
| --- | --- |
| `title` | up to 200 characters |
| `format` | must be `a4-landscape` |
| `sidedness` | must be `single` |
| `textSize` | `xs`, `s`, `m`, `l`, or `xl` |
| `items` | required array of 1-400 cards |

Each card can contain `pairTitle` (up to 500), `situation`, `task`, `intro`, `listItems`, and `content` (each up to 5000), plus `listType` (`informationen` or `sprechhilfen`). Cards are laid out four per physical sheet.

### `learningCards`

Use for single- or double-sided study cards. This block must be the only block in its worksheet.

| Field | Constraint |
| --- | --- |
| `title` | up to 200 characters |
| `sidedness` | `single`, `double`, or `single-solution` |
| `blankWidthFactor` | number 0.25-5, default `1` |
| `frontTextSize`, `backTextSize` | `xs`, `s`, `m`, `l`, or `xl` |
| `items` | required array of 1-450 cards |

Each card has `front` and `back`, each up to 5000 characters. Cards are laid out nine per physical sheet. For `single`, the back may be empty. For `single-solution`, cards print single-sided and an additional solution key section is generated from the card backs. Learning-card text supports blank tokens such as `{{blank:answer}}` and width multipliers such as `{{blank:answer|1.5}}`; the multiplier is applied relative to the block-level `blankWidthFactor`. Do not add headings or page breaks around this block.

### `wordGrid`

Use for a word-search grid.

| Field | Constraint |
| --- | --- |
| `instruction` | up to 1000 characters |
| `columns`, `rows` | integers 3-20 |
| `rowHeight` | number 0.5-2 |
| `showWordList`, `showFirstAsExample` | booleans |
| `words` | required array of 1-100 words, each 1-100 characters |
| `generation` | integer 0-1,000,000; deterministic layout seed |

`directions` contains eight booleans: `leftToRight`, `rightToLeft`, `topToBottom`, `bottomToTop`, `northWestToSouthEast`, `southWestToNorthEast`, `northEastToSouthWest`, and `southEastToNorthWest`. Ensure the selected words fit the chosen grid dimensions. Prefer pedagogically relevant words without punctuation or duplicates.

### `domino`

Use for a printable chain in which each right side connects semantically to another tile's left side. The importer handles physical pagination.

| Field | Constraint |
| --- | --- |
| `pairs` | required array of 1-500 pairs |
| `showFirstAsExample` | boolean |
| `oddTextSize`, `evenTextSize` | `xs`, `s`, `m`, `l`, or `xl` |
| `leftRepresentation`, `rightRepresentation` | `analog`, `digital`, `official`, `informal`, or `text` |

Each pair requires `left` and `right`, each 1-2000 characters. Use time representations only for time content; otherwise use `text`.

### `germanVerbTable`

Use for German conjugation tables.

| Field | Constraint |
| --- | --- |
| `tableStyle` | `extended`, `compact`, or `multiple` |
| `tense` | `present` or `preterite` |
| `groupId` | string up to 120 characters |
| `groupIndex` | nonnegative integer |
| `groupSize` | integer 1-100 |
| `hideInfinitiveBadge`, `showInfinitiveHeading` | booleans |
| `infinitiveHeadingText` | up to 200 characters |
| `leftVerb`, `rightVerb` | up to 200 characters |
| `leftAuxiliary`, `rightAuxiliary` | up to 100 characters |
| `leftParticiple`, `rightParticiple` | up to 200 characters |
| `comparisonAuxiliary` | `haben` or `sein` |
| `separablePrefix` | up to 80 characters |
| `multipleVerbCount` | `4` or `5` |
| `multipleBadgeStyle` | `light` or `dark` |
| `multipleVerbs` | required array of 1-20 verbs |

`leftForms`, `forms`, and every `multipleVerbs[].forms` object contain these string fields: `ich`, `du`, `formalSingular`, `thirdSingular`, `wir`, `ihr`, `formalPlural`, `thirdPlural`, and `preteriteIch`. Each is up to 200 characters. A multiple-verb entry also contains `verb` and `separablePrefix`.

Use `extended` or `compact` to compare `leftVerb` and `rightVerb`. Use `multiple` for four or five verbs and populate `multipleVerbs`. Leave `groupId`, `groupIndex`, and `groupSize` at defaults unless reproducing an existing multi-page layout.

## Worksheet composition guidance

1. Match language, spelling, register, vocabulary, and sentence length to `context`.
2. Begin ordinary worksheets with one level-1 heading. Use level-2 or level-3 headings only for meaningful sections.
3. Build a learning progression: brief input or reference, controlled practice, then application or checking.
4. Prefer 2-5 substantial exercise blocks over many tiny blocks.
5. Keep instructions short, direct, and in the learner-facing language.
6. Populate all solution fields even when `showSolutions` is false.
7. Make distractors plausible but unambiguously incorrect in context.
8. Do not reveal an answer in a neighboring prompt, heading, word bank, or example unless that reveal is intentional.
9. Use `showFirstAsExample` only when the first item is complete and demonstrates the task correctly.
10. Avoid manual page breaks unless layout intent requires one; several special blocks paginate automatically.
11. Do not combine `learningCards` or `communicationCards` with any other block.
12. Ensure generated content is factual, age-appropriate, culturally suitable, and internally consistent.

## Preflight checklist

Before returning JSON, verify:

- The output is valid JSON with no trailing commas or comments.
- Every object has the correct `type` discriminator.
- Every required array meets its minimum size.
- Every single-answer MCQ has exactly one correct option.
- Every assessed blank includes its answer inside `{{blank:...}}`.
- Every table cell key matches a declared column ID.
- Every referenced `rightOrder` ID exists.
- Every solution agrees with its question and source text.
- Exclusive card blocks are not mixed with other blocks.
- No unsupported fields, block types, URLs, IDs, or metadata were invented.

## Examples

- [complete-language-worksheet.json](examples/complete-language-worksheet.json): a normal multi-block language worksheet.
- [learning-cards.json](examples/learning-cards.json): an exclusive full-sheet card document.
