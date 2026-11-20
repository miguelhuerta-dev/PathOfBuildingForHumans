import { readJsonSetting, readSetting, writeJsonSetting, writeSetting } from "../lib/settings";
import type { Bandit, EngineResult } from "../types/Engine";

/**
 * What the archive remembers per account and character: the last character
 * opened on each account, the bandit each character helped (public profiles
 * leave it out), and the last result, so the app opens on it at once while it
 * refreshes.
 */

const BANDITS: Bandit[] = ["None", "Oak", "Kraityn", "Alira"];

const key = (kind: string, account: string, character?: string) =>
  `pobh.${kind}.${account.toLowerCase()}${character ? `/${character}` : ""}`;

export function readLastCharacter(account: string): string | null {
  return account ? readSetting(key("lastCharacter", account)) : null;
}

export function rememberLastCharacter(account: string, character: string) {
  if (account) writeSetting(key("lastCharacter", account), character);
}

export function readBandit(account: string, character: string): Bandit | null {
  const value = readSetting(key("bandit", account, character));
  return BANDITS.includes(value as Bandit) ? (value as Bandit) : null;
}

export function rememberBandit(account: string, character: string, bandit: Bandit) {
  writeSetting(key("bandit", account, character), bandit);
}

export interface CachedResult {
  result: EngineResult;
  /** When it was calculated (ISO date). */
  updatedAt: string;
}

export function readCachedResult(account: string, character: string): CachedResult | null {
  if (!account || !character) return null;
  const cached = readJsonSetting<CachedResult>(key("result", account, character));
  return cached?.result?.character ? cached : null;
}

export function cacheResult(account: string, character: string, result: EngineResult, updatedAt: Date) {
  if (!account || !character || !result.character) return;
  writeJsonSetting(key("result", account, character), { result, updatedAt: updatedAt.toISOString() });
}
