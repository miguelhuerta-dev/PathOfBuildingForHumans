/**
 * Reads Atlas tree links in GGG's official format, as produced by the
 * pathofexile.com Atlas tree viewer and planners that export to it:
 *   https://www.pathofexile.com/fullscreen-atlas-skill-tree/[version/]<code>
 *
 * <code> is base64url. Layout (big-endian), by format version:
 *   4:    u32 version, u8 class, u8 ascendancy, u8 fullscreen, u16 node…
 *   5, 6: u32 version, u8 class, u8 ascendancy, u8 count, u16 node × count, …
 * Cluster and choice data that follow the node list are not needed here.
 */

function decodeBase64Url(code: string): Uint8Array {
  const base64 = code.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function codeFrom(input: string): string {
  const text = input.trim();
  const path = text.split(/[?#]/)[0];
  const segments = path.split("/").filter(Boolean);
  return segments[segments.length - 1] ?? "";
}

/** Node ids allocated in an Atlas tree link. Throws a readable error for anything else. */
export function readAtlasLink(input: string): number[] {
  const code = codeFrom(input);
  if (!/^[A-Za-z0-9_+/=-]{8,}$/.test(code)) {
    throw new Error("This does not look like an Atlas tree link.");
  }

  let bytes: Uint8Array;
  try {
    bytes = decodeBase64Url(code);
  } catch {
    throw new Error("This Atlas tree link is damaged. Copy it again.");
  }
  const view = new DataView(bytes.buffer);
  if (bytes.length < 7) throw new Error("This Atlas tree link is too short.");

  const version = view.getUint32(0);
  const nodes: number[] = [];
  if (version === 4) {
    for (let at = 7; at + 1 < bytes.length; at += 2) nodes.push(view.getUint16(at));
  } else if (version === 5 || version === 6) {
    const count = view.getUint8(6);
    if (bytes.length < 7 + count * 2) throw new Error("This Atlas tree link is incomplete.");
    for (let i = 0; i < count; i++) nodes.push(view.getUint16(7 + i * 2));
  } else {
    throw new Error(`Atlas tree links of format ${version} are not supported yet.`);
  }
  return nodes;
}
