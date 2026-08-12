"use client";

import { createContext, useContext, type ReactNode } from 'react';

/** Sentinel meaning the untranslated source text is shown. */
export const ORIGINAL_VIEW_LANGUAGE = 'original';

// Translation target languages (BCP-47 codes) offered by the document-level picker.
export const TRANSLATION_LANGUAGE_OPTIONS: [string, string][] = [
  ['de-CH', 'Deutsch (Schweiz)'],
  ['de-DE', 'Deutsch (Deutschland)'],
  ['de-AT', 'Deutsch (Österreich)'],
  ['en', 'Englisch'],
  ['fr', 'Französisch'],
  ['it', 'Italienisch'],
  ['es', 'Spanisch'],
  ['pt', 'Portugiesisch'],
  ['pt-BR', 'Portugiesisch (Brasilien)'],
  ['nl', 'Niederländisch'],
  ['tr', 'Türkisch'],
  ['sq', 'Albanisch'],
  ['sr', 'Serbisch'],
  ['hr', 'Kroatisch'],
  ['bs', 'Bosnisch'],
  ['mk', 'Mazedonisch'],
  ['sl', 'Slowenisch'],
  ['pl', 'Polnisch'],
  ['cs', 'Tschechisch'],
  ['sk', 'Slowakisch'],
  ['hu', 'Ungarisch'],
  ['ro', 'Rumänisch'],
  ['bg', 'Bulgarisch'],
  ['el', 'Griechisch'],
  ['uk', 'Ukrainisch'],
  ['ru', 'Russisch'],
  ['ar', 'Arabisch'],
  ['fa', 'Persisch (Farsi/Dari)'],
  ['ps', 'Paschtu'],
  ['ku', 'Kurdisch'],
  ['ti', 'Tigrinya'],
  ['am', 'Amharisch'],
  ['so', 'Somali'],
  ['sw', 'Suaheli'],
  ['he', 'Hebräisch'],
  ['ur', 'Urdu'],
  ['hi', 'Hindi'],
  ['ta', 'Tamilisch'],
  ['zh', 'Chinesisch'],
  ['vi', 'Vietnamesisch'],
  ['th', 'Thailändisch'],
  ['ja', 'Japanisch'],
  ['ko', 'Koreanisch'],
];

export function translationLanguageLabel(code: string) {
  return TRANSLATION_LANGUAGE_OPTIONS.find(([value]) => value === code)?.[1] ?? code;
}

const WorksheetViewLanguageContext = createContext<string>(ORIGINAL_VIEW_LANGUAGE);

export function WorksheetViewLanguageProvider({
  value,
  children,
}: {
  value: string;
  children: ReactNode;
}) {
  return (
    <WorksheetViewLanguageContext.Provider value={value}>
      {children}
    </WorksheetViewLanguageContext.Provider>
  );
}

export function useWorksheetViewLanguage(): string {
  return useContext(WorksheetViewLanguageContext);
}

/** Resolve the text to display for a translatable field in the active language. */
export function resolveTranslatedText(
  original: string,
  translations: Record<string, string> | undefined,
  viewLanguage: string,
): string {
  if (viewLanguage === ORIGINAL_VIEW_LANGUAGE) return original;
  const translated = translations?.[viewLanguage];
  return translated != null && translated.length ? translated : original;
}
