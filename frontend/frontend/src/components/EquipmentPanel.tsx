import { useState, type CSSProperties } from "react";
import type { EngineItem } from "../types/Engine";
import { atlasArt } from "../assets/atlas";
import { rarityStyle } from "../utils/rarity";
import AtlasFrame from "./AtlasFrame";
import AtlasSectionHeader from "./AtlasSectionHeader";
import ItemIcon from "./ItemIcon";
import { SkullIcon } from "./icons";

/**
 * The armoury: the character's gear laid out as on the in-game inventory
 * (weapons at the sides, armour down the middle, jewellery between), in black
 * iron with a blood-dark glow, and the item under the pointer read out in full.
 */

/** Place of each slot on an 8 × 6 grid of inventory cells: column, row, width, height. */
const DOLL: Record<string, [number, number, number, number]> = {
  "Weapon 1": [1, 1, 2, 4],
  Helmet: [4, 1, 2, 2],
  "Weapon 2": [7, 1, 2, 4],
  "Ring 3": [3, 2, 1, 1],
  Amulet: [6, 2, 1, 1],
  "Ring 1": [3, 3, 1, 1],
  "Body Armour": [4, 3, 2, 3],
  "Ring 2": [6, 3, 1, 1],
  Gloves: [2, 5, 2, 2],
  Belt: [4, 6, 2, 1],
  Boots: [6, 5, 2, 2],
};
/** Slots always drawn, even when empty, so the silhouette reads as an inventory. */
const CORE_SLOTS = Object.keys(DOLL).filter((slot) => slot !== "Ring 3");
const FLASKS = ["Flask 1", "Flask 2", "Flask 3", "Flask 4", "Flask 5"];

/** Passive tree sockets ("Jewel 26725") and abyssal sockets in gear ("Belt Abyssal Socket 1"). */
const isJewel = (slot: string) => slot.startsWith("Jewel") || slot.includes("Abyssal Socket");

/** Slot name for people: tree sockets are known by an internal node id, which means nothing to a player. */
function slotLabel(slot: string): string {
  if (slot.startsWith("Jewel")) return "Jewel";
  if (slot.includes("Abyssal Socket")) return `${slot.split(" Abyssal")[0]} abyss jewel`;
  return slot;
}

/** A chain of black iron links, the divider between the doll and the belt pouches. */
function IronChain() {
  return (
    <div
      aria-hidden="true"
      className="my-4 h-7 w-full bg-repeat-x [filter:saturate(0.15)_brightness(0.85)_drop-shadow(0_3px_3px_rgba(0,0,0,0.9))]"
      style={{ backgroundImage: `url(${atlasArt.chain})`, backgroundSize: "auto 100%", backgroundPosition: "center" }}
    />
  );
}

interface SlotProps {
  slot: string;
  item?: EngineItem;
  selected: boolean;
  onSelect: (slot: string) => void;
  style?: CSSProperties;
  className?: string;
}

function Slot({ slot, item, selected, onSelect, style, className = "" }: SlotProps) {
  if (!item) {
    return (
      <div className={`iron-slot iron-slot--empty ${className}`} style={style} aria-hidden="true">
        <span className="px-1 text-center font-display text-[10px] tracking-[0.12em] text-parchment-faint">
          {slot.toUpperCase()}
        </span>
      </div>
    );
  }
  const rarity = rarityStyle(item.rarity);
  return (
    <button
      type="button"
      title={`${slotLabel(slot)}: ${item.name}`}
      aria-pressed={selected}
      onMouseEnter={() => onSelect(slot)}
      onFocus={() => onSelect(slot)}
      onClick={() => onSelect(slot)}
      className={`iron-slot iron-slot--filled ${selected ? "border-[rgb(var(--rarity)/0.85)]" : ""} ${className}`}
      style={{ ...style, "--rarity": rarity.rgb } as CSSProperties}
    >
      <ItemIcon src={item.icon} className="h-[86%] w-[86%]" />
    </button>
  );
}

/** The selected item read out like the game's tooltip. */
function ItemDetails({ item }: { item?: EngineItem }) {
  if (!item) {
    return <p className="text-[17px] text-parchment-faint">Point at an item to read its properties.</p>;
  }
  const rarity = rarityStyle(item.rarity);
  return (
    <article className="iron-tooltip" style={{ "--rarity": rarity.rgb } as CSSProperties}>
      <header className="iron-tooltip__head px-5 py-3 text-center">
        <p className="font-display text-[12px] tracking-[0.2em] text-parchment-faint">{slotLabel(item.slot).toUpperCase()}</p>
        <h3 className={`font-display text-[20px] leading-tight ${rarity.tone}`}>{item.name}</h3>
        {item.base && item.base !== item.name && <p className={`text-[16px] ${rarity.tone} opacity-80`}>{item.base}</p>}
      </header>
      <div className="flex flex-col gap-3 px-5 py-4 text-center text-[15px] leading-snug">
        {item.implicits.length > 0 && (
          <ul className="text-[#9fb6d8]">
            {item.implicits.map((line, index) => (
              <li key={`i${index}`}>{line}</li>
            ))}
          </ul>
        )}
        {item.implicits.length > 0 && item.explicits.length > 0 && (
          <div className="mx-auto h-px w-2/3 bg-gradient-to-r from-transparent via-[#6b1d16] to-transparent" aria-hidden="true" />
        )}
        {item.explicits.length > 0 ? (
          <ul className="text-[#a9b8e8]">
            {item.explicits.map((line, index) => (
              <li key={`e${index}`}>{line}</li>
            ))}
          </ul>
        ) : (
          item.implicits.length === 0 && <p className="text-parchment-faint">No modifiers.</p>
        )}
      </div>
    </article>
  );
}

/** Every equipped item by slot, in its rarity colour; pointing at one reads it out. */
function GearLedger({ items, selected, onSelect }: { items: EngineItem[]; selected?: string; onSelect: (slot: string) => void }) {
  return (
    <ul className="mt-5 grid gap-x-6 sm:grid-cols-2">
      {items.map((item) => (
        <li key={item.slot}>
          <button
            type="button"
            onMouseEnter={() => onSelect(item.slot)}
            onFocus={() => onSelect(item.slot)}
            onClick={() => onSelect(item.slot)}
            className={`flex w-full items-baseline gap-3 border-b border-[#2a201c] py-1.5 text-left transition hover:border-[#6b1d16] ${
              selected === item.slot ? "border-[#7a2219]" : ""
            }`}
          >
            <span className="w-28 shrink-0 font-display text-[11px] tracking-[0.14em] text-parchment-faint">
              {slotLabel(item.slot).toUpperCase()}
            </span>
            <span className={`min-w-0 truncate text-[16px] ${rarityStyle(item.rarity).tone}`}>{item.name}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

const SLOT_ORDER = [...Object.keys(DOLL), ...FLASKS];
const slotRank = (slot: string) => {
  const index = SLOT_ORDER.indexOf(slot);
  return index === -1 ? SLOT_ORDER.length : index;
};

/** The character's worn gear, flasks and socketed jewels, with official icons when available. */
function EquipmentPanel({ items }: { items: EngineItem[] }) {
  const bySlot = new Map(items.map((item) => [item.slot, item]));
  const jewels = items.filter((item) => isJewel(item.slot));
  const firstFilled = [...CORE_SLOTS, ...FLASKS].find((slot) => bySlot.has(slot)) ?? jewels[0]?.slot;
  const [selected, setSelected] = useState<string | undefined>(firstFilled);
  if (items.length === 0) return null;

  const dollSlots = [...CORE_SLOTS, ...(bySlot.has("Ring 3") ? ["Ring 3"] : [])];
  const current = (selected && bySlot.get(selected)) || (firstFilled ? bySlot.get(firstFilled) : undefined);

  return (
    <AtlasFrame variant="iron">
      <AtlasSectionHeader title="Equipped Artifacts" tone="blood" icon={<SkullIcon className="h-7 w-7" />} />
      <div className="grid items-start gap-8 lg:grid-cols-[auto_minmax(0,1fr)]">
        <div className="mx-auto w-fit [--cell:44px] sm:[--cell:54px]">
          <div
            className="grid gap-1.5"
            style={{ gridTemplateColumns: "repeat(8, var(--cell))", gridTemplateRows: "repeat(6, var(--cell))" }}
          >
            {dollSlots.map((slot) => {
              const [column, row, width, height] = DOLL[slot];
              return (
                <Slot
                  key={slot}
                  slot={slot}
                  item={bySlot.get(slot)}
                  selected={current?.slot === slot}
                  onSelect={setSelected}
                  style={{ gridColumn: `${column} / span ${width}`, gridRow: `${row} / span ${height}` }}
                />
              );
            })}
          </div>

          <IronChain />

          <div className="flex justify-center gap-1.5">
            {FLASKS.map((slot) => (
              <Slot
                key={slot}
                slot={slot}
                item={bySlot.get(slot)}
                selected={current?.slot === slot}
                onSelect={setSelected}
                className="h-[calc(var(--cell)*2)] w-[var(--cell)]"
              />
            ))}
          </div>

          {jewels.length > 0 && (
            <>
              <h3 className="mt-5 text-center font-display text-[12px] tracking-[0.2em] text-parchment-faint">
                SOCKETED JEWELS
              </h3>
              <div className="mt-2 flex max-w-[calc(var(--cell)*8+42px)] flex-wrap justify-center gap-1.5">
                {jewels.map((item) => (
                  <Slot
                    key={item.slot}
                    slot={item.slot}
                    item={item}
                    selected={current?.slot === item.slot}
                    onSelect={setSelected}
                    className="h-[var(--cell)] w-[var(--cell)]"
                  />
                ))}
              </div>
            </>
          )}
        </div>

        <div>
          <div aria-live="polite">
            <ItemDetails item={current} />
          </div>
          <GearLedger
            items={[...items].sort((a, b) => slotRank(a.slot) - slotRank(b.slot))}
            selected={current?.slot}
            onSelect={setSelected}
          />
        </div>
      </div>
    </AtlasFrame>
  );
}

export default EquipmentPanel;
