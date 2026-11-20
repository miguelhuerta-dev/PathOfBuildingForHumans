import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import type { Bandit, CharacterSummary, EngineResult, ForgeResult, MarketPrice, BestPassives } from "../types/Engine";

/** True when running inside the desktop app rather than a browser tab. */
export const isDesktopApp = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

function errorMessage(error: unknown): string {
  return typeof error === "string" ? error : error instanceof Error ? error.message : "Something went wrong.";
}

async function call<T>(command: string, args?: Record<string, unknown>): Promise<T> {
  if (!isDesktopApp) {
    throw new Error("This feature needs the desktop app.");
  }
  try {
    return await invoke<T>(command, args);
  } catch (error) {
    throw new Error(errorMessage(error));
  }
}

export const desktop = {
  listCharacters: (account: string) => call<CharacterSummary[]>("list_characters", { account }),
  loadCharacter: (account: string, character: string, bandit?: Bandit) =>
    call<EngineResult>("load_character", { account, character, bandit: bandit ?? null }),
  loadGuide: (input: string) => call<EngineResult>("load_guide", { input }),
  /** Opens a guide without calculating it; the next character load compares both. */
  prepareGuide: (input: string) => call<void>("prepare_guide", { input }),
  /** An item's base, tiers, free affixes and what can roll on it; a unique's league and source. */
  /** The character's best next passives, tried on it and ranked by gain per point. */
  bestPassives: () => call<BestPassives>("best_passives"),
  forgeItem: (raw: string, slot?: string) => call<ForgeResult>("forge_item", { raw, slot: slot ?? null }),
  /** What a unique sells for in a league, from poe.ninja: cheapest listing first. */
  uniquePrice: (name: string, league: string) => call<MarketPrice[]>("unique_price", { name, league }),
  selectGuideStage: (stage: number | null) => call<EngineResult>("select_guide_stage", { stage }),
  clearGuide: () => call<void>("clear_guide"),
  detectClientLog: () => call<string | null>("detect_client_log"),
  watchClientLog: (path: string) => call<void>("watch_client_log", { path }),
  stopWatchingClientLog: () => call<void>("stop_watching_client_log"),
  /** Passive skill icons read from the installed game, as image URLs by icon name. */
  passiveIcons: async (keys: string[], clientLog: string | null) => {
    // Each value is a cached PNG on disk (served through the asset protocol) or a data URL.
    const icons = await call<Record<string, string>>("passive_icons", { keys, clientLog });
    return Object.fromEntries(
      Object.entries(icons).map(([key, source]) => [key, source.startsWith("data:") ? source : convertFileSrc(source)]),
    );
  },
  /** Item art read from the installed game, as image URLs by base name ("Divine Life Flask"). */
  itemArt: async (bases: string[], clientLog: string | null) => {
    const art = await call<Record<string, string>>("item_art", { bases, clientLog });
    return Object.fromEntries(
      Object.entries(art).map(([base, source]) => [base, source.startsWith("data:") ? source : convertFileSrc(source)]),
    );
  },
  /** Opens the author's GitHub profile in the system browser. */
  openProfile: () => call<void>("open_profile"),
  onZoneEntered: (handler: (zone: string) => void): Promise<UnlistenFn> =>
    listen<string>("zone-entered", (event) => handler(event.payload)),
};
