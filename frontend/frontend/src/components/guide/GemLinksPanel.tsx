import type { CSSProperties } from "react";
import { useGemSources, type GemDetails } from "../../state/useGemSources";
import type { EngineBuild, EngineGem, EngineItem, EngineSkillGroup } from "../../types/Engine";
import { rarityStyle } from "../../utils/rarity";
import ItemIcon from "../ItemIcon";
import AtlasFrame from "../AtlasFrame";
import AtlasSectionHeader from "../AtlasSectionHeader";
import { SigilIcon } from "../icons";

/**
 * The guide's gem links for the chosen stage, drawn as linked sockets in black
 * iron: each gem's own icon, a rim in its attribute's colour, and for gems the
 * character still lacks, where the campaign hands them out.
 */

/** Socket rim colour by the gem's main attribute, as in the game. */
const ATTRIBUTE_RIM: Record<string, string> = {
  strength: "196 64 52",
  dexterity: "84 168 92",
  intelligence: "82 128 214",
};
const NEUTRAL_RIM = "190 182 170";

/** "6L Summon Raging Spirits" stays; guide separators ("=====", "PLACEHOLDER") are not real groups. */
function isRealGroup(group: EngineSkillGroup): boolean {
  return group.gems.length > 0 && /[a-z]/i.test(group.label ?? "a");
}

function sourceText(details: GemDetails | null): string {
  if (!details) return "";
  const source = details.source;
  if (!source) return "Not handed out in the campaign: a drop or a trade.";
  return source.kind === "quest"
    ? `Act ${source.act} · reward for ${source.quest} (${source.npc})`
    : `Act ${source.act} · sold by ${source.npc} after ${source.quest}`;
}

function GemSocket({ gem, details, owned }: { gem: EngineGem; details: GemDetails | null; owned?: boolean }) {
  const rim = (details && ATTRIBUTE_RIM[details.attribute]) || NEUTRAL_RIM;
  const missing = owned === false;
  return (
    <span
      className={`gem-socket ${missing ? "gem-socket--missing" : ""} ${gem.enabled ? "" : "opacity-50"}`}
      style={{ "--rim": rim } as CSSProperties}
      title={gem.name}
    >
      {gem.icon ? (
        <img src={gem.icon} alt="" loading="lazy" referrerPolicy="no-referrer" className="h-[78%] w-[78%] object-contain" />
      ) : (
        <span className="h-3 w-3 rounded-full bg-[rgb(var(--rim))]" aria-hidden="true" />
      )}
      {owned && (
        <span className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-gold text-[10px] font-bold text-ink" aria-label="You have it">
          ✓
        </span>
      )}
    </span>
  );
}

/** Slots that can hold that many linked sockets, most likely first. */
const SLOTS_FOR_LINKS: Record<number, string[]> = {
  6: ["Body Armour", "Weapon 1"],
  5: ["Body Armour", "Weapon 1"],
  4: ["Helmet", "Gloves", "Boots", "Body Armour", "Weapon 1"],
  3: ["Weapon 1", "Weapon 2", "Helmet", "Gloves", "Boots", "Body Armour"],
  2: ["Weapon 2", "Weapon 1", "Gloves", "Boots", "Helmet", "Body Armour"],
  1: ["Weapon 2", "Weapon 1", "Boots", "Gloves", "Helmet", "Body Armour"],
};

/**
 * The slot each group goes in. Groups the guide places keep their slot; the
 * others get one by how many links they need (a 6-link needs a body armour or a
 * two-handed weapon, a 4-link fits a helmet, gloves or boots), largest first and
 * never two groups in one item.
 */
function inferSlots(groups: EngineSkillGroup[]): (string | undefined)[] {
  const taken = new Set(groups.flatMap((group) => (group.slot ? [group.slot] : [])));
  const slots: (string | undefined)[] = groups.map((group) => group.slot);
  const order = groups
    .map((group, index) => ({ index, links: Math.min(6, group.gems.length) }))
    .filter(({ index }) => !groups[index].slot)
    .sort((a, b) => b.links - a.links);
  for (const { index, links } of order) {
    const slot = (SLOTS_FOR_LINKS[links] ?? SLOTS_FOR_LINKS[1]).find((candidate) => !taken.has(candidate));
    if (slot) {
      taken.add(slot);
      slots[index] = slot;
    }
  }
  return slots;
}

/**
 * The linked sockets a group needs, laid out as on an item: one column up to
 * three, then two columns in a zigzag, each socket in its gem's colour.
 */
function LinkedSockets({ rims }: { rims: string[] }) {
  const twoColumns = rims.length > 3;
  const at = (index: number) => {
    if (!twoColumns) return { x: 50, y: 18 + index * 32 };
    const row = Math.floor(index / 2);
    const left = row % 2 === 0 ? index % 2 === 0 : index % 2 === 1;
    return { x: left ? 32 : 68, y: 18 + row * 32 };
  };
  const height = (twoColumns ? Math.ceil(rims.length / 2) : rims.length) * 32 + 4;
  return (
    <svg viewBox={`0 0 100 ${height}`} className="h-[86%] w-[86%]" aria-hidden="true">
      {rims.slice(1).map((_, index) => {
        const a = at(index);
        const b = at(index + 1);
        return <line key={index} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#6e665f" strokeWidth={6} strokeLinecap="round" />;
      })}
      {rims.map((rim, index) => {
        const { x, y } = at(index);
        return <circle key={index} cx={x} cy={y} r={11} fill="#0b0909" stroke={`rgb(${rim})`} strokeWidth={4} />;
      })}
    </svg>
  );
}

/**
 * Where the group is socketed: the guide's item, with its art and kind; or, when
 * the guide names no item (levelling links), the linked sockets it calls for.
 */
function SocketItem({
  slot,
  item,
  rims,
  suggested,
}: {
  slot?: string;
  item?: EngineItem;
  rims: string[];
  /** The slot was worked out from the links: any item of that kind will do, the art only shows the kind. */
  suggested?: boolean;
}) {
  const rarity = rarityStyle(suggested ? undefined : item?.rarity);
  const links = `${rims.length}-link`;
  const label = slot ? (suggested ? `${slot} · ${links}` : slot) : `Any item · ${links}`;
  const title = suggested ? `Any ${slot?.replace(/ d$/, "").toLowerCase()} with ${rims.length} linked sockets` : item ? `${slot}: ${item.name}` : label;
  return (
    <span className="flex w-20 shrink-0 flex-col items-center gap-1" title={title}>
      <span
        className={`iron-slot ${item ? "iron-slot--filled" : ""} h-20 w-16`}
        style={{ "--rarity": rarity.rgb } as CSSProperties}
      >
        {item ? (
          <>
            <ItemIcon src={item.icon} className={`absolute inset-[8%] h-[84%] w-[84%] object-contain ${suggested ? "opacity-70" : ""}`} />
            {/* The sockets it must have, over the art, as on an item in the game. */}
            {suggested && (
              <span className="absolute inset-x-[18%] bottom-[6%] top-[6%] grid place-items-center">
                <LinkedSockets rims={rims} />
              </span>
            )}
          </>
        ) : (
          <LinkedSockets rims={rims} />
        )}
      </span>
      <span className="text-center font-display text-[10px] leading-tight tracking-[0.12em] text-parchment-faint">
        {label.toUpperCase()}
      </span>
    </span>
  );
}

function GroupCard({
  group,
  slot,
  item,
  ownedGems,
  details,
}: {
  group: EngineSkillGroup;
  /** The group's slot: the guide's, or one worked out from its links. */
  slot?: string;
  /** The guide's item in that slot, when it has one. */
  item?: EngineItem;
  ownedGems?: Set<string>;
  details: (name: string) => GemDetails | null;
}) {
  const owns = (gem: EngineGem) => (ownedGems ? ownedGems.has(gem.name) : undefined);
  const missing = ownedGems ? group.gems.filter((gem) => !ownedGems.has(gem.name)) : [];
  return (
    <li className={`iron-card flex gap-4 px-4 py-3 ${group.main ? "iron-card--main" : ""}`}>
      <div className="min-w-0 flex-1">
      <p className="font-display text-[12px] tracking-[0.18em] text-parchment-faint">
        {(group.slot ?? (slot ? `${slot} (suggested)` : "Socketed")).toUpperCase()}
        {group.main && <span className="text-gold"> · MAIN SKILL</span>}
      </p>
      {group.label && <p className="mt-0.5 truncate text-[17px] text-parchment">{group.label}</p>}
      {item && group.slot && <p className={`truncate text-[14px] ${rarityStyle(item.rarity).tone}`}>{item.name}</p>}

      {/* The sockets, joined by iron links like a socketed item's. */}
      <div className="mt-3 flex flex-wrap items-center gap-y-3">
        {group.gems.map((gem, index) => (
          <span key={`${gem.name}-${index}`} className="flex items-center">
            {index > 0 && <span className="gem-link" aria-hidden="true" />}
            <GemSocket gem={gem} details={details(gem.name)} owned={owns(gem)} />
          </span>
        ))}
      </div>

      <ul className="mt-3 flex flex-col gap-1 text-[15px] leading-snug">
        {group.gems.map((gem, index) => {
          const isMissing = ownedGems ? !ownedGems.has(gem.name) : false;
          return (
            <li key={`${gem.name}-${index}`} className="flex flex-wrap gap-x-2">
              <span className={isMissing ? "text-ember" : "text-parchment"}>{gem.name}</span>
              {gem.level !== undefined && gem.level > 1 && (
                <span className="text-parchment-faint">lvl {gem.level}</span>
              )}
              {isMissing && <span className="text-parchment-dim">— {sourceText(details(gem.name))}</span>}
            </li>
          );
        })}
      </ul>
      {ownedGems && missing.length === 0 && (
        <p className="mt-2 font-display text-[12px] tracking-[0.16em] text-verdigris">ALL GEMS OWNED</p>
      )}
      </div>
      {/* Its own column on the right, so the gems sit right under the title. */}
      <SocketItem
        slot={slot}
        item={item}
        suggested={!group.slot && slot !== undefined}
        rims={group.gems.map((gem) => ATTRIBUTE_RIM[details(gem.name)?.attribute ?? ""] ?? NEUTRAL_RIM)}
      />
    </li>
  );
}

/** Gem links of the guide at the chosen stage; with a character, what is missing and where to find it. */
function GemLinksPanel({ guide, you }: { guide: EngineBuild; you?: EngineBuild }) {
  const details = useGemSources(you?.character.class ?? guide.character.class);
  const groups = guide.skills.filter(isRealGroup);
  if (groups.length === 0) return null;
  const slots = inferSlots(groups);
  const ownedGems = you ? new Set(you.skills.flatMap((group) => group.gems.map((gem) => gem.name))) : undefined;

  return (
    <AtlasFrame>
      <AtlasSectionHeader title="Gem Links" icon={<SigilIcon className="h-7 w-7" />} />
      <p className="mb-4 text-[16px] text-parchment-dim">
        {ownedGems
          ? "Gems you already have carry a gold mark; for the rest, where your class gets them in the campaign."
          : "The links this stage asks for. Connect your character to see which ones you still need."}
      </p>
      <ul className="grid gap-4 md:grid-cols-2">
        {groups.map((group, index) => (
          <GroupCard
            key={`${group.label}-${index}`}
            group={group}
            slot={slots[index]}
            item={slots[index] ? guide.items.find((item) => item.slot === slots[index]) : undefined}
            ownedGems={ownedGems}
            details={details}
          />
        ))}
      </ul>
    </AtlasFrame>
  );
}

export default GemLinksPanel;
