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

/** One moment of a character's progress, kept to chart it over the league. */
export interface Snapshot {
  /** When (ISO date). */
  at: string;
  level: number;
  dps: number;
  ehp: number;
  life: number;
  energyShield: number;
}

const MAX_SNAPSHOTS = 300;

export function readHistory(account: string, character: string): Snapshot[] {
  if (!account || !character) return [];
  return readJsonSetting<Snapshot[]>(key("history", account, character)) ?? [];
}

/**
 * Adds a moment to the character's history when something changed (level,
 * damage or defences), or at most once an hour otherwise. Returns the history.
 */
export function recordSnapshot(account: string, character: string, result: EngineResult, at: Date): Snapshot[] {
  const build = result.character;
  const history = readHistory(account, character);
  if (!build || build.character.name !== character) return history;
  const snapshot: Snapshot = {
    at: at.toISOString(),
    level: build.character.level ?? 0,
    dps: Math.round(build.stats.DPS ?? 0),
    ehp: Math.round(build.stats.TotalEHP ?? 0),
    life: Math.round(build.stats.Life ?? 0),
    energyShield: Math.round(build.stats.EnergyShield ?? 0),
  };
  const last = history[history.length - 1];
  const changed =
    !last ||
    last.level !== snapshot.level ||
    Math.abs(last.dps - snapshot.dps) > Math.max(1, last.dps * 0.01) ||
    Math.abs(last.ehp - snapshot.ehp) > Math.max(1, last.ehp * 0.01);
  const hourPassed = !last || at.getTime() - new Date(last.at).getTime() > 60 * 60 * 1000;
  if (!changed && !hourPassed) return history;
  const next = [...history, snapshot].slice(-MAX_SNAPSHOTS);
  writeJsonSetting(key("history", account, character), next);
  return next;
}
