#!/usr/bin/env node
// Builds src/data/atlas/atlasTree.json from GGG's official Atlas tree export
// (pinned in src/data/atlas/atlas.lock.json).
//
// Only node positions, names, texts and icon names are kept: the app draws the
// tree with its own art, and the desktop app reads icons from the player's game.
//
// Usage: node scripts/update-atlas-tree.mjs [path/to/data.json]

import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { boundsOf, cleanText, edgesOf, iconKey, loadExport, positionOf, writeTree } from "./lib/ggg-tree.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = join(root, "src/data/atlas");
const lock = JSON.parse(await readFile(join(dataDir, "atlas.lock.json"), "utf8"));
const source = await loadExport(lock, process.argv[2]);
const { nodes } = source;

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
  const at = positionOf(source, node);
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
  const at = positionOf(source, node);
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

const edges = edgesOf(source, known);
const tree = {
  version: lock.tag,
  totalPoints: source.points?.totalPoints ?? 0,
  root: Number(startId),
  bounds: boundsOf(out),
  regions: regionLabels,
  nodes: out.sort((a, b) => a.id - b.id),
  edges,
};

const target = join(dataDir, "atlasTree.json");
await writeTree(target, tree);
console.log(`Atlas tree ${lock.tag}: ${out.length} nodes, ${edges.length} edges, ${regionLabels.length} regions -> ${target}`);
