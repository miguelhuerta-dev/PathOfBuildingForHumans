/** Reads many names at once: name → image URL; names without art are left out. */
export type ArtLoader = (names: string[]) => Promise<Record<string, string>>;

/**
 * Collects the names asked for during one tick into a single read, and
 * remembers every answer, so a page full of item icons reads the game once.
 * A failed read is forgotten: installing the game or choosing Client.txt can fix it.
 */
export function createArtBatch(load: ArtLoader) {
  const known = new Map<string, Promise<string | undefined>>();
  let pending: { name: string; resolve: (url: string | undefined) => void }[] = [];

  function flush() {
    const batch = pending;
    pending = [];
    load([...new Set(batch.map((entry) => entry.name))]).then(
      (found) => batch.forEach((entry) => entry.resolve(found[entry.name])),
      () =>
        batch.forEach((entry) => {
          known.delete(entry.name);
          entry.resolve(undefined);
        }),
    );
  }

  return function art(name: string): Promise<string | undefined> {
    let request = known.get(name);
    if (!request) {
      request = new Promise((resolve) => {
        if (pending.length === 0) setTimeout(flush, 0);
        pending.push({ name, resolve });
      });
      known.set(name, request);
    }
    return request;
  };
}
