/**
 * Official item icons are shown straight from Grinding Gear Games' image server,
 * using the URLs pathofexile.com sends with the character data. They are never
 * downloaded, bundled or modified. Set this to false to fall back to the
 * archive's own icon everywhere (for example, if GGG ever asks).
 */
export const SHOW_OFFICIAL_ITEM_ICONS = true;

const OFFICIAL_ICON_HOST = "web.poecdn.com";

/** Returns the URL only if it points to GGG's image server and icons are enabled. */
export function officialIcon(url?: string): string | undefined {
  if (!SHOW_OFFICIAL_ITEM_ICONS || !url) return undefined;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && parsed.hostname === OFFICIAL_ICON_HOST ? url : undefined;
  } catch {
    return undefined;
  }
}
