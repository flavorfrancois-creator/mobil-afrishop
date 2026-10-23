import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

import { STORAGE_KEYS } from "@/src/config";
import { storage } from "@/src/utils/storage";
import { Lang, TKey, translations } from "./translations";

type I18nContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: TKey) => string;
  ready: boolean;
};

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("fr");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const saved = await storage.getItem<Lang>(STORAGE_KEYS.language, "fr");
      if (saved && translations[saved]) setLangState(saved);
      setReady(true);
    })();
  }, []);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    storage.setItem(STORAGE_KEYS.language, next);
  }, []);

  const t = useCallback(
    (key: TKey) => translations[lang][key] ?? translations.fr[key] ?? String(key),
    [lang],
  );

  return (
    <I18nContext.Provider value={{ lang, setLang, t, ready }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
