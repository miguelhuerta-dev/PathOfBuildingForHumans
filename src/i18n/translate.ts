import { es } from "./es";

/**
 * The archive in English or Spanish. Every text is written in English in the
 * code and looked up in the Spanish dictionary when Spanish is chosen; a text
 * missing from the dictionary shows in English rather than as a broken key.
 * Game names (items, gems, modifiers, passives) stay as the game writes them.
 *
 * This file has no React, so the analysis and the tests can use it directly.
 */

export type Language = "en" | "es";

/** "{name}" in a text is replaced by `vars.name`. */
export type Vars = Record<string, string | number | undefined>;
export type Translate = (text: string, vars?: Vars) => string;

function fill(text: string, vars?: Vars): string {
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (match, name: string) => (name in vars ? String(vars[name] ?? "") : match));
}

/** Translates without React: for code outside components (analysis, formatting). */
export function translator(language: Language): Translate {
  return (text, vars) => fill(language === "es" ? (es[text] ?? text) : text, vars);
}
