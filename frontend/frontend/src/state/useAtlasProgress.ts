import { useCallback, useEffect, useMemo, useState } from "react";
import { buildGraph, computeProgress, type AtlasGraph } from "../atlas/progress";
import { readAtlasLink } from "../atlas/treeLink";
import type { AtlasTreeData } from "../atlas/types";
import { readJsonSetting, writeJsonSetting } from "../lib/settings";

/** What is remembered per league. Node ids only, so a new tree version keeps old progress. */
interface StoredAtlas {
  guide: number[];
  owned: number[];
}

const EMPTY: StoredAtlas = { guide: [], owned: [] };
const storageKey = (league: string) => `pobh.atlas.${league}`;

// The tree data (~200 KB) is only fetched when the Atlas page is first opened.
let graphPromise: Promise<AtlasGraph> | null = null;
function loadGraph() {
  graphPromise ??= import("../data/atlas/atlasTree.json").then((module) =>
    // JSON imports widen tuples and unions; the generator guarantees the shape.
    buildGraph(module.default as unknown as AtlasTreeData),
  );
  return graphPromise;
}

/**
 * The Atlas tree the player follows (from a guide's Atlas link) and the
 * passives they already have, which they mark by hand because GGG's public
 * profiles do not include the Atlas tree. Both are kept per league.
 */
export function useAtlasProgress(league: string) {
  const [graph, setGraph] = useState<AtlasGraph | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [stored, setStored] = useState<{ league: string; data: StoredAtlas }>(() => ({
    league,
    data: readJsonSetting<StoredAtlas>(storageKey(league)) ?? EMPTY,
  }));
  const [linkError, setLinkError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    loadGraph().then(
      (loaded) => active && setGraph(loaded),
      () => active && setLoadError("The Atlas tree could not be loaded."),
    );
    return () => {
      active = false;
    };
  }, []);

  // Switching to a character in another league swaps in that league's progress.
  if (stored.league !== league) {
    setStored({ league, data: readJsonSetting<StoredAtlas>(storageKey(league)) ?? EMPTY });
  }
  const data = stored.data;

  const update = useCallback(
    (change: (current: StoredAtlas) => StoredAtlas) => {
      setStored((previous) => {
        const next = change(previous.data);
        writeJsonSetting(storageKey(previous.league), next);
        return { league: previous.league, data: next };
      });
    },
    [],
  );

  const guide = useMemo(() => new Set(data.guide), [data.guide]);
  const owned = useMemo(() => new Set(data.owned), [data.owned]);
  const progress = useMemo(() => (graph ? computeProgress(graph, guide, owned) : null), [graph, guide, owned]);

  /** Replaces the guide's tree or the player's passives with an Atlas link; false (and linkError) if unreadable. */
  const importLink = useCallback(
    (target: "guide" | "owned", input: string): boolean => {
      try {
        const ids = readAtlasLink(input).filter((id) => graph?.byId.has(id) ?? true);
        if (ids.length === 0) throw new Error("This Atlas tree link has no passives from the current Atlas tree.");
        update((current) => ({ ...current, [target]: ids }));
        setLinkError(null);
        return true;
      } catch (error) {
        setLinkError(error instanceof Error ? error.message : String(error));
        return false;
      }
    },
    [graph, update],
  );

  const toggleOwned = useCallback(
    (id: number) =>
      update((current) => ({
        ...current,
        owned: current.owned.includes(id) ? current.owned.filter((x) => x !== id) : [...current.owned, id],
      })),
    [update],
  );

  const clear = useCallback(
    (target: "guide" | "owned") => update((current) => ({ ...current, [target]: [] })),
    [update],
  );

  return { graph, loadError, guide, owned, progress, importLink, linkError, toggleOwned, clear };
}

export type AtlasProgressState = ReturnType<typeof useAtlasProgress>;
