#!/usr/bin/env node
// Builds src/data/atlas/atlasTree.json from GGG's official Atlas tree export
// (pinned in src/data/atlas/atlas.lock.json).
//
// Only node positions, names and texts are kept: the app draws the tree with its
// own original art, so GGG's sprites and icons are never downloaded or bundled.
//
// Usage: node scripts/update-atlas-tree.mjs [path/to/data.json]

import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = join(root, "src/data/atlas");
const lock = JSON.parse(await readFile(join(dataDir, "atlas.lock.json"), "utf8"));

async function loadSource() {
  const local = process.argv[2];
  if (local) return JSON.parse(await readFile(local, "utf8"));
  const raw = lock.repository.replace("https://github.com/", "https://raw.githubusercontent.com/");
  const url = `${raw}/${lock.tag}/data.json`;
  const response = await fetch(url, { headers: { "User-Agent": "PathOfBuildingForHumans (atlas tree update)" } });
  if (!response.ok) throw new Error(`${url} answered ${response.status}`);
  return response.json();
}

const source = await loadSource();
const { nodes, groups, constants } = source;

// Orbits with 16 and 40 slots are not evenly spaced in GGG's trees.
const ORBIT_ANGLES = {
  16: [0, 30, 45, 60, 90, 120, 135, 150, 180, 210, 225, 240, 270, 300, 315, 330],
  40: [
    0, 10, 20, 30, 40, 45, 50, 60, 70, 80, 90, 100, 110, 120, 130, 135, 140, 150, 160, 170,
    180, 190, 200, 210, 220, 225, 230, 240, 250, 260, 270, 280, 290, 300, 310, 315, 320, 330, 340, 350,
  ],
};

function position(node) {
  const group = groups[node.group];
  if (!group) return null;
  const slots = constants.skillsPerOrbit[node.orbit];
  const radius = constants.orbitRadii[node.orbit];
  const degrees = ORBIT_ANGLES[slots]?.[node.orbitIndex] ?? (360 * node.orbitIndex) / slots;
  const angle = (degrees * Math.PI) / 180;
  return {
    x: Math.round(group.x + Math.sin(angle) * radius),
    y: Math.round(group.y - Math.cos(angle) * radius),
  };
}

// Only the icon's name is kept, e.g. "AtlasTrees/ThreadNode1". The desktop app
// reads the image itself from the player's installed game (src-tauri/src/game_files).
const ICON_PREFIX = "Art/2DArt/SkillIcons/passives/";
const iconKey = (path) =>
  path?.startsWith(ICON_PREFIX) && path.endsWith(".png") ? path.slice(ICON_PREFIX.length, -".png".length) : undefined;

/** "[DemonicEvocator|Demonic Evocator]" -> "Demonic Evocator". */
const cleanText = (text) => text.replace(/\[(?:[^\]|]*\|)?([^\]]*)\]/g, "$1");

// GGG's "root" entry has no position; the node it points to is the Atlas centre,
// which every player starts with.
const startId = nodes.root?.out?.[0];
if (!startId || !nodes[startId]) throw new Error("The Atlas tree has no start node.");

function kindOf(id, node) {
  if (id === startId) return "root";
  if (node.isKeystone) return "keystone";
  if (node.isWormhole) return "wormhole";
  if (node.isNotable) return "notable";
  return "normal";
}

// Mastery nodes cannot be allocated; they name the region around them.
const regions = [];
for (const node of Object.values(nodes)) {
  if (!node.isMastery) continue;
  const at = position(node);
  if (at) regions.push({ name: node.name, ...at });
}

function nearestRegion(at) {
  let best = null;
  let bestDistance = Infinity;
  for (const region of regions) {
    const distance = Math.hypot(region.x - at.x, region.y - at.y);
    if (distance < bestDistance) {
      best = region;
      bestDistance = distance;
    }
  }
  return best?.name;
}

const out = [];
const known = new Set();
for (const [id, node] of Object.entries(nodes)) {
  if (id === "root" || node.isMastery) continue;
  const at = position(node);
  if (!at) continue;
  const kind = kindOf(id, node);
  const entry = { id: Number(id), kind, name: node.name || "Heart of the Atlas", ...at };
  const icon = iconKey(node.icon);
  if (icon && kind !== "wormhole") entry.icon = icon;
  const stats = (node.stats ?? []).map(cleanText);
  if (stats.length) entry.stats = stats;
  if (node.variantEffects?.length) entry.choices = node.variantEffects.map((v) => v.stats.map(cleanText).join(" "));
  if (kind !== "root") entry.region = nearestRegion(at);
  out.push(entry);
  known.add(id);
}

const edges = [];
const seen = new Set();
for (const [id, node] of Object.entries(nodes)) {
  if (!known.has(id)) continue;
  for (const other of node.out ?? []) {
    if (!known.has(other)) continue;
    const a = Number(id);
    const b = Number(other);
    const key = a < b ? `${a}-${b}` : `${b}-${a}`;
    if (seen.has(key)) continue;
    seen.add(key);
    edges.push([a, b]);
  }
}

// Map labels: a mechanic can appear in several places, so its nodes are split
// into clusters of nearby nodes and each sizeable cluster gets a label at its
// centre. Small outposts (e.g. the ring around the Atlas centre) stay unlabelled.
const LABEL_LINK_DISTANCE = 1400;
const LABEL_MIN_NODES = 8;
const regionLabels = [];
const byRegion = Map.groupBy(out.filter((n) => n.region), (n) => n.region);
for (const [name, members] of byRegion) {
  const unvisited = new Set(members);
  while (unvisited.size) {
    const [first] = unvisited;
    unvisited.delete(first);
    const cluster = [first];
    for (let i = 0; i < cluster.length; i++) {
      for (const other of unvisited) {
        if (Math.hypot(other.x - cluster[i].x, other.y - cluster[i].y) <= LABEL_LINK_DISTANCE) {
          unvisited.delete(other);
          cluster.push(other);
        }
      }
    }
    if (cluster.length < LABEL_MIN_NODES) continue;
    const x = Math.round(cluster.reduce((sum, n) => sum + n.x, 0) / cluster.length);
    const y = Math.round(cluster.reduce((sum, n) => sum + n.y, 0) / cluster.length);
    const duplicate = regionLabels.some(
      (label) => label.name === name && Math.hypot(label.x - x, label.y - y) < LABEL_LINK_DISTANCE,
    );
    if (!duplicate) regionLabels.push({ name, x, y });
  }
}

const xs = out.map((n) => n.x);
const ys = out.map((n) => n.y);
const tree = {
  version: lock.tag,
  totalPoints: source.points?.totalPoints ?? 0,
  root: Number(startId),
  bounds: { minX: Math.min(...xs), minY: Math.min(...ys), maxX: Math.max(...xs), maxY: Math.max(...ys) },
  regions: regionLabels,
  nodes: out.sort((a, b) => a.id - b.id),
  edges,
};

const target = join(dataDir, "atlasTree.json");
await writeFile(target, JSON.stringify(tree) + "\n");
console.log(`Atlas tree ${lock.tag}: ${out.length} nodes, ${edges.length} edges, ${regionLabels.length} regions -> ${target}`);
