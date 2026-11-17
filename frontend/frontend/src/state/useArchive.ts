import { useCallback, useEffect, useRef, useState } from "react";
import demoCharacter from "../data/demo/demoCharacter.json";
import { desktop, isDesktopApp } from "../lib/desktop";
import { readSetting, writeSetting } from "../lib/settings";
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
      try {
        const next = await desktop.loadCharacter(account, name);
        setResult(next);
        setUpdatedAt(new Date());
        setCharacterState("idle");
      } catch (error) {
        setCharacterError((error as Error).message);
        setCharacterState("error");
      }
    },
    [account],
  );

  const refresh = useCallback(() => {
    if (selected) void loadCharacter(selected);
  }, [loadCharacter, selected]);

  const loadGuide = useCallback(async (input: string) => {
    if (!input.trim()) return;
    setGuideState("loading");
    setGuideError(null);
    try {
      const next = await desktop.loadGuide(input.trim());
      setResult((previous) => ({ ...previous, ...next }));
      setGuideState("idle");
    } catch (error) {
      setGuideError((error as Error).message);
      setGuideState("error");
    }
  }, []);

  const selectStage = useCallback(async (stage: number | null) => {
    setGuideState("loading");
    setGuideError(null);
    try {
      const next = await desktop.selectGuideStage(stage);
      setResult((previous) => ({ ...previous, ...next }));
      setGuideState("idle");
    } catch (error) {
      setGuideError((error as Error).message);
      setGuideState("error");
    }
  }, []);

  const clearGuide = useCallback(async () => {
    await desktop.clearGuide();
    setResult((previous) => (previous ? { character: previous.character } : previous));
  }, []);

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
    if (account) {
      void loadCharacters(account);
      if (selected) void loadCharacter(selected);
    }
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
  }, [account, clientLog, loadCharacter, loadCharacters, selected]);

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
    disconnect,
    clientLog,
    setClientLog: updateClientLog,
    autoRefresh,
    setAutoRefresh: updateAutoRefresh,
    lastZone,
  };
}

export type Archive = ReturnType<typeof useArchive>;
