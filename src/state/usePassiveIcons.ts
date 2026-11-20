import { useEffect, useMemo, useState } from "react";
import { desktop, isDesktopApp } from "../lib/desktop";

/** Icons by name, as image URLs. Empty when the game's icons are not available. */
export type PassiveIcons = Readonly<Record<string, string>>;

export interface PassiveIconsState {
  icons: PassiveIcons;
  /** Why the game's icons could not be shown, if they could not. */
  unavailable: string | null;
  /** True while the icons are being read from the game. */
  loading: boolean;
  /** A line to show under the map: what is happening, or why there are no icons. */
  note: string | null;
}

const NONE: PassiveIcons = {};
const BROWSER_NOTE = "The game's own icons are shown in the desktop app, read from your Path of Exile installation.";
const READING_NOTE = "Reading the passive icons from your Path of Exile installation…";

/** One read per set of icons and game location, shared by every page that asks. */
const requests = new Map<string, Promise<PassiveIcons>>();

function load(keys: string[], clientLog: string | null): Promise<PassiveIcons> {
  const id = `${clientLog ?? ""}|${keys.join(",")}`;
  let request = requests.get(id);
  if (!request) {
    request = desktop.passiveIcons(keys, clientLog);
    // A failure is not cached: installing the game or choosing Client.txt can fix it.
    request.catch(() => requests.delete(id));
    requests.set(id, request);
  }
  return request;
}

/**
 * Passive skill icons read by the desktop app from the player's own Path of
 * Exile installation. They are never bundled with the app nor downloaded.
 */
export function usePassiveIcons(keys: readonly string[], clientLog: string | null): PassiveIconsState {
  // Keyed by content, so a new array with the same names does not read the game again.
  const joined = [...new Set(keys)].sort().join(",");
  const sorted = useMemo(() => (joined ? joined.split(",") : []), [joined]);
  const id = `${clientLog ?? ""}|${joined}`;
  const [result, setResult] = useState<{ id: string; icons: PassiveIcons; error: string | null } | null>(null);

  useEffect(() => {
    if (!isDesktopApp || sorted.length === 0) return;
    let active = true;
    load(sorted, clientLog).then(
      (icons) => active && setResult({ id, icons, error: null }),
      (error: unknown) =>
        active && setResult({ id, icons: NONE, error: error instanceof Error ? error.message : String(error) }),
    );
    return () => {
      active = false;
    };
  }, [id, sorted, clientLog]);

  if (!isDesktopApp) return { icons: NONE, unavailable: BROWSER_NOTE, loading: false, note: BROWSER_NOTE };
  // Results for an earlier request (another game location) are not shown.
  const current = result?.id === id ? result : null;
  // The first read decodes the textures (a few seconds); later ones come from the cache.
  const loading = sorted.length > 0 && current === null;
  const unavailable = current?.error ?? null;
  return { icons: current?.icons ?? NONE, unavailable, loading, note: loading ? READING_NOTE : unavailable };
}
