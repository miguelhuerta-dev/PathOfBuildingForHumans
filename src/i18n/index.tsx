import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { readSetting, writeSetting } from "../lib/settings";
import { translator, type Language, type Translate } from "./translate";

// The texts and the translator live in ./translate (no React); this file holds the React side.
export type { Language, Translate, Vars } from "./translate";

const STORAGE = "pobh.language";

/** The language the player chose, or null before the first choice. */
export function readLanguage(): Language | null {
  const saved = readSetting(STORAGE);
  return saved === "en" || saved === "es" ? saved : null;
}

interface LanguageState {
  /** null until the player picks a language (the first launch). */
  language: Language | null;
  setLanguage: (language: Language) => void;
  t: Translate;
}

const LanguageContext = createContext<LanguageState>({
  language: "en",
  setLanguage: () => undefined,
  t: translator("en"),
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language | null>(readLanguage);
  const setLanguage = useCallback((next: Language) => {
    writeSetting(STORAGE, next);
    setLanguageState(next);
    document.documentElement.lang = next;
  }, []);
  const value = useMemo(() => ({ language, setLanguage, t: translator(language ?? "en") }), [language, setLanguage]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

/** The chosen language, its setter and `t()` for the current component. */
export function useLanguage(): LanguageState {
  return useContext(LanguageContext);
}

/** Just `t()`: `t("Scholar's Verdict")`, `t("{count} points", { count: 3 })`. */
export function useT(): Translate {
  return useContext(LanguageContext).t;
}
