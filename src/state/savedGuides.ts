import { readJsonSetting, readSetting, writeJsonSetting, writeSetting } from "../lib/settings";

/** A guide the player has opened, kept so it can be reopened from a list. */
export interface SavedGuide {
  /** The code or link it was loaded from. */
  input: string;
  /** "Necromancer · 6L Summon Raging Spirits". */
  title: string;
  /** When it was last opened (ms since epoch). */
  openedAt: number;
}

const LIST_KEY = "pobh.guides";
const LAST_KEY = "pobh.lastGuide";
/** Oldest guides drop off past this many. */
const MAX_SAVED = 12;

export function readSavedGuides(): SavedGuide[] {
  const list = readJsonSetting<SavedGuide[]>(LIST_KEY);
  return Array.isArray(list) ? list : [];
}

/** The input of the guide open when the app was last closed. */
export function readLastGuide(): string | null {
  return readSetting(LAST_KEY);
}

/** Records a guide as just opened: first in the list, and the one to reopen next time. */
export function rememberGuide(input: string, title: string): SavedGuide[] {
  const others = readSavedGuides().filter((guide) => guide.input !== input);
  const list = [{ input, title, openedAt: Date.now() }, ...others].slice(0, MAX_SAVED);
  writeJsonSetting(LIST_KEY, list);
  writeSetting(LAST_KEY, input);
  return list;
}

export function forgetGuide(input: string): SavedGuide[] {
  const list = readSavedGuides().filter((guide) => guide.input !== input);
  writeJsonSetting(LIST_KEY, list);
  if (readLastGuide() === input) writeSetting(LAST_KEY, null);
  return list;
}

/** Closing a guide means not reopening it on the next start; it stays in the list. */
export function clearLastGuide() {
  writeSetting(LAST_KEY, null);
}
