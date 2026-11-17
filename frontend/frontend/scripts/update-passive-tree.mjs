#!/usr/bin/env node
// Builds src/data/passives/passiveTree.json from GGG's official passive skill
// tree export (pinned in src/data/passives/passives.lock.json).
//
// Only the main tree is drawn: ascendancies, cluster jewel passives and
// anointment-only notables are left out. Like the Atlas, only positions, texts
// and icon names are kept; the desktop app reads icons from the player's game.
//
// Usage: node scripts/update-passive-tree.mjs [path/to/data.json]

import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { boundsOf, cleanText, edgesOf, iconKey, loadExport, positionOf, writeTree } from "./lib/ggg-tree.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = join(root, "src/data/passives");
const lock = JSON.parse(await readFile(join(dataDir, "passives.lock.json"), "utf8"));
const source = await loadExport(lock, process.argv[2]);

const proxyGroups = new Set(
  Object.entries(source.groups)
    .filter(([, group]) => group.isProxy)
    .map(([id]) => Number(id)),
);

function kindOf(node) {
  if (node.classStartIndex !== undefined) return "root";
  if (node.isKeystone) return "keystone";
  if (node.isMastery) return "mastery";
  if (node.isJewelSocket) return "jewel";
  if (node.isNotable) return "notable";
  return "normal";
}

function isOnMainTree(node) {
  return !(
    node.ascendancyName ||
    node.isBloodline ||
    node.isProxy ||
    node.expansionJewel ||
    node.isBlighted ||
    proxyGroups.has(node.group)
  );
}

const starts = {};
const out = [];
const known = new Set();
for (const [id, node] of Object.entries(source.nodes)) {
  if (id === "root" || !isOnMainTree(node)) continue;
  const at = positionOf(source, node);
  if (!at) continue;
  const kind = kindOf(node);
  const className = kind === "root" ? source.classes[node.classStartIndex]?.name : undefined;
  if (className) starts[className] = Number(id);
  const entry = { id: Number(id), kind, name: className ?? node.name, ...at };

  // Masteries show their own icon while unallocated and another once chosen.
  const icon = iconKey(node.isMastery ? node.inactiveIcon : node.icon);
  if (icon) entry.icon = icon;
  const activeIcon = node.isMastery ? iconKey(node.activeIcon) : undefined;
  if (activeIcon) entry.activeIcon = activeIcon;

  const stats = (node.stats ?? []).map(cleanText);
  if (stats.length) entry.stats = stats;
  if (node.masteryEffects?.length) {
    entry.choices = node.masteryEffects.map((effect) => effect.stats.map(cleanText).join(" "));
    entry.effects = node.masteryEffects.map((effect) => effect.effect);
  }
  out.push(entry);
  known.add(id);
}

if (Object.keys(starts).length !== source.classes.length) throw new Error("A class has no start node.");

const edges = edgesOf(source, known);
const tree = {
  version: lock.tag,
  starts,
  bounds: boundsOf(out),
  regions: [],
  nodes: out.sort((a, b) => a.id - b.id),
  edges,
};

const target = join(dataDir, "passiveTree.json");
await writeTree(target, tree);
console.log(`Passive tree ${lock.tag}: ${out.length} nodes, ${edges.length} edges -> ${target}`);
