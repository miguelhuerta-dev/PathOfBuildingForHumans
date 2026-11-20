import type { ItemMod } from "../types/Engine";

/**
 * Leagues and mechanics, each with the Atlas passive icon the game itself uses
 * for that mechanic. The icons are read from the player's own installation,
 * like every other game picture; leagues the Atlas has no icon for show a
 * plate with their name.
 */
const ATLAS_ICON: Record<string, string> = {
  Abyss: "AtlasTrees/AbyssNode1",
  Bestiary: "AtlasTrees/BestiaryNode1",
  Blight: "AtlasTrees/BlightNode1",
  Breach: "AtlasTrees/NewBreachNode",
  Conquerors: "AtlasTrees/ConquerorNode1",
  Delirium: "AtlasTrees/DeliriumNode1",
  Eldritch: "EldritchGazeKeystone",
  Essence: "AtlasTrees/EssenceNode2",
  Expedition: "AtlasTrees/ExpeditionNode1",
  Harvest: "AtlasTrees/HarvestNode",
  Legion: "AtlasTrees/LegionNode1",
  Maven: "AtlasTrees/TheMavenNode",
  Ritual: "AtlasTrees/RitualNode1",
  "Settlers of Kalguur": "AtlasTrees/KalguurNode",
  "Shaper and Elder": "AtlasTrees/ElderShaperNode1",
  Synthesis: "AtlasTrees/SynthesisNotable3",
  Torment: "AtlasTrees/TormentNode1",
  Ultimatum: "AtlasTrees/UltimatumNode1",
};

/** The Atlas icon key for a league or mechanic, when the game has one. */
export function leagueIcon(league: string): string | undefined {
  return ATLAS_ICON[league];
}

const CONQUERORS = new Set(["Crusader", "Redeemer", "Hunter", "Warlord"]);

/** The league or mechanic a modifier comes from, when it is not an ordinary roll. */
export function leagueOfMod(mod: ItemMod): string | undefined {
  switch (mod.source) {
    case "essence":
      return "Essence";
    case "fossil":
      return "Delve";
    case "veiled":
      return "Betrayal";
    case "synthesis":
      return "Synthesis";
    case "eldritch":
      return "Eldritch";
    case "influence":
      return mod.detail && CONQUERORS.has(mod.detail) ? "Conquerors" : "Shaper and Elder";
    default:
      return mod.kind === "scourge" ? "Scourge" : mod.kind === "crucible" ? "Crucible" : undefined;
  }
}

/** Every icon key the archive may show for leagues, read from the game in one go. */
export const LEAGUE_ICON_KEYS = Object.values(ATLAS_ICON);
