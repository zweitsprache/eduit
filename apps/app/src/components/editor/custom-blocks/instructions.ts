import { Extension } from '@tiptap/core';

export const DEFAULT_BLOCK_INSTRUCTIONS = {
  dialogue: 'Complete the dialogue.',
  familyKinship: 'Solve the family relationship riddles.',
  fillInTheBlank: 'Fill in the blanks with the correct words.',
  glossaryTerms: 'Review the following glossary terms.',
  mch: 'Choose the correct answer for each row.',
  mcm: 'Choose the correct answer for each row.',
  rewriteSentences: 'Rewrite the sentences correctly.',
  sortingCategories: 'Sort the items into the correct categories.',
  timetable: 'Read the timetable and answer the questions.',
  openingHours: 'Read the opening hours and answer the questions.',
  trueFalse: 'Mark each statement as true or false.',
} as const;

export type InstructionOverrideBlock = keyof typeof DEFAULT_BLOCK_INSTRUCTIONS;

export const CustomBlockInstructions = Extension.create({
  name: 'customBlockInstructions',

  addGlobalAttributes() {
    return [{
      types: Object.keys(DEFAULT_BLOCK_INSTRUCTIONS),
      attributes: {
        instruction: {
          default: null,
          parseHTML: (element) => (
            element.getAttribute('data-block-instruction') || null
          ),
          renderHTML: (attributes) => (
            attributes.instruction
              ? { 'data-block-instruction': attributes.instruction }
              : {}
          ),
        },
      },
    }];
  },
});
