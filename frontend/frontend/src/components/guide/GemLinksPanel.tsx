import type { CSSProperties } from "react";
import { useGemSources, type GemDetails } from "../../state/useGemSources";
import type { EngineBuild, EngineGem, EngineSkillGroup } from "../../types/Engine";
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

function GroupCard({
  group,
  ownedGems,
  details,
}: {
  group: EngineSkillGroup;
  ownedGems?: Set<string>;
  details: (name: string) => GemDetails | null;
}) {
  const owns = (gem: EngineGem) => (ownedGems ? ownedGems.has(gem.name) : undefined);
  const missing = ownedGems ? group.gems.filter((gem) => !ownedGems.has(gem.name)) : [];
  return (
    <li className={`iron-card px-4 py-3 ${group.main ? "iron-card--main" : ""}`}>
      <p className="font-display text-[12px] tracking-[0.18em] text-parchment-faint">
        {(group.slot ?? "Socketed").toUpperCase()}
        {group.main && <span className="text-gold"> · MAIN SKILL</span>}
      </p>
      {group.label && <p className="mt-0.5 truncate text-[17px] text-parchment">{group.label}</p>}

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
    </li>
  );
}

/** Gem links of the guide at the chosen stage; with a character, what is missing and where to find it. */
function GemLinksPanel({ guide, you }: { guide: EngineBuild; you?: EngineBuild }) {
  const details = useGemSources(you?.character.class ?? guide.character.class);
  const groups = guide.skills.filter(isRealGroup);
  if (groups.length === 0) return null;
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
          <GroupCard key={`${group.label}-${index}`} group={group} ownedGems={ownedGems} details={details} />
        ))}
      </ul>
    </AtlasFrame>
  );
}

export default GemLinksPanel;
