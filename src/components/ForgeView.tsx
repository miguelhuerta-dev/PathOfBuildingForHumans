import { useContext, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { desktop } from "../lib/desktop";
import { CurrentLeague } from "../state/currentLeague";
import type { EngineItem, ForgePoolGroup, ForgeResult, MarketPrice } from "../types/Engine";
import { rarityStyle } from "../utils/rarity";
import AtlasFrame from "./AtlasFrame";
import AtlasSectionHeader from "./AtlasSectionHeader";
import { ItemMods, ModLegend } from "./ItemMods";
import LeagueBadge from "./LeagueBadge";
import { AtlasStarIcon } from "./icons";

/**
 * The Forge: an item opened in full, inside the archive. For a unique, the
 * league it came from and where it drops; for a crafted item, the tier of each
 * modifier, its free prefixes and suffixes, everything else its base can roll at
 * its item level, and the essences and bench crafts that apply to it.
 */

const AFFIX_TONE = { prefix: "text-[#e9b49a]", suffix: "text-[#9fd6c2]" } as const;

/** Filled and empty pips for the affixes an item has and can still take. */
function Slots({ label, used, max, tone }: { label: string; used: number; max: number; tone: string }) {
  const free = Math.max(0, max - used);
  return (
    <div className="flex items-center gap-3">
      <span className={`w-20 font-display text-[12px] tracking-[0.18em] ${tone}`}>{label.toUpperCase()}</span>
      <span className="flex gap-1.5" aria-label={`${used} of ${max} used`}>
        {Array.from({ length: max }, (_, index) => (
          <span key={index} className={`forge-pip ${index < used ? "forge-pip--used" : ""}`} />
        ))}
      </span>
      <span className="text-[14px] text-parchment-dim">{free > 0 ? `${free} free` : "full"}</span>
    </div>
  );
}

/** "+3.2% DPS" in ember, "+1.1% EHP" in verdigris; nothing when it changes nothing measurable. */
function Impact({ group, large = false }: { group: ForgePoolGroup; large?: boolean }) {
  const parts: { text: string; tone: string }[] = [];
  if (group.dps !== undefined && Math.abs(group.dps) >= 0.1) parts.push({ text: `${group.dps > 0 ? "+" : "−"}${Math.abs(group.dps)}% DPS`, tone: group.dps > 0 ? "text-ember" : "text-[#c9645a]" });
  if (group.ehp !== undefined && Math.abs(group.ehp) >= 0.1) parts.push({ text: `${group.ehp > 0 ? "+" : "−"}${Math.abs(group.ehp)}% EHP`, tone: group.ehp > 0 ? "text-verdigris" : "text-[#c9645a]" });
  if (parts.length === 0) return null;
  return (
    <span className={`flex shrink-0 gap-2 font-display ${large ? "text-[14px]" : "text-[11px]"} tracking-[0.06em]`}>
      {parts.map((part) => (
        <span key={part.text} className={part.tone}>
          {part.text}
        </span>
      ))}
    </span>
  );
}

/** How much a modifier helps the build: damage and survival, defence weighted a little higher. */
const impactScore = (group: ForgePoolGroup) => (group.dps ?? 0) + (group.ehp ?? 0) * 1.2;

/** The modifiers worth chasing on this item, best first, measured on the character. */
function BestForBuild({ forge, freePrefix, freeSuffix }: { forge: ForgeResult; freePrefix: number; freeSuffix: number }) {
  if (!forge.measured || !forge.pool) return null;
  const candidates = [
    ...forge.pool.prefix.map((group) => ({ group, affix: "prefix" as const, free: freePrefix })),
    ...forge.pool.suffix.map((group) => ({ group, affix: "suffix" as const, free: freeSuffix })),
  ]
    .filter(({ group }) => !group.owned && impactScore(group) > 0.2)
    .sort((a, b) => impactScore(b.group) - impactScore(a.group))
    .slice(0, 5);
  return (
    <section className="iron-card px-5 py-4">
      <h4 className="mb-1 font-display text-[13px] tracking-[0.2em] text-gold">BEST FOR YOUR BUILD</h4>
      <p className="mb-3 text-[13px] leading-snug text-parchment-faint">
        Each modifier tried on this item, on your character, by Path of Building: the best tier this item can roll, at a middle roll.
      </p>
      {candidates.length === 0 ? (
        <p className="text-[15px] text-parchment-dim">No modifier this base can roll would change your damage or defences much.</p>
      ) : (
        <ol className="flex flex-col gap-2">
          {candidates.map(({ group, affix, free }, index) => (
            <li key={index} className="flex items-start gap-3">
              <span className="mt-0.5 font-display text-[13px] text-gold-dim">{index + 1}</span>
              <span className={`min-w-0 flex-1 text-[15px] leading-snug ${AFFIX_TONE[affix]}`}>
                {group.tiers[0]?.text ?? group.text}
                {free === 0 && <span className="ml-2 font-display text-[10px] tracking-[0.14em] text-parchment-faint">NO {affix.toUpperCase()} FREE</span>}
              </span>
              <Impact group={group} large />
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function PoolList({ title, groups, tone, free }: { title: string; groups: ForgePoolGroup[]; tone: string; free: number }) {
  const best = Math.max(1, ...groups.map((group) => group.chance));
  return (
    <section>
      <h4 className={`mb-2 font-display text-[13px] tracking-[0.2em] ${tone}`}>
        {title.toUpperCase()} <span className="text-parchment-faint">· {groups.length}</span>
      </h4>
      <ul className="flex flex-col gap-1.5">
        {groups.map((group, index) => (
          <li
            key={index}
            className={`forge-row px-3 py-1.5 ${group.owned ? "forge-row--owned" : ""}`}
            title={group.tiers.map((tier) => `T${tier.tier} (lvl ${tier.level}): ${tier.text}`).join("\n")}
          >
            <div className="flex items-start gap-2">
              <span className={`min-w-0 flex-1 text-[14px] leading-snug ${group.owned ? "text-parchment" : tone}`}>{group.text}</span>
              {group.influence && <LeagueBadge league={["Shaper", "Elder"].includes(group.influence) ? "Shaper and Elder" : "Conquerors"} variant="icon" />}
              <Impact group={group} />
              <span className="shrink-0 font-display text-[10px] tracking-[0.1em] text-parchment-faint">{group.tiers.length} {group.tiers.length === 1 ? "TIER" : "TIERS"}</span>
            </div>
            <div className="mt-1 flex items-center gap-2">
              <span className="h-1 flex-1 bg-black/60">
                <span className="block h-full bg-gradient-to-r from-[#6b1d16] to-[#c9933f]" style={{ width: `${(group.chance / best) * 100}%` }} />
              </span>
              <span className="w-12 text-right font-display text-[11px] text-parchment-dim">{group.chance}%</span>
              {group.owned ? (
                <span className="font-display text-[10px] tracking-[0.14em] text-gold">HAVE</span>
              ) : (
                free === 0 && <span className="font-display text-[10px] tracking-[0.14em] text-parchment-faint">NO ROOM</span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

const formatPrice = (value: number) => (value >= 10 ? Math.round(value).toLocaleString() : String(Math.round(value * 10) / 10));

/** What the unique sells for in the character's league, from poe.ninja. */
function MarketValue({ name }: { name: string }) {
  const league = useContext(CurrentLeague);
  const [state, setState] = useState<{ key: string; prices?: MarketPrice[]; error?: string } | null>(null);
  const key = `${league}|${name}`;

  useEffect(() => {
    let active = true;
    desktop.uniquePrice(name, league).then(
      (prices) => active && setState({ key, prices }),
      (error: unknown) => active && setState({ key, error: error instanceof Error ? error.message : String(error) }),
    );
    return () => {
      active = false;
    };
  }, [key, league, name]);

  const current = state?.key === key ? state : null;
  const cheapest = current?.prices?.[0];
  return (
    <div className="mt-4 border-t border-[#3a2a26] pt-4">
      <h5 className="mb-2 font-display text-[12px] tracking-[0.2em] text-gold">MARKET PRICE · {league.toUpperCase()}</h5>
      {!current && <p className="text-[15px] text-parchment-faint">Asking poe.ninja…</p>}
      {current?.error && <p className="text-[15px] text-parchment-faint">Prices are not available right now.</p>}
      {current?.prices && !cheapest && <p className="text-[15px] text-parchment-faint">Not listed in {league} on poe.ninja.</p>}
      {cheapest && (
        <>
          <p className="flex flex-wrap items-baseline gap-x-3">
            <span className="font-display text-[26px] text-parchment">{formatPrice(cheapest.chaos)}</span>
            <span className="text-[15px] text-parchment-dim">chaos</span>
            {cheapest.divine && cheapest.divine >= 0.1 && (
              <span className="text-[15px] text-gold-dim">≈ {formatPrice(cheapest.divine)} divine</span>
            )}
          </p>
          {current!.prices!.length > 1 && (
            <ul className="mt-2 flex flex-col gap-0.5 text-[13px] text-parchment-faint">
              {current!.prices!.slice(1, 5).map((price, index) => (
                <li key={index}>
                  {[price.variant, price.links ? `${price.links} links` : null].filter(Boolean).join(" · ") || "Other listing"}:{" "}
                  {formatPrice(price.chaos)} chaos
                </li>
              ))}
            </ul>
          )}
          <p className="mt-2 text-[12px] text-parchment-faint">
            {cheapest.listings ? `${cheapest.listings} listed · ` : ""}poe.ninja, updated hourly
          </p>
        </>
      )}
    </div>
  );
}

function UniqueBody({ forge }: { forge: ForgeResult }) {
  return (
    <div className="grid gap-6 md:grid-cols-[1fr_1.1fr]">
      <section className="iron-card px-5 py-4">
        <h4 className="mb-3 font-display text-[13px] tracking-[0.2em] text-gold">HOW TO GET IT</h4>
        {forge.league && (
          <p className="mb-3 flex items-center gap-3 text-[16px] text-parchment-dim">
            <LeagueBadge league={forge.league} />
          </p>
        )}
        <p className="text-[17px] leading-relaxed text-parchment">
          {forge.source ?? "No special source: it drops in the world, like any unique of its level."}
        </p>
        {forge.league && (
          <p className="mt-3 text-[14px] leading-snug text-parchment-faint">
            It came with the {forge.league} league{forge.source ? "" : " and now drops in the core game"}.
          </p>
        )}
        <MarketValue name={forge.name} />
      </section>
      <section className="iron-tooltip px-5 py-4">
        <ItemMods item={forge as unknown as EngineItem} />
      </section>
    </div>
  );
}

function CraftedBody({ forge }: { forge: ForgeResult }) {
  const slots = forge.slots;
  const freePrefix = slots ? slots.prefix.max - slots.prefix.used : 0;
  const freeSuffix = slots ? slots.suffix.max - slots.suffix.used : 0;
  const bench = forge.bench ?? [];
  const benchFits = bench.filter((craft) => (craft.affix === "prefix" ? freePrefix : freeSuffix) > 0);
  return (
    <div className="flex flex-col gap-6">
      <BestForBuild forge={forge} freePrefix={freePrefix} freeSuffix={freeSuffix} />
      <div className="grid gap-6 lg:grid-cols-[1fr_1.15fr]">
        <section className="flex flex-col gap-4">
          <div className="iron-tooltip flex gap-4 px-5 py-4 text-[15px] leading-snug">
            <div className="min-w-0 flex-1">
              <ItemMods item={forge as unknown as EngineItem} />
            </div>
            <ModLegend mods={forge.mods} />
          </div>
          {slots && (
            <div className="iron-card flex flex-col gap-2 px-5 py-4">
              <Slots label="Prefixes" used={slots.prefix.used} max={slots.prefix.max} tone={AFFIX_TONE.prefix} />
              <Slots label="Suffixes" used={slots.suffix.used} max={slots.suffix.max} tone={AFFIX_TONE.suffix} />
              <p className="mt-1 text-[13px] leading-snug text-parchment-faint">
                T1 is the best tier this base can roll at item level {forge.itemLevel ?? "?"}. A full side takes no more random modifiers.
              </p>
            </div>
          )}
        </section>
        <section className="iron-card max-h-[34rem] overflow-y-auto px-5 py-4 iron-scroll">
          <h4 className="mb-1 font-display text-[13px] tracking-[0.2em] text-gold">WHAT THIS BASE CAN ROLL</h4>
          <p className="mb-4 text-[13px] leading-snug text-parchment-faint">
            Chance that a new random modifier (a chaos or exalted orb) is each one, from the game's own weights. Hover a row for its tiers.
          </p>
          <div className="flex flex-col gap-5">
            {forge.pool && <PoolList title="Prefixes" groups={forge.pool.prefix} tone={AFFIX_TONE.prefix} free={freePrefix} />}
            {forge.pool && <PoolList title="Suffixes" groups={forge.pool.suffix} tone={AFFIX_TONE.suffix} free={freeSuffix} />}
          </div>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {forge.essences && forge.essences.length > 0 && (
          <section className="iron-card px-5 py-4">
            <h4 className="mb-1 flex items-center gap-2 font-display text-[13px] tracking-[0.2em] text-gold">
              <LeagueBadge league="Essence" variant="icon" /> ESSENCES
            </h4>
            <p className="mb-3 text-[13px] text-parchment-faint">Each one guarantees its modifier on a {forge.itemClass.toLowerCase()}.</p>
            <ul className="grid max-h-64 gap-1 overflow-y-auto pr-2 iron-scroll">
              {forge.essences.map((essence) => (
                <li key={essence.name} className="text-[14px] leading-snug">
                  <span className="text-parchment">{essence.name}</span>{" "}
                  <span className={essence.affix ? AFFIX_TONE[essence.affix] : "text-parchment-dim"}>— {essence.text}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
        {bench.length > 0 && (
          <section className="iron-card px-5 py-4">
            <h4 className="mb-1 font-display text-[13px] tracking-[0.2em] text-gold">CRAFTING BENCH</h4>
            <p className="mb-3 text-[13px] text-parchment-faint">
              {benchFits.length > 0 ? `${benchFits.length} crafts fit a free slot of this item now.` : "No free slot: the bench can not add a modifier right now."}
            </p>
            <ul className="grid max-h-64 gap-1 overflow-y-auto pr-2 iron-scroll">
              {bench.map((craft, index) => {
                const fits = (craft.affix === "prefix" ? freePrefix : freeSuffix) > 0;
                return (
                  <li key={index} className={`flex items-start gap-2 text-[14px] leading-snug ${fits ? "" : "opacity-45"}`}>
                    <span className={`font-display text-[10px] ${AFFIX_TONE[craft.affix]}`}>{craft.affix === "prefix" ? "P" : "S"}</span>
                    <span className="text-[#c7c2ff]">{craft.text}</span>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}

/** The Forge over the page: opens on an item, closes with the button, Escape or a click outside. */
function ForgeView({ item, slot, onClose }: { item: EngineItem; slot?: string; onClose: () => void }) {
  const [state, setState] = useState<{ raw: string; forge?: ForgeResult; error?: string } | null>(null);

  useEffect(() => {
    if (!item.raw) return;
    let active = true;
    desktop.forgeItem(item.raw, slot).then(
      (forge) => active && setState({ raw: item.raw!, forge }),
      (error: unknown) => active && setState({ raw: item.raw!, error: error instanceof Error ? error.message : String(error) }),
    );
    return () => {
      active = false;
    };
  }, [item.raw, slot]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const current = state && state.raw === item.raw ? state : null;
  const forge = current?.forge;
  const rarity = rarityStyle(item.rarity);

  return createPortal(
    <div className="forge-overlay fixed inset-0 z-[70] overflow-y-auto px-4 py-10" onClick={onClose} role="dialog" aria-modal="true" aria-label="The Forge">
      <div className="mx-auto max-w-6xl" onClick={(event) => event.stopPropagation()}>
        <AtlasFrame>
          <div className="flex items-start justify-between gap-4">
            <AtlasSectionHeader title="The Forge" icon={<AtlasStarIcon className="h-7 w-7" />} />
            <button
              type="button"
              onClick={onClose}
              aria-label="Close the Forge"
              className="border border-gold-dim/60 px-3 py-1 font-display text-[13px] tracking-[0.18em] text-parchment-dim transition hover:border-gold hover:text-gold"
            >
              CLOSE ✕
            </button>
          </div>
          <header className="mb-6 flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <h3 className={`font-display text-[26px] leading-tight ${rarity.tone}`}>{item.name}</h3>
            {item.base && item.base !== item.name && <span className={`text-[18px] ${rarity.tone} opacity-80`}>{item.base}</span>}
            {forge?.itemLevel && <span className="font-display text-[12px] tracking-[0.18em] text-parchment-faint">ITEM LEVEL {forge.itemLevel}</span>}
            {forge?.influences?.map((influence) => (
              <span key={influence} className="font-display text-[12px] tracking-[0.18em] text-gold-dim">
                {influence.toUpperCase()}
              </span>
            ))}
          </header>

          {!current && (
            <p className="py-10 text-center text-[17px] text-parchment-dim">
              {slot ? "Heating the forge and testing every modifier on your character…" : "Heating the forge…"}
            </p>
          )}
          {current?.error && <p className="py-10 text-center text-[17px] text-ember">{current.error}</p>}
          {forge && (forge.unique ? <UniqueBody forge={forge} /> : <CraftedBody forge={forge} />)}
        </AtlasFrame>
      </div>
    </div>,
    document.body,
  );
}

export default ForgeView;
