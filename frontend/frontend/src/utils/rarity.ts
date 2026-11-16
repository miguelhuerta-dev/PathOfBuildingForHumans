/** Display style for an item rarity, shared by every item view. */
export interface RarityStyle {
  label: string;
  /** Text colour class for the item name. */
  tone: string;
}

const STYLES: Record<string, RarityStyle> = {
  NORMAL: { label: "NORMAL ITEM", tone: "text-parchment" },
  MAGIC: { label: "MAGIC ITEM", tone: "text-[#8fa8ff]" },
  RARE: { label: "RARE ITEM", tone: "text-[#f2d27a]" },
  UNIQUE: { label: "UNIQUE ITEM", tone: "text-[#e08a3c]" },
  RELIC: { label: "RELIC ITEM", tone: "text-[#8fe0a0]" },
};

export function rarityStyle(rarity?: string): RarityStyle {
  return STYLES[(rarity ?? "RARE").toUpperCase()] ?? STYLES.RARE;
}
