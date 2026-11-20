import { useT, type Translate } from "../../i18n";
import type { CSSProperties } from "react";
import { chooseSlots, type SlotChoice } from "../../guide/gemSlots";
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

function sourceText(details: GemDetails | null, t: Translate): string {
  if (!details) return "";
  const source = details.source;
  if (!source) return t("Not handed out in the campaign: a drop or a trade.");
  return source.kind === "quest"
    ? t("Act {act} · reward for {quest} ({npc})", { act: source.act, quest: source.quest, npc: source.npc })
    : t("Act {act} · sold by {npc} after {quest}", { act: source.act, quest: source.quest, npc: source.npc });
}

function GemSocket({ gem, details, owned }: { gem: EngineGem; details: GemDetails | null; owned?: boolean }) {
  const t = useT();
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
        <span className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-gold text-[10px] font-bold text-ink" aria-label={t("You have it")}>
          ✓
        </span>
      )}
    </span>
  );
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
  const t = useT();
  const rarity = rarityStyle(suggested ? undefined : item?.rarity);
  const links = t("{count}-link", { count: rims.length });
  const slotName = slot ? t(slot) : undefined;
  const label = slotName ? (suggested ? `${slotName} · ${links}` : slotName) : t("Any item · {links}", { links });
  const title = suggested
    ? t("Any {slot} with {count} linked sockets", { slot: slotName?.toLowerCase(), count: rims.length })
    : item
      ? `${slotName}: ${item.name}`
      : label;
  return (
    <span className="flex w-20 shrink-0 flex-col items-center gap-1" title={title}>
      <span
        className={`iron-slot ${item ? "iron-slot--filled" : ""} h-20 w-16`}
        style={{ "--rarity": rarity.rgb } as CSSProperties}
      >
        {item ? (
          <>
            <ItemIcon src={item.icon} base={item.base} className={`absolute inset-[8%] h-[84%] w-[84%] object-contain ${suggested ? "opacity-70" : ""}`} />
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
  choice,
  item,
  ownedGems,
  details,
}: {
  group: EngineSkillGroup;
  /** Where the group goes: the guide's slot, a piece its label names, or one worked out from its links. */
  choice: SlotChoice;
  /** The guide's item in that slot, when it has one. */
  item?: EngineItem;
  ownedGems?: Set<string>;
  details: (name: string) => GemDetails | null;
}) {
  const t = useT();
  const owns = (gem: EngineGem) => (ownedGems ? ownedGems.has(gem.name) : undefined);
  const missing = ownedGems ? group.gems.filter((gem) => !ownedGems.has(gem.name)) : [];
  return (
    <li className={`iron-card flex gap-4 px-4 py-3 ${group.main ? "iron-card--main" : ""}`}>
      <div className="min-w-0 flex-1">
      <p className="font-display text-[12px] tracking-[0.18em] text-parchment-faint">
        {(choice.slot ? (choice.source === "links" ? t("{slot} (suggested)", { slot: t(choice.slot) }) : t(choice.slot)) : t("Socketed")).toUpperCase()}
        {group.main && <span className="text-gold"> · {t("MAIN SKILL")}</span>}
      </p>
      {group.label && <p className="mt-0.5 truncate text-[17px] text-parchment">{group.label}</p>}
      {item && choice.source !== "links" && <p className={`truncate text-[14px] ${rarityStyle(item.rarity).tone}`}>{item.name}</p>}

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
                <span className="text-parchment-faint">{t("lvl {level}", { level: gem.level })}</span>
              )}
              {isMissing && <span className="text-parchment-dim">— {sourceText(details(gem.name), t)}</span>}
            </li>
          );
        })}
      </ul>
      {ownedGems && missing.length === 0 && (
        <p className="mt-2 font-display text-[12px] tracking-[0.16em] text-verdigris">{t("ALL GEMS OWNED")}</p>
      )}
      </div>
      {/* Its own column on the right, so the gems sit right under the title. */}
      <SocketItem
        slot={choice.slot}
        item={item}
        suggested={choice.source === "links"}
        rims={Array.from({ length: choice.links }, (_, index) => {
          // Sockets beyond the gems the stage lists ("6L" with four gems) stay plain iron.
          const gem = group.gems[index];
          return gem ? (ATTRIBUTE_RIM[details(gem.name)?.attribute ?? ""] ?? NEUTRAL_RIM) : NEUTRAL_RIM;
        })}
      />
    </li>
  );
}

/** Gem links of the guide at the chosen stage; with a character, what is missing and where to find it. */
function GemLinksPanel({ guide, you }: { guide: EngineBuild; you?: EngineBuild }) {
  const t = useT();
  const details = useGemSources(you?.character.class ?? guide.character.class);
  const groups = guide.skills.filter(isRealGroup);
  if (groups.length === 0) return null;
  const choices = chooseSlots(groups.map((group) => ({ slot: group.slot, label: group.label, gemCount: group.gems.length })));
  const ownedGems = you ? new Set(you.skills.flatMap((group) => group.gems.map((gem) => gem.name))) : undefined;

  return (
    <AtlasFrame>
      <AtlasSectionHeader title="Gem Links" icon={<SigilIcon className="h-7 w-7" />} />
      <p className="mb-4 text-[16px] text-parchment-dim">
        {ownedGems
          ? t("Gems you already have carry a gold mark; for the rest, where your class gets them in the campaign.")
          : t("The links this stage asks for. Connect your character to see which ones you still need.")}
      </p>
      <ul className="grid gap-4 md:grid-cols-2">
        {groups.map((group, index) => (
          <GroupCard
            key={`${group.label}-${index}`}
            group={group}
            choice={choices[index]}
            item={choices[index].slot ? guide.items.find((item) => item.slot === choices[index].slot) : undefined}
            ownedGems={ownedGems}
            details={details}
          />
        ))}
      </ul>
    </AtlasFrame>
  );
}

export default GemLinksPanel;
