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

export type BrandNumberFormat = typeof NUMBER_FORMATS[number];
export type BrandProfileDateFormat = typeof DATE_FORMATS[number];
export type BrandHeadingNumberFormats = {
  1: BrandNumberFormat;
  2: BrandNumberFormat;
  3: BrandNumberFormat;
  4: BrandNumberFormat;
  5: BrandNumberFormat;
};

export type BrandProfile = {
  id: string;
  slug: string;
  name: string;
  description: string;
  primaryColor: string;
  accentColor: string;
  fontFamily: string;
  logoUrl: string | null;
  instructionNumberFormat: BrandNumberFormat;
  headingNumberFormats: BrandHeadingNumberFormats;
  dateFormat: BrandProfileDateFormat;
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
