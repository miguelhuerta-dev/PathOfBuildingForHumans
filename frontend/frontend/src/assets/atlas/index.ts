import starAtlas from "./bg-star-atlas.webp";
import portraitTemplar from "./portrait-templar.webp";
import portraitDuelist from "./portrait-duelist.webp";
import portraitMarauder from "./portrait-marauder.webp";
import portraitRanger from "./portrait-ranger.webp";
import portraitShadow from "./portrait-shadow.webp";
import portraitWitch from "./portrait-witch.webp";
import portraitScion from "./portrait-scion.webp";
import itemRareRing from "./item-rare-ring.webp";
import sceneCandles from "./scene-candles.webp";
import sceneBooks from "./scene-books.webp";
import sceneAstrolabe from "./scene-astrolabe.webp";
import sceneCoins from "./scene-coins.webp";
import sceneParchmentMap from "./scene-parchment-map.webp";
import scenePillar from "./scene-pillar.webp";
import frameItem from "./frame-item.webp";
import medallion from "./ui-medallion.webp";
import pendant from "./ui-pendant.webp";

export const atlasArt = {
  starAtlas,
  portraitInquisitor: portraitTemplar,
  itemRareRing,
  sceneCandles,
  sceneBooks,
  sceneAstrolabe,
  sceneCoins,
  sceneParchmentMap,
  scenePillar,
  frameItem,
  medallion,
  pendant,
};

const classPortraits: Record<string, string> = {
  Templar: portraitTemplar,
  Duelist: portraitDuelist,
  Marauder: portraitMarauder,
  Ranger: portraitRanger,
  Shadow: portraitShadow,
  Witch: portraitWitch,
  Scion: portraitScion,
};

/** Ascendancy (or alternate ascendancy) to its base class, for Path of Exile 1. */
const ascendancyClass: Record<string, string> = {
  Juggernaut: "Marauder", Berserker: "Marauder", Chieftain: "Marauder",
  Slayer: "Duelist", Gladiator: "Duelist", Champion: "Duelist",
  Deadeye: "Ranger", Raider: "Ranger", Pathfinder: "Ranger", Warden: "Ranger",
  Assassin: "Shadow", Saboteur: "Shadow", Trickster: "Shadow",
  Necromancer: "Witch", Occultist: "Witch", Elementalist: "Witch", Warlock: "Witch",
  Inquisitor: "Templar", Hierophant: "Templar", Guardian: "Templar",
  Ascendant: "Scion", Reliquarian: "Scion", Primalist: "Scion",
};

export function baseClassOf(name?: string): string {
  if (!name) return "Templar";
  return classPortraits[name] ? name : ascendancyClass[name] ?? "Templar";
}

/** Portrait for a class or ascendancy name. */
export function portraitFor(name?: string): string {
  return classPortraits[baseClassOf(name)];
}
