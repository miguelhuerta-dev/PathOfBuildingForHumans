/**
 * Local settings stored in the webview's localStorage. Storage can be
 * unavailable (private mode, cleared data), so every access is guarded and a
 * missing value simply means "not remembered".
 */

export function readSetting(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeSetting(key: string, value: string | null) {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    // Storage unavailable: settings simply are not remembered.
  }
}

export function readJsonSetting<T>(key: string): T | null {
  const raw = readSetting(key);
  if (raw === null) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function writeJsonSetting(key: string, value: unknown) {
  writeSetting(key, value === null ? null : JSON.stringify(value));
}
