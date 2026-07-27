'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  isLocale,
  localeCookieName,
  translate,
  type Locale,
  type MessageKey,
} from '@/lib/i18n';
import { uiGerman } from '@/lib/ui-german';

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: MessageKey, values?: Record<string, string | number>) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);
const originalText = new WeakMap<Text, string>();
const originalAttributes = new WeakMap<Element, Map<string, string>>();

function isWorksheetContent(node: Node) {
  const element = node instanceof Element ? node : node.parentElement;
  return Boolean(element?.closest('[data-i18n-content], [contenteditable="true"]'));
}

function localizeLegacyUi(root: Node, locale: Locale) {
  const documentRoot = root instanceof Document ? root.body : root;
  if (!documentRoot) return;

  const textNodes: Text[] = [];
  if (documentRoot instanceof Text) {
    textNodes.push(documentRoot);
  } else {
    const textWalker = document.createTreeWalker(documentRoot, NodeFilter.SHOW_TEXT);
    let nextText = textWalker.nextNode() as Text | null;
    while (nextText) {
      textNodes.push(nextText);
      nextText = textWalker.nextNode() as Text | null;
    }
  }

  for (const textNode of textNodes) {
    if (!isWorksheetContent(textNode)) {
      const current = textNode.data;
      const trimmed = current.trim();
      if (!originalText.has(textNode) && uiGerman[trimmed]) {
        originalText.set(textNode, trimmed);
      }
      const original = originalText.get(textNode);
      if (original) {
        const next = locale === 'de' ? uiGerman[original] : original;
        const localized = current.replace(trimmed, next);
        if (localized !== current) textNode.data = localized;
      }
    }
  }

  const elements = documentRoot instanceof Element
    ? [documentRoot, ...documentRoot.querySelectorAll('*')]
    : [];
  for (const element of elements) {
    if (isWorksheetContent(element)) continue;
    for (const attribute of ['placeholder', 'title', 'aria-label', 'alt']) {
      const current = element.getAttribute(attribute);
      if (!current) continue;
      if (!originalAttributes.has(element)) originalAttributes.set(element, new Map());
      const originals = originalAttributes.get(element)!;
      if (!originals.has(attribute) && uiGerman[current]) originals.set(attribute, current);
      const original = originals.get(attribute);
      const localized = original && (locale === 'de' ? uiGerman[original] : original);
      if (localized && localized !== current) element.setAttribute(attribute, localized);
    }
  }
}

export function LocaleProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: React.ReactNode;
}) {
  const [locale, setLocaleState] = useState(initialLocale);

  useEffect(() => {
    localizeLegacyUi(document, locale);
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'characterData') {
          localizeLegacyUi(mutation.target, locale);
        } else if (mutation.type === 'attributes') {
          localizeLegacyUi(mutation.target, locale);
        } else {
          mutation.addedNodes.forEach((node) => localizeLegacyUi(node, locale));
        }
      }
    });
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['placeholder', 'title', 'aria-label', 'alt'],
    });
    return () => observer.disconnect();
  }, [locale]);

  const setLocale = useCallback((nextLocale: Locale) => {
    if (!isLocale(nextLocale)) return;
    setLocaleState(nextLocale);
    document.documentElement.lang = nextLocale;
    document.cookie = `${localeCookieName}=${nextLocale}; path=/; max-age=31536000; samesite=lax`;
  }, []);

  const value = useMemo<LocaleContextValue>(() => ({
    locale,
    setLocale,
    t: (key, values) => translate(locale, key, values),
  }), [locale, setLocale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useI18n() {
  const context = useContext(LocaleContext);
  if (!context) throw new Error('useI18n must be used within LocaleProvider');
  return context;
}
