// Shared helpers for GGG's official tree exports (atlastree-export and
// skilltree-export use the same layout). Used by update-atlas-tree.mjs and
// update-passive-tree.mjs.

import { readFile, writeFile } from "node:fs/promises";

/** Loads data.json from a local path, or from the repository and tag in `lock`. */
export async function loadExport(lock, localPath) {
  if (localPath) return JSON.parse(await readFile(localPath, "utf8"));
  const raw = lock.repository.replace("https://github.com/", "https://raw.githubusercontent.com/");
  const url = `${raw}/${lock.tag}/data.json`;
  const response = await fetch(url, { headers: { "User-Agent": "PathOfBuildingForHumans (tree data update)" } });
  if (!response.ok) throw new Error(`${url} answered ${response.status}`);
  return response.json();
}

// Orbits with 16 and 40 slots are not evenly spaced in GGG's trees.
const ORBIT_ANGLES = {
  16: [0, 30, 45, 60, 90, 120, 135, 150, 180, 210, 225, 240, 270, 300, 315, 330],
  40: [
    0, 10, 20, 30, 40, 45, 50, 60, 70, 80, 90, 100, 110, 120, 130, 135, 140, 150, 160, 170,
    180, 190, 200, 210, 220, 225, 230, 240, 250, 260, 270, 280, 290, 300, 310, 315, 320, 330, 340, 350,
  ],
};

/** A node's position from its group, orbit and slot; null when it has no group. */
export function positionOf(source, node) {
  const group = source.groups[node.group];
  if (!group) return null;
  const { skillsPerOrbit, orbitRadii } = source.constants;
  const slots = skillsPerOrbit[node.orbit];
  const radius = orbitRadii[node.orbit];
  const degrees = ORBIT_ANGLES[slots]?.[node.orbitIndex] ?? (360 * node.orbitIndex) / slots;
  const angle = (degrees * Math.PI) / 180;
  return {
    x: Math.round(group.x + Math.sin(angle) * radius),
    y: Math.round(group.y - Math.cos(angle) * radius),
  };
}

/** "[DemonicEvocator|Demonic Evocator]" -> "Demonic Evocator". */
export const cleanText = (text) => text.replace(/\[(?:[^\]|]*\|)?([^\]]*)\]/g, "$1");

// Only the icon's name is kept, e.g. "AtlasTrees/ThreadNode1". The desktop app
// reads the image itself from the player's installed game (src-tauri/src/game_files).
const ICON_PREFIX = "Art/2DArt/SkillIcons/passives/";
export const iconKey = (path) =>
  path?.startsWith(ICON_PREFIX) && path.endsWith(".png") ? path.slice(ICON_PREFIX.length, -".png".length) : undefined;

/** Undirected edges between kept nodes, each listed once. */
export function edgesOf(source, keptIds) {
  const edges = [];
  const seen = new Set();
  for (const [id, node] of Object.entries(source.nodes)) {
    if (!keptIds.has(id)) continue;
    for (const other of node.out ?? []) {
      if (!keptIds.has(other)) continue;
      const a = Number(id);
      const b = Number(other);
      const key = a < b ? `${a}-${b}` : `${b}-${a}`;
      if (seen.has(key)) continue;
      seen.add(key);
      edges.push([a, b]);
    }
  }
  return edges;
}

export function boundsOf(nodes) {
  const xs = nodes.map((n) => n.x);
  const ys = nodes.map((n) => n.y);
  return { minX: Math.min(...xs), minY: Math.min(...ys), maxX: Math.max(...xs), maxY: Math.max(...ys) };
}

export async function writeTree(target, tree) {
  await writeFile(target, JSON.stringify(tree) + "\n");
}
