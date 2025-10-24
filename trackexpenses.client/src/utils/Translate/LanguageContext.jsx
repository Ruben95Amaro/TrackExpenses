import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";

const LanguageContext = createContext();
const LS_KEY = "language";

// deep-get: "a.b.c" num objeto
const getDeep = (obj, path, fb) => {
  if (!obj || !path) return fb;
  return path.split(".").reduce((acc, k) => (acc && acc[k] != null ? acc[k] : undefined), obj) ?? fb;
};

// desembrulha export do tipo { pt: { … } } / { en: { … } }
const unwrap = (raw, code) => (raw && raw[code]) ? raw[code] : (raw || {});

// ⚠️ Caminhos e extensão em minúsculas, exatamente como no disco
const LOCALE_LOADERS = {
  en: () => import("./Locales/en.jsx"),
  pt: () => import("./Locales/pt.jsx"),
  es: () => import("./Locales/es.jsx"),
  fr: () => import("./Locales/fr.jsx"),
};

const normalizeLang = (requested) => {
  if (!requested) return "en";
  if (LOCALE_LOADERS[requested]) return requested;
  const base = requested.split("-")[0];
  return LOCALE_LOADERS[base] ? base : "en";
};

export function LanguageProvider({ children }) {
  const [languageRaw, setLanguageRaw] = useState(() => {
    try { return localStorage.getItem(LS_KEY) || "en"; } catch { return "en"; }
  });

  const language = useMemo(() => normalizeLang(languageRaw), [languageRaw]);

  // cache em memória dos bundles já carregados
  const cacheRef = useRef({});           // { en: {...}, pt: {...} }
  const [bundle, setBundle] = useState({}); // bundle ativo
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      // cache hit
      if (cacheRef.current[language]) {
        setBundle(cacheRef.current[language]);
        return;
      }
      const loader = LOCALE_LOADERS[language];
      if (!loader) { setBundle({}); return; }

      setIsLoading(true);
      try {
        const mod = await loader();                // importa ./locales/<lang>.jsx
        const raw = mod?.default ?? {};
        const data = unwrap(raw, language);        // aceita {pt:{…}} ou direto {…}
        if (!cancelled) {
          cacheRef.current[language] = data || {};
          setBundle(data || {});
        }
      } catch (e) {
        console.warn(`[i18n] Falha a carregar "${language}"`, e);
        if (!cancelled) setBundle({});
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [language]);

  // persist e <html lang="…">
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, language);
      if (document?.documentElement) document.documentElement.lang = language;
    } catch {}
  }, [language]);

  const t = useMemo(() => (key) => getDeep(bundle, key, key), [bundle]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage: setLanguageRaw, t, isLoading }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within a LanguageProvider");
  return ctx;
}

export default LanguageContext;
