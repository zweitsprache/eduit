'use client';

import { useSearchParams } from 'next/navigation';
import { LibraryBrowser } from '@/components/library-browser';
import type { Worksheet } from '@/lib/worksheets';

function decodeValue(value?: string | null) {
  if (!value) return '';
  try {
    return decodeURIComponent(value).trim();
  } catch {
    return value.trim();
  }
}

export function DocumentsClientPage({ worksheets }: { worksheets: Worksheet[] }) {
  const searchParams = useSearchParams();

  const actionField = decodeValue(searchParams.get('actionField'));
  const level = decodeValue(searchParams.get('level'));
  const query = decodeValue(searchParams.get('q'));
  const type = decodeValue(searchParams.get('type'));

  return (
    <LibraryBrowser
      initialActionFields={actionField ? [actionField] : undefined}
      initialLevels={level ? [level] : undefined}
      initialQuery={query}
      initialTypes={type ? [type] : undefined}
      worksheets={worksheets}
    />
  );
}
