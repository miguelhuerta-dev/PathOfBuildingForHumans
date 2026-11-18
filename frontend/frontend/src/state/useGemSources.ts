import { useEffect, useState } from "react";

/** Shape of src/data/gems/gemSources.json (scripts/update-gem-sources.mjs). */
interface GemOffer {
  kind: "quest" | "vendor";
  act: number;
  quest: string;
  npc: string;
  classes: string[];
}

interface GemInfo {
  attribute: "strength" | "dexterity" | "intelligence" | "none" | string;
  level: number;
  support: boolean;
  offers: GemOffer[];
}

export interface GemSource {
  /** "quest": a reward of the quest; "vendor": sold by the NPC once the quest is done. */
  kind: GemOffer["kind"];
  act: number;
  quest: string;
  npc: string;
}

export interface GemDetails {
  attribute: GemInfo["attribute"];
  level: number;
  /** The earliest way this class gets the gem in the campaign; null when it is drop-only. */
  source: GemSource | null;
}

type GemTable = Record<string, GemInfo>;

let table: Promise<GemTable> | null = null;
const loadTable = () =>
  (table ??= import("../data/gems/gemSources.json").then((module) => (module.default as { gems: GemTable }).gems));

/** Path of Building names supports without "Support"; the game data names them with it. */
function infoFor(gems: GemTable, name: string): GemInfo | undefined {
  return gems[name] ?? gems[`${name} Support`];
}

function earliestFor(info: GemInfo, className: string | undefined): GemSource | null {
  // Offers are sorted by act, quest rewards first; any class can buy from Siosa and Lilly Roth.
  const offer = info.offers.find((entry) => !className || entry.classes.includes(className));
  return offer ? { kind: offer.kind, act: offer.act, quest: offer.quest, npc: offer.npc } : null;
}

/**
 * Where each gem is found during the campaign for a class, from the game's
 * quest rewards and vendor lists. Loads its table (~12 KB compressed) on first use.
 */
export function useGemSources(className: string | undefined) {
  const [gems, setGems] = useState<GemTable | null>(null);

  useEffect(() => {
    let active = true;
    loadTable().then(
      (loaded) => active && setGems(loaded),
      () => undefined,
    );
    return () => {
      active = false;
    };
  }, []);

  return (name: string): GemDetails | null => {
    const info = gems && infoFor(gems, name);
    if (!info) return null;
    return { attribute: info.attribute, level: info.level, source: earliestFor(info, className) };
  };
}
