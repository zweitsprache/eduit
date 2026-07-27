"use client";

import { Button } from '@/components/base/buttons/button';
import { ArrowRight, Edit05, Settings01 } from '@untitledui/icons';
import { LanguageSwitcher } from '@/components/i18n/language-switcher';
import { useI18n } from '@/components/i18n/locale-provider';

export default function HomePage() {
  const { t } = useI18n();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-secondary px-6 py-16">
      <div className="max-w-3xl rounded-3xl border border-secondary bg-primary p-10 shadow-xl">
        <div className="mb-6 flex justify-end">
          <LanguageSwitcher />
        </div>
        <p className="mb-4 text-sm font-semibold text-brand-secondary">
          {t('home.eyebrow')}
        </p>
        <h1 className="text-display-md font-semibold text-primary">
          {t('home.title')}
        </h1>
        <p className="mt-5 text-lg text-tertiary">
          {t('home.description')}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button
            color="secondary"
            size="xl"
            iconTrailing={<ArrowRight className="size-5" />}
            onPress={() => { window.location.href = '/auth/sign-in'; }}
          >
            {t('home.signIn')}
          </Button>
          <Button size="xl" iconLeading={<Edit05 className="size-5" />} onPress={() => { window.location.href = '/editor'; }}>
            {t('home.openEditor')}
          </Button>
          <Button
            color="secondary"
            size="xl"
            iconLeading={<Edit05 className="size-5" />}
            onPress={() => { window.location.href = '/documents'; }}
          >
            {t('home.manageWorksheets')}
          </Button>
          <Button
            color="secondary"
            size="xl"
            iconLeading={<Settings01 className="size-5" />}
            onPress={() => { window.location.href = '/admin/brands'; }}
          >
            {t('home.manageBrands')}
          </Button>
          <Button
            color="secondary"
            size="xl"
            iconTrailing={<ArrowRight className="size-5" />}
            onPress={() => { window.location.href = 'https://neon.tech'; }}
          >
            {t('home.neonDocs')}
          </Button>
        </div>
      </div>
    </main>
  );
}
