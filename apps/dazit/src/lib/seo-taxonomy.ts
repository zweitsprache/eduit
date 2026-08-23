export const LEVELS = ['A1.1', 'A1.2', 'A2.1', 'A2.2', 'B1.1', 'B1.2'] as const;

export const TYPES = [
  { slug: 'arbeitsblatt', label: 'Arbeitsblatt' },
  { slug: 'merkblatt', label: 'Merkblatt' },
  { slug: 'verbtabelle', label: 'Verbtabelle' },
  { slug: 'deklinationstabelle', label: 'Deklinationstabelle' },
  { slug: 'kommunikationskarten', label: 'Kommunikationskarten' },
  { slug: 'lernkarten', label: 'Lernkarten' },
  { slug: 'wechselspiel', label: 'Wechselspiel' },
  { slug: 'domino', label: 'Domino' },
  { slug: 'dialog', label: 'Dialog' },
  { slug: 'lesetraining', label: 'Lesetraining' },
  { slug: 'worterliste', label: 'Wörterliste' },
  { slug: 'leseverstehen', label: 'Leseverstehen' },
] as const;

export type TypeSlug = (typeof TYPES)[number]['slug'];
export type TypeLabel = (typeof TYPES)[number]['label'];

export function typeLabelFromSlug(slug: string): TypeLabel | null {
  const item = TYPES.find((entry) => entry.slug === slug);
  return item?.label ?? null;
}

export function typeSlugFromLabel(label: string): TypeSlug | null {
  const item = TYPES.find((entry) => entry.label === label);
  return item?.slug ?? null;
}
