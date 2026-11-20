import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { readSetting, writeSetting } from "../lib/settings";
import { es } from "./es";

/**
 * The archive in English or Spanish. Every text is written in English in the
 * code and looked up in the Spanish dictionary when Spanish is chosen; a text
 * missing from the dictionary shows in English rather than as a broken key.
 * Game names (items, gems, modifiers, passives) stay as the game writes them.
 */

export type Language = "en" | "es";

const STORAGE = "pobh.language";

/** The language the player chose, or null before the first choice. */
export function readLanguage(): Language | null {
  const saved = readSetting(STORAGE);
  return saved === "en" || saved === "es" ? saved : null;
}

/** "{name}" in a text is replaced by `vars.name`. */
export type Vars = Record<string, string | number>;
export type Translate = (text: string, vars?: Vars) => string;

function fill(text: string, vars?: Vars): string {
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (match, name: string) => (name in vars ? String(vars[name]) : match));
}

/** Translates without React: for code outside components (analysis, formatting). */
export function translator(language: Language): Translate {
  return (text, vars) => fill(language === "es" ? (es[text] ?? text) : text, vars);
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
