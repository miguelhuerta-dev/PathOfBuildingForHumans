import { useContext, useEffect, useState } from "react";
import { desktop, isDesktopApp } from "../lib/desktop";
import { GameLocation } from "./useItemArt";

/** One read per class and game location, shared by every component that asks. */
const requests = new Map<string, Promise<string | null>>();

function load(name: string, clientLog: string | null): Promise<string | null> {
  const id = `${clientLog ?? ""}|${name}`;
  let request = requests.get(id);
  if (!request) {
    request = desktop.classArt(name, clientLog);
    // A failure is not cached: installing the game or choosing Client.txt can fix it.
    request.catch(() => requests.delete(id));
    requests.set(id, request);
  }
  return request;
}

/**
 * The character's class picture, read by the desktop app from the player's own
 * Path of Exile installation (never bundled nor downloaded): the ascendancy's
 * once the Labyrinth is done, the base class's emblem before that.
 * Null without the game or in the browser.
 */
export function useClassArt(ascendancy: string | null | undefined, baseClass: string | null | undefined): string | null {
  const clientLog = useContext(GameLocation);
  const name = (ascendancy && ascendancy !== "None" ? ascendancy : baseClass) || null;
  const id = `${clientLog ?? ""}|${name ?? ""}`;
  const [result, setResult] = useState<{ id: string; src: string | null } | null>(null);

  useEffect(() => {
    if (!isDesktopApp || !name) return;
    let active = true;
    load(name, clientLog).then(
      (src) => active && setResult({ id, src }),
      () => active && setResult({ id, src: null }),
    );
    return () => {
      active = false;
    };
  }, [id, name, clientLog]);

  return result?.id === id ? result.src : null;
}
