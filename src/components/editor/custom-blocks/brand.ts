import {
  DEFAULT_BRAND_HEADING_STYLES,
  type BrandFontWeight,
  type BrandHeadingStyles,
  type BrandInstructionNumberColor,
} from '@/lib/brand-profile-types';

export type InstructionNumberFormat =
  | 'upper-alpha'
  | 'lower-alpha'
  | 'decimal'
  | 'decimal-leading-zero';
export type InstructionBadgeStyle =
  | 'filled'
  | 'primary-text'
  | 'accent-text';

export type BrandDateFormat = 'dd.MM.yyyy' | 'dd/MM/yyyy' | 'yyyy-MM-dd';
export type HeadingNumberFormat =
  | 'decimal'
  | 'decimal-leading-zero'
  | 'upper-alpha'
  | 'lower-alpha';

export type HeadingNumberFormats = {
  1: HeadingNumberFormat;
  2: HeadingNumberFormat;
  3: HeadingNumberFormat;
  4: HeadingNumberFormat;
  5: HeadingNumberFormat;
};

export type CustomBlockBrand = {
  id: string;
  name: string;
  primaryColor: string;
  accentColor: string;
  customColor1: string;
  customColor2: string;
  fontFamily: string;
  exampleFontFamily: string;
  exampleFontSize: number;
  exampleColor: string;
  solutionFontFamily: string;
  solutionFontSize: number;
  solutionColor: string;
  instructionNumberFormat: InstructionNumberFormat;
  instructionNumberColor: BrandInstructionNumberColor;
  instructionNumberFontWeight: BrandFontWeight;
  instructionBadgeStyle: InstructionBadgeStyle;
  headingNumberFormats: HeadingNumberFormats;
  headingStyles: BrandHeadingStyles;
  fixedHeadingNumberWidth: boolean;
  contentIndentation: boolean;
  dateFormat: BrandDateFormat;
};

/**
 * One brand is resolved for a document/workspace. This is configuration data,
 * not a list exposed as a theme picker.
 */
export const EDUIT_BRAND = {
  id: 'eduit',
  name: 'Eduit',
  primaryColor: '#11224d',
  accentColor: '#cc6600',
  customColor1: '#101828',
  customColor2: '#667085',
  fontFamily: '"Encode Sans Semi Condensed", sans-serif',
  exampleFontFamily: '"Linotype Feltpen", cursive',
  exampleFontSize: 24.5,
  exampleColor: '#009fe3',
  solutionFontFamily: '"Linotype Feltpen", cursive',
  solutionFontSize: 24.5,
  solutionColor: '#079455',
  instructionNumberFormat: 'upper-alpha',
  instructionNumberColor: 'inverse',
  instructionNumberFontWeight: 700,
  instructionBadgeStyle: 'filled',
  headingNumberFormats: {
    1: 'decimal',
    2: 'decimal',
    3: 'decimal',
    4: 'decimal',
    5: 'decimal',
  },
  headingStyles: DEFAULT_BRAND_HEADING_STYLES,
  fixedHeadingNumberWidth: false,
  contentIndentation: false,
  dateFormat: 'dd.MM.yyyy',
} satisfies CustomBlockBrand;

export const ACTIVE_CUSTOM_BLOCK_BRAND = EDUIT_BRAND;

export function formatBrandDate(
  date: Date,
  format: BrandDateFormat = ACTIVE_CUSTOM_BLOCK_BRAND.dateFormat,
) {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear());

  switch (format) {
    case 'dd/MM/yyyy':
      return `${day}/${month}/${year}`;
    case 'yyyy-MM-dd':
      return `${year}-${month}-${day}`;
    case 'dd.MM.yyyy':
    default:
      return `${day}.${month}.${year}`;
  }
}

function formatAlpha(value: number, lowercase: boolean) {
  let result = '';
  let remaining = Math.max(1, Math.floor(value));

  while (remaining > 0) {
    remaining -= 1;
    result = String.fromCharCode((lowercase ? 97 : 65) + (remaining % 26)) + result;
    remaining = Math.floor(remaining / 26);
  }

  return result;
}

export function formatInstructionNumber(
  value: number,
  format: InstructionNumberFormat = ACTIVE_CUSTOM_BLOCK_BRAND.instructionNumberFormat,
) {
  switch (format) {
    case 'lower-alpha':
      return formatAlpha(value, true);
    case 'decimal':
      return String(value);
    case 'decimal-leading-zero':
      return String(value).padStart(2, '0');
    case 'upper-alpha':
    default:
      return formatAlpha(value, false);
  }
}

export function formatHeadingNumber(
  parts: number[],
  formats: HeadingNumberFormats = ACTIVE_CUSTOM_BLOCK_BRAND.headingNumberFormats,
) {
  return parts
    .map((part, index) => (
      part > 0
        ? formatInstructionNumber(part, formats[(index + 1) as keyof HeadingNumberFormats])
        : null
    ))
    .filter((part): part is string => part !== null)
    .join('.');
}
