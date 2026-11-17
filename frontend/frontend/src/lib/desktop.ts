import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import type { CharacterSummary, EngineResult } from "../types/Engine";

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
  loadCharacter: (account: string, character: string) =>
    call<EngineResult>("load_character", { account, character }),
  loadGuide: (input: string) => call<EngineResult>("load_guide", { input }),
  selectGuideStage: (stage: number | null) => call<EngineResult>("select_guide_stage", { stage }),
  clearGuide: () => call<void>("clear_guide"),
  detectClientLog: () => call<string | null>("detect_client_log"),
  watchClientLog: (path: string) => call<void>("watch_client_log", { path }),
  stopWatchingClientLog: () => call<void>("stop_watching_client_log"),
  /** Passive skill icons read from the installed game, as PNG data URLs by icon name. */
  passiveIcons: (keys: string[], clientLog: string | null) =>
    call<Record<string, string>>("passive_icons", { keys, clientLog }),
  onZoneEntered: (handler: (zone: string) => void): Promise<UnlistenFn> =>
    listen<string>("zone-entered", (event) => handler(event.payload)),
};
