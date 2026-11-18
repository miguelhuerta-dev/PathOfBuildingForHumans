/**
 * Which item each of a guide's gem groups goes in. In order of trust:
 *  1. the slot the guide assigns in Path of Building;
 *  2. a piece named in the group's label ("6L Chest", "Boots: Flame Dash", "Shield Mobility");
 *  3. the links it needs ("6L" in the label, or its gem count): 5–6 links need a
 *     body armour or two-handed weapon, 4 fit a helmet, gloves or boots, 3 or
 *     fewer a weapon or shield. Largest groups first, never two in one item.
 */

export interface SlotGroup {
  slot?: string;
  label?: string;
  gemCount: number;
}

export interface SlotChoice {
  slot?: string;
  /** "guide": assigned by the guide; "label": named in its label; "links": worked out from its links. */
  source?: "guide" | "label" | "links";
  /** Links the group asks for. */
  links: number;
}

/** Words guides use for each piece; checked in order, so "two hand" wins over "hand". */
const LABEL_HINTS: [RegExp, string][] = [
  [/\b(chest|body|armou?r|6l|5l)\b/i, "Body Armour"],
  [/\b(helm|helmet|head)\b/i, "Helmet"],
  [/\b(gloves?|hands?)\b/i, "Gloves"],
  [/\b(boots?|feet)\b/i, "Boots"],
  [/\b(shield|off[- ]?hand|quiver)\b/i, "Weapon 2"],
  [/\b(weapon|wand|staff|sceptre|scepter|bow|sword|axe|mace|dagger|claw|main[- ]?hand)\b/i, "Weapon 1"],
];

/** "6L Summon Raging Spirits" asks for six links even if the stage lists fewer gems. */
function linksAskedFor(group: SlotGroup): number {
  const fromLabel = Number(/\b([1-6])\s*-?\s*l(?:ink)?\b/i.exec(group.label ?? "")?.[1]);
  return Math.min(6, Math.max(group.gemCount, Number.isFinite(fromLabel) ? fromLabel : 0, 1));
}

const SLOTS_FOR_LINKS: Record<number, string[]> = {
  6: ["Body Armour", "Weapon 1"],
  5: ["Body Armour", "Weapon 1"],
  4: ["Helmet", "Gloves", "Boots", "Body Armour", "Weapon 1"],
  3: ["Weapon 1", "Weapon 2", "Helmet", "Gloves", "Boots", "Body Armour"],
  2: ["Weapon 2", "Weapon 1", "Gloves", "Boots", "Helmet", "Body Armour"],
  1: ["Weapon 2", "Weapon 1", "Boots", "Gloves", "Helmet", "Body Armour"],
};

export function chooseSlots(groups: SlotGroup[]): SlotChoice[] {
  const choices: SlotChoice[] = groups.map((group) => ({
    links: linksAskedFor(group),
    ...(group.slot ? { slot: group.slot, source: "guide" as const } : {}),
  }));
  const taken = new Set(choices.flatMap((choice) => (choice.slot ? [choice.slot] : [])));

  // Pieces named in labels, before anything is worked out from links.
  groups.forEach((group, index) => {
    if (choices[index].slot) return;
    const named = LABEL_HINTS.find(([pattern]) => pattern.test(group.label ?? ""))?.[1];
    // "6L" names a body armour only through its link count; a body armour already taken is left to the links step.
    if (named && !taken.has(named)) {
      taken.add(named);
      choices[index] = { ...choices[index], slot: named, source: "label" };
    }
  });

  const order = choices
    .map((choice, index) => ({ index, links: choice.links }))
    .filter(({ index }) => !choices[index].slot)
    .sort((a, b) => b.links - a.links);
  for (const { index, links } of order) {
    const slot = SLOTS_FOR_LINKS[links].find((candidate) => !taken.has(candidate));
    if (slot) {
      taken.add(slot);
      choices[index] = { ...choices[index], slot, source: "links" };
    }
  }
  return choices;
}
