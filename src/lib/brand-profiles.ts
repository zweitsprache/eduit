import { sql } from '@/lib/neon';
import {
  DATE_FORMATS,
  NUMBER_FORMATS,
  type BrandProfile,
  type BrandHeadingNumberFormats,
  type BrandProfileInput,
} from '@/lib/brand-profile-types';

type BrandProfileRow = {
  id: string;
  slug: string;
  name: string;
  description: string;
  primary_color: string;
  accent_color: string;
  font_family: string;
  logo_url: string | null;
  instruction_number_format: BrandProfile['instructionNumberFormat'];
  heading_number_formats: BrandHeadingNumberFormats;
  date_format: BrandProfile['dateFormat'];
  is_default: boolean;
  is_system: boolean;
  is_active: boolean;
  created_at: Date | string;
  updated_at: Date | string;
};

function mapRow(row: BrandProfileRow): BrandProfile {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    primaryColor: row.primary_color,
    accentColor: row.accent_color,
    fontFamily: row.font_family,
    logoUrl: row.logo_url,
    instructionNumberFormat: row.instruction_number_format,
    headingNumberFormats: row.heading_number_formats,
    dateFormat: row.date_format,
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
  if (!DATE_FORMATS.includes(input.dateFormat as never)) {
    throw new Error('Invalid date format.');
  }

  return {
    slug,
    name: text('name'),
    description: text('description', false),
    primaryColor: color('primaryColor'),
    accentColor: color('accentColor'),
    fontFamily: text('fontFamily'),
    logoUrl: text('logoUrl', false) || null,
    instructionNumberFormat: input.instructionNumberFormat as BrandProfileInput['instructionNumberFormat'],
    headingNumberFormats,
    dateFormat: input.dateFormat as BrandProfileInput['dateFormat'],
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
  return rows.map(mapRow);
}

export async function createBrandProfile(input: BrandProfileInput) {
  if (input.isDefault) await sql`update brand_profiles set is_default = false where is_default = true`;
  const rows = await sql`
    insert into brand_profiles (
      slug, name, description, primary_color, accent_color, font_family, logo_url,
      instruction_number_format, heading_number_formats, date_format,
      is_default, is_system, is_active
    ) values (
      ${input.slug}, ${input.name}, ${input.description}, ${input.primaryColor},
      ${input.accentColor}, ${input.fontFamily}, ${input.logoUrl},
      ${input.instructionNumberFormat}, ${JSON.stringify(input.headingNumberFormats)}::jsonb,
      ${input.dateFormat}, ${input.isDefault}, false, ${input.isActive}
    )
    returning *
  ` as BrandProfileRow[];
  return mapRow(rows[0]);
}

export async function updateBrandProfile(id: string, input: BrandProfileInput) {
  if (input.isDefault) await sql`update brand_profiles set is_default = false where id <> ${id}`;
  const rows = await sql`
    update brand_profiles
    set slug = ${input.slug},
        name = ${input.name},
        description = ${input.description},
        primary_color = ${input.primaryColor},
        accent_color = ${input.accentColor},
        font_family = ${input.fontFamily},
        logo_url = ${input.logoUrl},
        instruction_number_format = ${input.instructionNumberFormat},
        heading_number_formats = ${JSON.stringify(input.headingNumberFormats)}::jsonb,
        date_format = ${input.dateFormat},
        is_default = ${input.isDefault},
        is_active = ${input.isActive},
        updated_at = now()
    where id = ${id}
    returning *
  ` as BrandProfileRow[];
  if (!rows[0]) throw new Error('Brand profile not found.');
  return mapRow(rows[0]);
}

export async function deleteBrandProfile(id: string) {
  const rows = await sql`
    delete from brand_profiles
    where id = ${id} and is_system = false and is_default = false
    returning id
  `;
  if (!rows[0]) throw new Error('System and default profiles cannot be deleted.');
}
