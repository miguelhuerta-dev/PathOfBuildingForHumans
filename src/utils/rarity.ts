/** Display style for an item rarity, shared by every item view. */
export interface RarityStyle {
  label: string;
  /** Text colour class for the item name. */
  tone: string;
  /** The same colour as "r g b", for glows and borders (`rgb(var(--rarity) / 0.5)`). */
  rgb: string;
}

const STYLES: Record<string, RarityStyle> = {
  NORMAL: { label: "NORMAL ITEM", tone: "text-parchment", rgb: "200 190 170" },
  MAGIC: { label: "MAGIC ITEM", tone: "text-[#8fa8ff]", rgb: "143 168 255" },
  RARE: { label: "RARE ITEM", tone: "text-[#f2d27a]", rgb: "242 210 122" },
  UNIQUE: { label: "UNIQUE ITEM", tone: "text-[#e08a3c]", rgb: "224 138 60" },
  RELIC: { label: "RELIC ITEM", tone: "text-[#8fe0a0]", rgb: "143 224 160" },
};

export function rarityStyle(rarity?: string): RarityStyle {
  return STYLES[(rarity ?? "RARE").toUpperCase()] ?? STYLES.RARE;
}
