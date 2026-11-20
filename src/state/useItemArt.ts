import { createContext, useContext, useEffect, useState } from "react";
import { createArtBatch } from "../lib/artBatch";
import { desktop, isDesktopApp } from "../lib/desktop";

/** Where the player's game is (their Client.txt), for reading its item art; null to search for it. */
export const GameLocation = createContext<string | null>(null);

/** One batch per game location: a new location reads the game again. */
const batches = new Map<string, ReturnType<typeof createArtBatch>>();

function batchFor(clientLog: string | null) {
  const id = clientLog ?? "";
  let batch = batches.get(id);
  if (!batch) {
    batch = createArtBatch((bases) => desktop.itemArt(bases, clientLog));
    batches.set(id, batch);
  }
  return batch;
}

/**
 * The game's own picture of an item base, read by the desktop app from the
 * player's Path of Exile installation (never bundled nor downloaded).
 * Undefined while reading, outside the desktop app, or when there is none.
 */
export function useItemArt(base: string | undefined): string | undefined {
  const clientLog = useContext(GameLocation);
  const id = `${clientLog ?? ""}|${base ?? ""}`;
  const [found, setFound] = useState<{ id: string; url: string | undefined } | null>(null);

  useEffect(() => {
    if (!isDesktopApp || !base) return;
    let active = true;
    batchFor(clientLog)(base).then((url) => active && setFound({ id, url }));
    return () => {
      active = false;
    };
  }, [id, base, clientLog]);

  return found?.id === id ? found.url : undefined;
}
