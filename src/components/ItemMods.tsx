import type { EngineItem, ItemMod, ItemModSource } from "../types/Engine";

/**
 * An item's modifiers as the game separates them: enchantments, implicits,
 * then the rolled affixes. Every line takes the colour of its kind (prefix,
 * suffix, crafted, fractured...), with its mark beside it, and modifiers that
 * do not roll normally say where they come from (essence, fossil, influence...).
 */

interface Kind {
  key: string;
  label: string;
  mark?: string;
  /** Text colour of the line. */
  tone: string;
  /** Border and letter colour of the mark. */
  markTone?: string;
}

const KINDS = {
  prefix: { key: "prefix", label: "Prefix", mark: "P", tone: "text-[#e9b49a]", markTone: "border-[#8a3a2a] text-[#e9b49a]" },
  suffix: { key: "suffix", label: "Suffix", mark: "S", tone: "text-[#9fd6c2]", markTone: "border-[#2f6a5a] text-[#9fd6c2]" },
  crafted: { key: "crafted", label: "Crafted", mark: "C", tone: "text-[#c7c2ff]", markTone: "border-[#5a52a0] text-[#c7c2ff]" },
  fractured: { key: "fractured", label: "Fractured", mark: "F", tone: "text-[#d6bc78]", markTone: "border-[#8a7440] text-[#d6bc78]" },
  enchant: { key: "enchant", label: "Enchant", tone: "text-[#b9dbef]" },
  implicit: { key: "implicit", label: "Implicit", tone: "text-[#9fb6d8]" },
  eldritch: { key: "eldritch", label: "Eldritch", tone: "text-[#e0925a]" },
  corrupted: { key: "corrupted", label: "Corrupted", tone: "text-[#e05a4a]" },
  unique: { key: "unique", label: "Unique", tone: "text-[#d8a35a]" },
  explicit: { key: "explicit", label: "Affix", tone: "text-[#a9b8e8]" },
  scourge: { key: "scourge", label: "Scourge", tone: "text-[#ff8a4c]" },
  crucible: { key: "crucible", label: "Crucible", tone: "text-[#f0b46a]" },
} satisfies Record<string, Kind>;

/** The one kind that colours a line: the most specific one wins. */
function kindOf(mod: ItemMod): Kind {
  if (mod.fractured) return KINDS.fractured;
  if (mod.kind === "crafted") return KINDS.crafted;
  if (mod.kind === "explicit" && mod.affix) return KINDS[mod.affix];
  return KINDS[mod.kind];
}

const SOURCE_LABEL: Record<ItemModSource, string> = {
  influence: "Influence",
  essence: "Essence",
  fossil: "Fossil",
  veiled: "Veiled",
  synthesis: "Synthesis",
  eldritch: "Eldritch",
  corruption: "Corruption",
  bench: "Bench",
};

function ModLine({ mod }: { mod: ItemMod }) {
  const kind = kindOf(mod);
  const special = mod.source && mod.source !== "bench" ? (mod.detail ?? SOURCE_LABEL[mod.source]) : null;
  return (
    <li className="flex items-start gap-2 text-left">
      {kind.mark ? (
        <abbr
          title={kind.label}
          className={`mt-[3px] grid h-4 w-4 shrink-0 place-items-center border font-display text-[9px] leading-none no-underline ${kind.markTone}`}
        >
          {kind.mark}
        </abbr>
      ) : (
        <span className="w-4 shrink-0" aria-hidden="true" />
      )}
      <span className={`min-w-0 flex-1 ${kind.tone}`}>{mod.text}</span>
      {special && (
        <span
          title={`Comes from: ${special}`}
          className="mt-[2px] shrink-0 border border-gold-dim/45 px-1.5 font-display text-[9px] leading-4 tracking-[0.12em] text-gold-dim"
        >
          {special.toUpperCase()}
        </span>
      )}
    </li>
  );
}

const Rule = () => <div className="mx-auto h-px w-2/3 bg-gradient-to-r from-transparent via-[#6b1d16] to-transparent" aria-hidden="true" />;

/** Older results carry only plain implicit and explicit lines. */
function modsOf(item: EngineItem): ItemMod[] {
  return (
    item.mods ?? [
      ...item.implicits.map((text) => ({ text, kind: "implicit" as const })),
      ...item.explicits.map((text) => ({ text, kind: "explicit" as const })),
    ]
  );
}

/** The modifier list, grouped as in the game's tooltip. */
export function ItemMods({ item }: { item: EngineItem }) {
  const mods = modsOf(item);
  if (mods.length === 0) return <p className="text-center text-parchment-faint">No modifiers.</p>;

  const groups = [
    mods.filter((mod) => mod.kind === "enchant"),
    mods.filter((mod) => mod.kind === "implicit" || mod.kind === "eldritch" || mod.kind === "corrupted" || mod.kind === "scourge"),
    mods.filter((mod) => mod.kind === "explicit" || mod.kind === "crafted" || mod.kind === "unique" || mod.kind === "crucible"),
  ].filter((group) => group.length > 0);

  return (
    <div className="flex flex-col gap-3">
      {groups.map((group, index) => (
        <div key={index} className="flex flex-col gap-3">
          {index > 0 && <Rule />}
          <ul className="flex flex-col gap-1">
            {group.map((mod, line) => (
              <ModLine key={line} mod={mod} />
            ))}
          </ul>
        </div>
      ))}
      {item.corrupted && <p className="text-center font-display text-[13px] tracking-[0.2em] text-[#e05a4a]">CORRUPTED</p>}
    </div>
  );
}

/** A key to the colours, down the side: only the kinds this item has. */
export function ModLegend({ mods }: { mods: ItemMod[] }) {
  const present = new Map<string, Kind>();
  for (const mod of mods) {
    const kind = kindOf(mod);
    present.set(kind.key, kind);
  }
  const order = Object.keys(KINDS);
  const kinds = [...present.values()].sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key));
  return (
    <aside aria-label="Colour key" className="flex w-24 shrink-0 flex-col gap-1.5 border-l border-[#3a2a26] pl-3">
      <p className="font-display text-[9px] tracking-[0.2em] text-parchment-faint">KEY</p>
      {kinds.map((kind) => (
        <p key={kind.key} className={`flex items-center gap-1.5 font-display text-[10px] tracking-[0.12em] ${kind.tone}`}>
          {kind.mark ? (
            <span className={`grid h-3.5 w-3.5 place-items-center border text-[8px] leading-none ${kind.markTone}`}>{kind.mark}</span>
          ) : (
            <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
          )}
          {kind.label.toUpperCase()}
        </p>
      ))}
    </aside>
  );
}
