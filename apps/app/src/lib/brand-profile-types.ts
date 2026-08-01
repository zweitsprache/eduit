export const NUMBER_FORMATS = [
  'upper-alpha',
  'lower-alpha',
  'decimal',
  'decimal-leading-zero',
] as const;

export const DATE_FORMATS = [
  'dd.MM.yyyy',
  'dd/MM/yyyy',
  'yyyy-MM-dd',
] as const;

export const STYLE_PRESETS = [
  'educational',
  'semi-academic',
  'academic',
] as const;

export type BrandNumberFormat = typeof NUMBER_FORMATS[number];
export type BrandProfileDateFormat = typeof DATE_FORMATS[number];
export type BrandStylePreset = typeof STYLE_PRESETS[number];
export type BrandInstructionBadgeStyle =
  | 'filled'
  | 'primary-text'
  | 'accent-text';
export const BRAND_COLOR_TOKENS = [
  'defaultText',
  'primary',
  'accent',
  'custom1',
  'custom2',
] as const;
export const BRAND_FONT_WEIGHTS = [400, 500, 600, 700, 800] as const;
export type BrandColorToken = typeof BRAND_COLOR_TOKENS[number];
export type BrandInstructionNumberColor = BrandColorToken | 'inverse';
export type BrandFontWeight = typeof BRAND_FONT_WEIGHTS[number];
export type BrandHeadingStyle = {
  numberColor: BrandColorToken;
  numberFontWeight: BrandFontWeight;
  textColor: BrandColorToken;
  textFontWeight: BrandFontWeight;
};
export type BrandHeadingStyles = {
  1: BrandHeadingStyle;
  2: BrandHeadingStyle;
  3: BrandHeadingStyle;
  4: BrandHeadingStyle;
  5: BrandHeadingStyle;
};
export const DEFAULT_BRAND_HEADING_STYLES: BrandHeadingStyles = {
  1: {
    numberColor: 'custom1',
    numberFontWeight: 700,
    textColor: 'custom1',
    textFontWeight: 700,
  },
  2: {
    numberColor: 'custom1',
    numberFontWeight: 700,
    textColor: 'custom1',
    textFontWeight: 700,
  },
  3: {
    numberColor: 'custom1',
    numberFontWeight: 700,
    textColor: 'custom1',
    textFontWeight: 700,
  },
  4: {
    numberColor: 'custom1',
    numberFontWeight: 700,
    textColor: 'custom1',
    textFontWeight: 700,
  },
  5: {
    numberColor: 'custom1',
    numberFontWeight: 700,
    textColor: 'custom1',
    textFontWeight: 700,
  },
};
export type BrandHeadingNumberFormats = {
  1: BrandNumberFormat;
  2: BrandNumberFormat;
  3: BrandNumberFormat;
  4: BrandNumberFormat;
  5: BrandNumberFormat;
};

export const BRAND_PROFILE_SETTING_KEYS = [
  'primaryColor',
  'accentColor',
  'customColor1',
  'customColor2',
  'fontFamily',
  'stylePreset',
  'exampleFontFamily',
  'exampleFontSize',
  'exampleColor',
  'solutionFontFamily',
  'solutionFontSize',
  'solutionColor',
  'logoUrl',
  'logoScale',
  'instructionNumberFormat',
  'instructionNumberColor',
  'instructionNumberFontWeight',
  'instructionBadgeStyle',
  'headingNumberFormats',
  'headingStyles',
  'fixedHeadingNumberWidth',
  'contentIndentation',
  'dateFormat',
  'footer1Html',
  'footer2Html',
] as const;

export type BrandProfileSettingKey =
  typeof BRAND_PROFILE_SETTING_KEYS[number];

export type BrandProfile = {
  id: string;
  parentProfileId: string | null;
  overriddenFields: BrandProfileSettingKey[];
  slug: string;
  name: string;
  description: string;
  primaryColor: string;
  accentColor: string;
  customColor1: string;
  customColor2: string;
  fontFamily: string;
  stylePreset: BrandStylePreset;
  exampleFontFamily: string;
  exampleFontSize: number;
  exampleColor: string;
  solutionFontFamily: string;
  solutionFontSize: number;
  solutionColor: string;
  logoUrl: string | null;
  logoScale: number;
  instructionNumberFormat: BrandNumberFormat;
  instructionNumberColor: BrandInstructionNumberColor;
  instructionNumberFontWeight: BrandFontWeight;
  instructionBadgeStyle: BrandInstructionBadgeStyle;
  headingNumberFormats: BrandHeadingNumberFormats;
  headingStyles: BrandHeadingStyles;
  fixedHeadingNumberWidth: boolean;
  contentIndentation: boolean;
  dateFormat: BrandProfileDateFormat;
  footer1Html: string;
  footer2Html: string;
  isDefault: boolean;
  isSystem: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type BrandProfileInput = Omit<
  BrandProfile,
  'id' | 'isSystem' | 'createdAt' | 'updatedAt'
>;
