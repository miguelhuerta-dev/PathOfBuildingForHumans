import { useCallback, useEffect, useRef, useState } from "react";
import demoCharacter from "../data/demo/demoCharacter.json";
import { desktop, isDesktopApp } from "../lib/desktop";
import { readSetting, writeSetting } from "../lib/settings";
import { clearLastGuide, forgetGuide, readLastGuide, readSavedGuides, rememberGuide, type SavedGuide } from "./savedGuides";
import type { CharacterSummary, EngineResult } from "../types/Engine";

const STORAGE = {
  account: "pobh.account",
  character: "pobh.character",
  clientLog: "pobh.clientLog",
  autoRefresh: "pobh.autoRefresh",
};

/** Minimum time between automatic refreshes, to respect pathofexile.com rate limits. */
const AUTO_REFRESH_COOLDOWN_MS = 60_000;

export type LoadState = "idle" | "loading" | "error";

/**
 * Everything the app knows about the connected account, the selected
 * character and the loaded guide. One result object holds the character,
 * the guide and the upgrades, because the engine computes them together.
 */
export function useArchive() {
  const [account, setAccount] = useState(() => readSetting(STORAGE.account) ?? "");
  const [characters, setCharacters] = useState<CharacterSummary[]>([]);
  const [listState, setListState] = useState<LoadState>("idle");
  const [listError, setListError] = useState<string | null>(null);

  const [selected, setSelected] = useState<string | null>(() => readSetting(STORAGE.character));
  const [result, setResult] = useState<EngineResult | null>(() =>
    isDesktopApp ? null : (demoCharacter as unknown as EngineResult),
  );
  const [characterState, setCharacterState] = useState<LoadState>("idle");
  const [characterError, setCharacterError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const [guideState, setGuideState] = useState<LoadState>("idle");
  const [guideError, setGuideError] = useState<string | null>(null);

  const [clientLog, setClientLog] = useState(() => readSetting(STORAGE.clientLog) ?? "");
  const [autoRefresh, setAutoRefresh] = useState(() => readSetting(STORAGE.autoRefresh) !== "false");
  const [lastZone, setLastZone] = useState<string | null>(null);

  const lastRefresh = useRef(0);
  // Every engine request answers with the whole result. Only the latest request
  // may apply its answer, so a slow, older one never overwrites a newer one; an
  // older request just stops showing as loading, the newer answer covers it.
  const latestRequest = useRef(0);

  const loadCharacters = useCallback(async (accountName: string) => {
    const trimmed = accountName.trim();
    if (!trimmed) return;
    setListState("loading");
    setListError(null);
    try {
      const list = await desktop.listCharacters(trimmed);
      setCharacters([...list].sort((a, b) => b.level - a.level));
      setAccount(trimmed);
      writeSetting(STORAGE.account, trimmed);
      setListState("idle");
    } catch (error) {
      setListError((error as Error).message);
      setListState("error");
    }
  }, []);

  const loadCharacter = useCallback(
    async (name: string) => {
      if (!account) return;
      setSelected(name);
      writeSetting(STORAGE.character, name);
      setCharacterState("loading");
      setCharacterError(null);
      lastRefresh.current = Date.now();
      const request = ++latestRequest.current;
      try {
        const next = await desktop.loadCharacter(account, name);
        if (request !== latestRequest.current) return setCharacterState("idle");
        setResult(next);
        setUpdatedAt(new Date());
        setCharacterState("idle");
      } catch (error) {
        if (request !== latestRequest.current) return setCharacterState("idle");
        setCharacterError((error as Error).message);
        setCharacterState("error");
      }
    },
    [account],
  );

  const refresh = useCallback(() => {
    if (selected) void loadCharacter(selected);
  }, [loadCharacter, selected]);

  const [savedGuides, setSavedGuides] = useState<SavedGuide[]>(readSavedGuides);
  const [guideInput, setGuideInput] = useState<string | null>(null);

  const loadGuide = useCallback(async (input: string) => {
    const code = input.trim();
    if (!code) return;
    setGuideState("loading");
    setGuideError(null);
    const request = ++latestRequest.current;
    try {
      const next = await desktop.loadGuide(code);
      // The engine now holds this guide, even if a newer answer (a zone refresh) is shown
      // instead: remember it under its class and main skill, to reopen on the next start.
      const build = next.guide?.character;
      const title = [build?.ascendancy ?? build?.class, build?.mainSkill].filter(Boolean).join(" · ") || "Guide";
      setSavedGuides(rememberGuide(code, title));
      setGuideInput(code);
      if (request !== latestRequest.current) return setGuideState("idle");
      setResult((previous) => ({ ...previous, ...next }));
      setGuideState("idle");
    } catch (error) {
      if (request !== latestRequest.current) return setGuideState("idle");
      setGuideError((error as Error).message);
      setGuideState("error");
    }
  }, []);

  const selectStage = useCallback(async (stage: number | null) => {
    setGuideState("loading");
    setGuideError(null);
    const request = ++latestRequest.current;
    try {
      const next = await desktop.selectGuideStage(stage);
      if (request !== latestRequest.current) return setGuideState("idle");
      setResult((previous) => ({ ...previous, ...next }));
      setGuideState("idle");
    } catch (error) {
      if (request !== latestRequest.current) return setGuideState("idle");
      setGuideError((error as Error).message);
      setGuideState("error");
    }
  }, []);

  const clearGuide = useCallback(async () => {
    // Answers still on their way would bring the guide back.
    latestRequest.current += 1;
    await desktop.clearGuide();
    clearLastGuide();
    setGuideInput(null);
    setGuideState("idle");
    setResult((previous) => (previous ? { character: previous.character } : previous));
  }, []);

  const removeSavedGuide = useCallback((input: string) => setSavedGuides(forgetGuide(input)), []);

  const disconnect = useCallback(() => {
    setAccount("");
    setCharacters([]);
    setSelected(null);
    setResult(null);
    writeSetting(STORAGE.account, null);
    writeSetting(STORAGE.character, null);
  }, []);

  // Restore the last session on start.
  const restored = useRef(false);
  useEffect(() => {
    if (!isDesktopApp || restored.current) return;
    restored.current = true;
    const lastGuide = readLastGuide();
    void (async () => {
      if (account) {
        void loadCharacters(account);
        if (selected) await loadCharacter(selected);
      }
      // After the character, so the guide opens already compared with it.
      if (lastGuide) await loadGuide(lastGuide);
    })();
    if (!clientLog) {
      desktop
        .detectClientLog()
        .then((path) => {
          if (path) {
            setClientLog(path);
            writeSetting(STORAGE.clientLog, path);
          }
        })
        .catch(() => undefined);
    }
  }, [account, clientLog, loadCharacter, loadCharacters, loadGuide, selected]);

  // Watch Client.txt and refresh the character when the player changes zone.
  // The log listener lives as long as the log path; these refs let it call the
  // latest refresh and read the latest toggle without re-subscribing.
  const refreshRef = useRef(refresh);
  const autoRefreshRef = useRef(autoRefresh);
  useEffect(() => {
    refreshRef.current = refresh;
    autoRefreshRef.current = autoRefresh;
  }, [refresh, autoRefresh]);

  useEffect(() => {
    if (!isDesktopApp || !clientLog) return;
    let active = true;
    let unlisten: (() => void) | undefined;

    desktop
      .watchClientLog(clientLog)
      .then(() =>
        desktop.onZoneEntered((zone) => {
          setLastZone(zone);
          if (autoRefreshRef.current && Date.now() - lastRefresh.current > AUTO_REFRESH_COOLDOWN_MS) {
            refreshRef.current();
          }
        }),
      )
      .then((fn) => {
        if (active) unlisten = fn;
        else fn?.();
      })
      .catch(() => undefined);

    return () => {
      active = false;
      unlisten?.();
      void desktop.stopWatchingClientLog().catch(() => undefined);
    };
  }, [clientLog]);

  const updateClientLog = useCallback((path: string) => {
    setClientLog(path);
    writeSetting(STORAGE.clientLog, path || null);
  }, []);

  const updateAutoRefresh = useCallback((value: boolean) => {
    setAutoRefresh(value);
    writeSetting(STORAGE.autoRefresh, String(value));
  }, []);

  return {
    isDesktopApp,
    account,
    characters,
    listState,
    listError,
    loadCharacters,
    selected,
    loadCharacter,
    refresh,
    result,
    characterState,
    characterError,
    updatedAt,
    guideState,
    guideError,
    loadGuide,
    selectStage,
    clearGuide,
    /** Guides opened before, most recent first. */
    savedGuides,
    removeSavedGuide,
    /** The code or link of the open guide. */
    guideInput,
    disconnect,
    clientLog,
    setClientLog: updateClientLog,
    autoRefresh,
    setAutoRefresh: updateAutoRefresh,
    lastZone,
  };
}

export type Archive = ReturnType<typeof useArchive>;
