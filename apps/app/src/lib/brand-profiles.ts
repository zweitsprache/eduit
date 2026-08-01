import { sql } from '@/lib/neon';
import {
  BRAND_COLOR_TOKENS,
  BRAND_FONT_WEIGHTS,
  DATE_FORMATS,
  DEFAULT_BRAND_HEADING_STYLES,
  BRAND_PROFILE_SETTING_KEYS,
  NUMBER_FORMATS,
  STYLE_PRESETS,
  type BrandProfile,
  type BrandHeadingNumberFormats,
  type BrandHeadingStyles,
  type BrandProfileInput,
  type BrandProfileSettingKey,
} from '@/lib/brand-profile-types';

type BrandProfileRow = {
  id: string;
  parent_profile_id: string | null;
  settings_overrides: BrandProfileSettingKey[] | null;
  slug: string;
  name: string;
  description: string;
  primary_color: string;
  accent_color: string;
  custom_color_1: string;
  custom_color_2: string;
  font_family: string;
  style_preset: BrandProfile['stylePreset'];
  example_font_family: string;
  example_font_size: number | string;
  example_color: string;
  solution_font_family: string;
  solution_font_size: number | string;
  solution_color: string;
  logo_url: string | null;
  logo_scale: number | string;
  instruction_number_format: BrandProfile['instructionNumberFormat'];
  instruction_number_color: BrandProfile['instructionNumberColor'];
  instruction_number_font_weight: BrandProfile['instructionNumberFontWeight'];
  instruction_badge_style: BrandProfile['instructionBadgeStyle'];
  heading_number_formats: BrandHeadingNumberFormats;
  heading_styles: BrandHeadingStyles;
  fixed_heading_number_width: boolean;
  content_indentation: boolean;
  date_format: BrandProfile['dateFormat'];
  footer_1_html: string;
  footer_2_html: string;
  is_default: boolean;
  is_system: boolean;
  is_active: boolean;
  created_at: Date | string;
  updated_at: Date | string;
};

function mapRow(row: BrandProfileRow): BrandProfile {
  return {
    id: row.id,
    parentProfileId: row.parent_profile_id,
    overriddenFields: row.settings_overrides ?? [
      ...BRAND_PROFILE_SETTING_KEYS,
    ],
    slug: row.slug,
    name: row.name,
    description: row.description,
    primaryColor: row.primary_color,
    accentColor: row.accent_color,
    customColor1: row.custom_color_1,
    customColor2: row.custom_color_2,
    fontFamily: row.font_family,
    stylePreset: row.style_preset,
    exampleFontFamily: row.example_font_family,
    exampleFontSize: Number(row.example_font_size),
    exampleColor: row.example_color,
    solutionFontFamily: row.solution_font_family,
    solutionFontSize: Number(row.solution_font_size),
    solutionColor: row.solution_color,
    logoUrl: row.logo_url,
    logoScale: Number(row.logo_scale),
    instructionNumberFormat: row.instruction_number_format,
    instructionNumberColor: row.instruction_number_color,
    instructionNumberFontWeight: row.instruction_number_font_weight,
    instructionBadgeStyle: row.instruction_badge_style,
    headingNumberFormats: row.heading_number_formats,
    headingStyles: row.heading_styles,
    fixedHeadingNumberWidth: row.fixed_heading_number_width,
    contentIndentation: row.content_indentation,
    dateFormat: row.date_format,
    footer1Html: row.footer_1_html,
    footer2Html: row.footer_2_html,
    isDefault: row.is_default,
    isSystem: row.is_system,
    isActive: row.is_active,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

export function validateBrandProfileInput(value: unknown): BrandProfileInput {
  if (!value || typeof value !== 'object') throw new Error('Invalid brand profile.');
  const input = value as Record<string, unknown>;
  const text = (key: string, required = true) => {
    const result = typeof input[key] === 'string' ? input[key].trim() : '';
    if (required && !result) throw new Error(`${key} is required.`);
    return result;
  };
  const color = (key: string) => {
    const result = text(key);
    if (!/^#[0-9a-f]{6}$/i.test(result)) throw new Error(`${key} must be a six-digit hex color.`);
    return result.toLowerCase();
  };
  const slug = text('slug').toLowerCase();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error('Slug may contain lowercase letters, numbers, and hyphens.');
  }
  if (!NUMBER_FORMATS.includes(input.instructionNumberFormat as never)) {
    throw new Error('Invalid instruction number format.');
  }
  const rawHeadingFormats = input.headingNumberFormats;
  if (!rawHeadingFormats || typeof rawHeadingFormats !== 'object') {
    throw new Error('Heading number formats are required.');
  }
  const headingNumberFormats = Object.fromEntries(
    [1, 2, 3, 4, 5].map((level) => {
      const format = (rawHeadingFormats as Record<number, unknown>)[level];
      if (!NUMBER_FORMATS.includes(format as never)) {
        throw new Error(`Invalid H${level} number format.`);
      }
      return [level, format];
    }),
  ) as BrandHeadingNumberFormats;
  const rawHeadingStyles = input.headingStyles;
  const headingStyles = Object.fromEntries(
    [1, 2, 3, 4, 5].map((level) => {
      const fallback = DEFAULT_BRAND_HEADING_STYLES[
        level as keyof BrandHeadingStyles
      ];
      const rawStyle = rawHeadingStyles
        && typeof rawHeadingStyles === 'object'
        ? (rawHeadingStyles as Record<number, unknown>)[level]
        : null;
      const style = rawStyle && typeof rawStyle === 'object'
        ? rawStyle as Record<string, unknown>
        : {};
      const color = (
        key: 'numberColor' | 'textColor',
      ) => BRAND_COLOR_TOKENS.includes(style[key] as never)
        ? style[key] as typeof fallback[typeof key]
        : fallback[key];
      const weight = (
        key: 'numberFontWeight' | 'textFontWeight',
      ) => BRAND_FONT_WEIGHTS.includes(Number(style[key]) as never)
        ? Number(style[key]) as typeof fallback[typeof key]
        : fallback[key];
      return [level, {
        numberColor: color('numberColor'),
        numberFontWeight: weight('numberFontWeight'),
        textColor: color('textColor'),
        textFontWeight: weight('textFontWeight'),
      }];
    }),
  ) as BrandHeadingStyles;
  if (!DATE_FORMATS.includes(input.dateFormat as never)) {
    throw new Error('Invalid date format.');
  }
  const footer1Html = text('footer1Html', false);
  const footer2Html = text('footer2Html', false);
  if (footer1Html.length > 5000 || footer2Html.length > 5000) {
    throw new Error('Footer HTML must be 5,000 characters or fewer.');
  }

  return {
    parentProfileId: typeof input.parentProfileId === 'string'
      && input.parentProfileId
      ? input.parentProfileId
      : null,
    overriddenFields: Array.isArray(input.overriddenFields)
      ? input.overriddenFields.filter(
        (key): key is BrandProfileSettingKey => (
          typeof key === 'string'
          && BRAND_PROFILE_SETTING_KEYS.includes(key as BrandProfileSettingKey)
        ),
      )
      : [...BRAND_PROFILE_SETTING_KEYS],
    slug,
    name: text('name'),
    description: text('description', false),
    primaryColor: color('primaryColor'),
    accentColor: color('accentColor'),
    customColor1: color('customColor1'),
    customColor2: color('customColor2'),
    fontFamily: text('fontFamily'),
    stylePreset: STYLE_PRESETS.includes(input.stylePreset as never)
      ? input.stylePreset as BrandProfileInput['stylePreset']
      : 'educational',
    exampleFontFamily: text('exampleFontFamily'),
    exampleFontSize: Math.min(
      72,
      Math.max(
        8,
        Number.isFinite(Number(input.exampleFontSize))
          ? Number(input.exampleFontSize)
          : 24.5,
      ),
    ),
    exampleColor: color('exampleColor'),
    solutionFontFamily: text('solutionFontFamily'),
    solutionFontSize: Math.min(
      72,
      Math.max(
        8,
        Number.isFinite(Number(input.solutionFontSize))
          ? Number(input.solutionFontSize)
          : 24.5,
      ),
    ),
    solutionColor: color('solutionColor'),
    logoUrl: text('logoUrl', false) || null,
    logoScale: Math.min(
      2,
      Math.max(
        0.5,
        Number.isFinite(Number(input.logoScale))
          ? Number(input.logoScale)
          : 1,
      ),
    ),
    instructionNumberFormat: input.instructionNumberFormat as BrandProfileInput['instructionNumberFormat'],
    instructionNumberColor: (
      input.instructionNumberColor === 'inverse'
      || BRAND_COLOR_TOKENS.includes(input.instructionNumberColor as never)
    )
      ? (input.instructionNumberColor as BrandProfileInput['instructionNumberColor'])
      : 'inverse',
    instructionNumberFontWeight: BRAND_FONT_WEIGHTS.includes(
      Number(input.instructionNumberFontWeight) as never,
    )
      ? (Number(input.instructionNumberFontWeight) as BrandProfileInput['instructionNumberFontWeight'])
      : 700,
    instructionBadgeStyle: (
      input.instructionBadgeStyle === 'primary-text'
      || input.instructionBadgeStyle === 'accent-text'
    )
      ? input.instructionBadgeStyle
      : 'filled',
    headingNumberFormats,
    headingStyles,
    fixedHeadingNumberWidth: input.fixedHeadingNumberWidth === true,
    contentIndentation: input.contentIndentation === true,
    dateFormat: input.dateFormat as BrandProfileInput['dateFormat'],
    footer1Html,
    footer2Html,
    isDefault: input.isDefault === true,
    isActive: input.isActive !== false,
  };
}

export async function listBrandProfiles() {
  const rows = await sql`
    select *
    from brand_profiles
    order by is_default desc, is_system desc, name asc
  ` as BrandProfileRow[];
  const rawProfiles = rows.map(mapRow);
  const byId = new Map(rawProfiles.map((profile) => [profile.id, profile]));
  const resolved = new Map<string, BrandProfile>();
  const resolve = (profile: BrandProfile, ancestors = new Set<string>()): BrandProfile => {
    const cached = resolved.get(profile.id);
    if (cached) return cached;
    if (ancestors.has(profile.id)) {
      throw new Error('Brand profile inheritance contains a cycle.');
    }
    const parent = profile.parentProfileId
      ? byId.get(profile.parentProfileId)
      : null;
    if (!parent) {
      resolved.set(profile.id, profile);
      return profile;
    }
    const nextAncestors = new Set(ancestors).add(profile.id);
    const effectiveParent = resolve(parent, nextAncestors);
    const effective = { ...profile };
    BRAND_PROFILE_SETTING_KEYS.forEach((key) => {
      if (!profile.overriddenFields.includes(key)) {
        Object.assign(effective, { [key]: effectiveParent[key] });
      }
    });
    resolved.set(profile.id, effective);
    return effective;
  };
  return rawProfiles.map((profile) => resolve(profile));
}

export async function createBrandProfile(input: BrandProfileInput) {
  if (input.isDefault) await sql`update brand_profiles set is_default = false where is_default = true`;
  const rows = await sql`
    insert into brand_profiles (
      slug, name, description, primary_color, accent_color,
      custom_color_1, custom_color_2, font_family,
      style_preset,
      example_font_family, example_font_size, example_color,
      solution_font_family, solution_font_size, solution_color,
      logo_url, logo_scale,
      instruction_number_format, instruction_number_color,
      instruction_number_font_weight, instruction_badge_style,
      heading_number_formats, heading_styles, fixed_heading_number_width,
      content_indentation,
      date_format, footer_1_html, footer_2_html,
      is_default, is_system, is_active
      , parent_profile_id, settings_overrides
    ) values (
      ${input.slug}, ${input.name}, ${input.description}, ${input.primaryColor},
      ${input.accentColor}, ${input.customColor1}, ${input.customColor2},
      ${input.fontFamily}, ${input.stylePreset}, ${input.exampleFontFamily},
      ${input.exampleFontSize}, ${input.exampleColor},
      ${input.solutionFontFamily}, ${input.solutionFontSize},
      ${input.solutionColor}, ${input.logoUrl},
      ${input.logoScale},
      ${input.instructionNumberFormat}, ${input.instructionNumberColor},
      ${input.instructionNumberFontWeight}, ${input.instructionBadgeStyle},
      ${JSON.stringify(input.headingNumberFormats)}::jsonb,
      ${JSON.stringify(input.headingStyles)}::jsonb,
      ${input.fixedHeadingNumberWidth},
      ${input.contentIndentation},
      ${input.dateFormat}, ${input.footer1Html}, ${input.footer2Html},
      ${input.isDefault}, false, ${input.isActive},
      ${input.parentProfileId}::uuid,
      ${JSON.stringify(input.overriddenFields)}::jsonb
    )
    returning *
  ` as BrandProfileRow[];
  const profiles = await listBrandProfiles();
  return profiles.find(({ id }) => id === rows[0].id) ?? mapRow(rows[0]);
}

export async function updateBrandProfile(id: string, input: BrandProfileInput) {
  if (input.parentProfileId === id) {
    throw new Error('A brand profile cannot inherit from itself.');
  }
  if (input.parentProfileId) {
    const profiles = await listBrandProfiles();
    let parent = profiles.find(({ id: profileId }) => (
      profileId === input.parentProfileId
    ));
    const visited = new Set([id]);
    while (parent) {
      if (visited.has(parent.id)) {
        throw new Error('Brand profile inheritance would create a cycle.');
      }
      visited.add(parent.id);
      parent = parent.parentProfileId
        ? profiles.find(({ id: profileId }) => (
          profileId === parent?.parentProfileId
        ))
        : undefined;
    }
  }
  if (input.isDefault) await sql`update brand_profiles set is_default = false where id <> ${id}`;
  const rows = await sql`
    update brand_profiles
    set slug = ${input.slug},
        name = ${input.name},
        description = ${input.description},
        primary_color = ${input.primaryColor},
        accent_color = ${input.accentColor},
        custom_color_1 = ${input.customColor1},
        custom_color_2 = ${input.customColor2},
        font_family = ${input.fontFamily},
        style_preset = ${input.stylePreset},
        example_font_family = ${input.exampleFontFamily},
        example_font_size = ${input.exampleFontSize},
        example_color = ${input.exampleColor},
        solution_font_family = ${input.solutionFontFamily},
        solution_font_size = ${input.solutionFontSize},
        solution_color = ${input.solutionColor},
        logo_url = ${input.logoUrl},
        logo_scale = ${input.logoScale},
        instruction_number_format = ${input.instructionNumberFormat},
        instruction_number_color = ${input.instructionNumberColor},
        instruction_number_font_weight = ${input.instructionNumberFontWeight},
        instruction_badge_style = ${input.instructionBadgeStyle},
        heading_number_formats = ${JSON.stringify(input.headingNumberFormats)}::jsonb,
        heading_styles = ${JSON.stringify(input.headingStyles)}::jsonb,
        fixed_heading_number_width = ${input.fixedHeadingNumberWidth},
        content_indentation = ${input.contentIndentation},
        date_format = ${input.dateFormat},
        footer_1_html = ${input.footer1Html},
        footer_2_html = ${input.footer2Html},
        is_default = ${input.isDefault},
        is_active = ${input.isActive},
        parent_profile_id = ${input.parentProfileId}::uuid,
        settings_overrides = ${JSON.stringify(input.overriddenFields)}::jsonb,
        updated_at = now()
    where id = ${id}
    returning *
  ` as BrandProfileRow[];
  if (!rows[0]) throw new Error('Brand profile not found.');
  const profiles = await listBrandProfiles();
  return profiles.find(({ id: profileId }) => profileId === id) ?? mapRow(rows[0]);
}

export async function deleteBrandProfile(id: string) {
  const rows = await sql`
    delete from brand_profiles
    where id = ${id} and is_system = false and is_default = false
    returning id
  `;
  if (!rows[0]) throw new Error('System and default profiles cannot be deleted.');
}
