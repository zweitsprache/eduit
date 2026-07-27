import type { Metadata } from 'next';
import { cookies, headers } from 'next/headers';
import { AuthProvider } from '@/components/auth/auth-provider';
import { LocaleProvider } from '@/components/i18n/locale-provider';
import {
  defaultLocale,
  isLocale,
  localeCookieName,
  type Locale,
} from '@/lib/i18n';
import './globals.css';

export const metadata: Metadata = {
  title: 'Eduit',
  description: 'A modern education platform starter',
};

async function getInitialLocale(): Promise<Locale> {
  const cookieLocale = (await cookies()).get(localeCookieName)?.value;
  if (isLocale(cookieLocale)) return cookieLocale;

  const acceptedLanguages = (await headers()).get('accept-language')?.toLowerCase() ?? '';
  return acceptedLanguages.includes('en') && !acceptedLanguages.startsWith('de')
    ? 'en'
    : defaultLocale;
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getInitialLocale();

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Encode+Sans+Semi+Condensed:wght@400;500;600;700&display=swap"
        />
      </head>
      <body>
        <LocaleProvider initialLocale={locale}>
          <AuthProvider>{children}</AuthProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
