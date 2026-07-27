'use client';

import { useI18n } from '@/components/i18n/locale-provider';
import type { Locale } from '@/lib/i18n';

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale, t } = useI18n();

  return (
    <label className="flex items-center gap-2 text-sm font-medium text-secondary">
      {!compact && <span>{t('common.language')}</span>}
      <select
        aria-label={t('common.language')}
        className="rounded-md border border-primary bg-primary px-2 py-1.5 text-sm text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
        value={locale}
        onChange={(event) => setLocale(event.target.value as Locale)}
      >
        <option value="de">{compact ? 'DE' : t('common.german')}</option>
        <option value="en">{compact ? 'EN' : t('common.english')}</option>
      </select>
    </label>
  );
}
