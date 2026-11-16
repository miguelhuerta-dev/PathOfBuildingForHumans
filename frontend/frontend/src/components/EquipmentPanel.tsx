import type { EngineItem } from "../types/Engine";
import { rarityStyle } from "../utils/rarity";
import AtlasFrame from "./AtlasFrame";
import AtlasSectionHeader from "./AtlasSectionHeader";
import ItemIcon from "./ItemIcon";
import { SigilIcon } from "./icons";

const SLOT_ORDER = [
  "Weapon 1", "Weapon 2", "Helmet", "Body Armour", "Gloves", "Boots",
  "Amulet", "Ring 1", "Ring 2", "Ring 3", "Belt",
  "Flask 1", "Flask 2", "Flask 3", "Flask 4", "Flask 5",
];

function slotRank(slot: string) {
  const index = SLOT_ORDER.indexOf(slot);
  return index === -1 ? SLOT_ORDER.length : index;
}

/** The character's worn gear, with official icons when available. */
function EquipmentPanel({ items }: { items: EngineItem[] }) {
  const sorted = [...items].sort((a, b) => slotRank(a.slot) - slotRank(b.slot));
  if (sorted.length === 0) return null;

  return (
    <AtlasFrame>
      <AtlasSectionHeader title="Equipped Artifacts" icon={<SigilIcon className="h-7 w-7" />} />
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {sorted.map((item) => (
          <li key={item.slot} className="flex items-center gap-3 border border-gold-dim/25 bg-black/40 p-2">
            <span className="grid h-16 w-16 shrink-0 place-items-center border border-gold-dim/40 bg-[radial-gradient(circle_at_50%_40%,#2a2016,#0a0705_75%)] shadow-[inset_0_0_10px_#000]">
              <ItemIcon src={item.icon} className="h-14 w-14" />
            </span>
            <span className="min-w-0">
              <span className="block font-display text-[12px] tracking-[0.16em] text-parchment-dim">
                {item.slot.toUpperCase()}
              </span>
              <span className={`block truncate text-[17px] ${rarityStyle(item.rarity).tone}`}>{item.name}</span>
              {item.base && item.base !== item.name && (
                <span className="block truncate text-[14px] text-parchment-faint">{item.base}</span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </AtlasFrame>
  );
}

export default EquipmentPanel;
