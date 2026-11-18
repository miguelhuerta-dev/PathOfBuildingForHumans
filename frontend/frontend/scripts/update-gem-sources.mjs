#!/usr/bin/env node
// Builds src/data/gems/gemSources.json: where each gem can be had during the
// campaign (quest rewards and vendors, per class), from exile-leveling's export
// of the game data (MIT), pinned in src/data/gems/gems.lock.json.
//
// Usage: node scripts/update-gem-sources.mjs [path/to/exile-leveling/common/data/json]

import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = join(root, "src/data/gems");
const lock = JSON.parse(await readFile(join(dataDir, "gems.lock.json"), "utf8"));

async function load(file) {
  const local = process.argv[2];
  if (local) return JSON.parse(await readFile(join(local, file), "utf8"));
  const raw = lock.repository.replace("https://github.com/", "https://raw.githubusercontent.com/");
  const url = `${raw}/${lock.commit}/common/data/json/${file}`;
  const response = await fetch(url, { headers: { "User-Agent": "PathOfBuildingForHumans (gem data update)" } });
  if (!response.ok) throw new Error(`${url} answered ${response.status}`);
  return response.json();
}

const [quests, gems] = await Promise.all([load("quests.json"), load("gems.json")]);

const out = {};
for (const gem of Object.values(gems)) {
  // Event-only copies ("…Royale") share a name with the real gem.
  if (gem.id.includes("Royale")) continue;
  out[gem.name] ??= { attribute: gem.primary_attribute, level: gem.required_level, support: gem.is_support, offers: [] };
}

const byId = new Map(Object.values(gems).map((gem) => [gem.id, gem.name]));
for (const quest of Object.values(quests)) {
  for (const offer of Object.values(quest.reward_offers ?? {})) {
    for (const [kind, list] of [["quest", offer.quest ?? {}], ["vendor", offer.vendor ?? {}]]) {
      for (const [id, entry] of Object.entries(list)) {
        const name = byId.get(id);
        if (!name || !out[name]) continue;
        out[name].offers.push({
          kind,
          act: Number(quest.act),
          quest: quest.name,
          npc: kind === "quest" ? offer.quest_npc : entry.npc,
          classes: entry.classes,
        });
      }
    }
  }
}

for (const entry of Object.values(out)) entry.offers.sort((a, b) => a.act - b.act || (a.kind === "quest" ? -1 : 1));

const target = join(dataDir, "gemSources.json");
await writeFile(target, JSON.stringify({ commit: lock.commit, gems: out }) + "\n");
const withOffers = Object.values(out).filter((g) => g.offers.length).length;
console.log(`Gem sources: ${Object.keys(out).length} gems, ${withOffers} with campaign rewards -> ${target}`);
