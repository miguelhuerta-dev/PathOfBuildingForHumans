import { useState } from "react";
import AtlasFrame from "../components/AtlasFrame";
import AtlasSectionHeader from "../components/AtlasSectionHeader";
import UpgradeCard from "../components/UpgradeCard";
import ConstellationMap, { MapLegend, type MapFocus } from "../components/ConstellationMap";
import NextSteps from "../components/NextSteps";
import EquipmentPanel from "../components/EquipmentPanel";
import AscensionPanel from "../components/guide/AscensionPanel";
import BanditPantheonPanel from "../components/guide/BanditPantheonPanel";
import GemLinksPanel from "../components/guide/GemLinksPanel";
import ItemIcon from "../components/ItemIcon";
import { AtlasStarIcon, QuillIcon, SigilIcon, SwordIcon } from "../components/icons";
import type { Archive } from "../state/useArchive";
import { usePassiveIcons } from "../state/usePassiveIcons";
import { usePassiveTree } from "../state/usePassiveTree";
import type { EngineBuild, EngineItem, EngineStats } from "../types/Engine";
import { changeTone, formatNumber, formatSignedPercent } from "../utils/format";
import { ChipGroup, ErrorNote, MetalMeter } from "../components/ui";

function Signed({ value }: { value: number }) {
  return <span className={changeTone(value)}>{formatSignedPercent(value)}</span>;
}

/** Guides opened before, as a shelf of iron plates: open one to switch, or forget it. */
function GuideLibrary({ archive }: { archive: Archive }) {
  if (archive.savedGuides.length === 0) return null;
  const busy = archive.guideState === "loading";
  return (
    <div className="mt-6">
      <h3 className="font-display text-[13px] tracking-[0.2em] text-parchment-dim">YOUR GUIDE LIBRARY</h3>
      <ul className="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {archive.savedGuides.map((saved) => {
          const open = saved.input === archive.guideInput;
          return (
            <li key={saved.input} className={`iron-card flex items-center gap-3 px-3 py-2 ${open ? "iron-card--main" : ""}`}>
              <QuillIcon className={`h-6 w-6 shrink-0 ${open ? "text-gold" : "text-parchment-faint"}`} />
              <button
                type="button"
                disabled={busy || open}
                onClick={() => void archive.loadGuide(saved.input)}
                className="min-w-0 flex-1 text-left disabled:cursor-default"
                title={open ? "Open now" : "Open this guide"}
              >
                <span className={`block truncate text-[16px] ${open ? "text-gold" : "text-parchment"}`}>{saved.title}</span>
                <span className="block text-[13px] text-parchment-faint">
                  {open ? "Open now" : `Opened ${new Date(saved.openedAt).toLocaleDateString()}`}
                </span>
              </button>
              <button
                type="button"
                onClick={() => archive.removeSavedGuide(saved.input)}
                aria-label={`Forget ${saved.title}`}
                title="Forget this guide"
                className="shrink-0 px-1 text-[18px] leading-none text-parchment-faint hover:text-ember"
              >
                ×
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ImportPanel({ archive }: { archive: Archive }) {
  const [input, setInput] = useState("");
  const guide = archive.result?.guide;

  return (
    <AtlasFrame>
      <AtlasSectionHeader title="Follow a Guide" icon={<QuillIcon className="h-6 w-6" />} />
      <form
        className="flex flex-col gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          void archive.loadGuide(input);
        }}
      >
        <label className="flex flex-col gap-1">
          <span className="font-display text-[13px] tracking-[0.18em] text-parchment-dim">
            PATH OF BUILDING CODE OR LINK
          </span>
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            rows={3}
            spellCheck={false}
            placeholder="Paste a PoB code, or a pobb.in / pastebin link"
            className="resize-y border border-gold-dim/60 bg-black/50 px-3 py-2 font-mono text-[14px] text-parchment placeholder:font-body placeholder:text-[17px] placeholder:text-parchment-faint focus:border-gold focus:outline-none"
          />
        </label>
        <p className="text-[15px] text-parchment-faint">
          On Maxroll, open the guide's Path of Building section and press Copy, then paste the code here.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={!archive.isDesktopApp || archive.guideState === "loading" || !input.trim()}
            className="ui-button h-12 min-w-56 font-display text-[14px] tracking-[0.2em] text-parchment transition hover:brightness-125 disabled:opacity-50"
          >
            {archive.guideState === "loading" ? "STUDYING THE GUIDE…" : "LOAD GUIDE"}
          </button>
          {guide && (
            <button
              type="button"
              onClick={() => void archive.clearGuide()}
              className="border border-gold-dim/60 px-4 font-display text-[13px] tracking-[0.18em] text-parchment-dim hover:text-gold"
            >
              REMOVE GUIDE
            </button>
          )}
        </div>
        {!archive.isDesktopApp && (
          <p className="text-[16px] text-ember">Guides are calculated by the desktop app.</p>
        )}
        {archive.guideError && <ErrorNote>{archive.guideError}</ErrorNote>}
      </form>
      <GuideLibrary archive={archive} />
    </AtlasFrame>
  );
}

function StageSelector({ archive, guide }: { archive: Archive; guide: EngineBuild }) {
  const stages = guide.stages ?? [];
  if (stages.length < 2) return null;
  return (
    <AtlasFrame>
      <AtlasSectionHeader title="Guide Stages" icon={<SigilIcon className="h-7 w-7" />} />
      <p className="mb-4 text-[17px] text-parchment-dim">
        The stage is picked from your level. Choose another one to plan ahead.
      </p>
      <ChipGroup
        label="Guide stage"
        options={stages.map((stage) => ({ value: stage.index, label: stage.title }))}
        selected={stages.find((stage) => stage.active)?.index ?? stages[0].index}
        onSelect={(index) => void archive.selectStage(index)}
        disabled={archive.guideState === "loading"}
      />
    </AtlasFrame>
  );
}

const COMPARE_ROWS: { key: keyof EngineStats; label: string; format?: (v: number) => string }[] = [
  { key: "DPS", label: "DPS", format: formatNumber },
  { key: "TotalEHP", label: "Effective HP", format: formatNumber },
  { key: "Life", label: "Life", format: formatNumber },
  { key: "EnergyShield", label: "Energy Shield", format: formatNumber },
  { key: "FireResist", label: "Fire Resistance", format: (v) => `${Math.round(v)}%` },
  { key: "ColdResist", label: "Cold Resistance", format: (v) => `${Math.round(v)}%` },
  { key: "LightningResist", label: "Lightning Resistance", format: (v) => `${Math.round(v)}%` },
  { key: "ChaosResist", label: "Chaos Resistance", format: (v) => `${Math.round(v)}%` },
  { key: "HitChance", label: "Chance to Hit", format: (v) => `${Math.round(v)}%` },
  { key: "SpellSuppressionChance", label: "Spell Suppression", format: (v) => `${Math.round(v)}%` },
];

function CompareTable({ you, guide }: { you: EngineBuild; guide: EngineBuild }) {
  return (
    <AtlasFrame>
      <AtlasSectionHeader title="You and the Guide" icon={<SwordIcon className="h-6 w-6" />} />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-left text-[18px]">
          <caption className="sr-only">Your character compared with the guide at the selected stage</caption>
          <thead>
            <tr className="font-display text-[13px] tracking-[0.18em] text-parchment-dim">
              <th scope="col" className="py-2 font-normal">STAT</th>
              <th scope="col" className="py-2 font-normal">YOU (LV {you.character.level})</th>
              <th scope="col" className="py-2 font-normal">GUIDE (LV {guide.character.level})</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-gold-dim/20">
              <th scope="row" className="py-2 font-normal text-parchment-dim">Main skill</th>
              <td className="py-2 text-parchment">{you.character.mainSkill ?? "—"}</td>
              <td className={`py-2 ${you.character.mainSkill === guide.character.mainSkill ? "text-parchment" : "text-ember"}`}>
                {guide.character.mainSkill ?? "—"}
              </td>
            </tr>
            {COMPARE_ROWS.map(({ key, label, format }) => {
              const mine = you.stats[key];
              const theirs = guide.stats[key];
              if (mine === undefined && theirs === undefined) return null;
              const behind = mine !== undefined && theirs !== undefined && mine < theirs;
              return (
                <tr key={key} className="border-t border-gold-dim/20">
                  <th scope="row" className="py-2 font-normal text-parchment-dim">{label}</th>
                  <td className={`py-2 ${behind ? "text-ember" : "text-parchment"}`}>
                    {mine !== undefined ? format?.(mine) ?? mine : "—"}
                  </td>
                  <td className="py-2 text-parchment">{theirs !== undefined ? format?.(theirs) ?? theirs : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </AtlasFrame>
  );
}

const NEXT_LIMIT = 8;

function PassivesPanel({ archive }: { archive: Archive }) {
  const passives = archive.result?.passives;
  const yourClass = archive.result?.character?.character.class;
  const guideClass = archive.result?.guide?.character.class;
  // Without a character the guide's own class start anchors the map.
  const hasCharacter = Boolean(archive.result?.character);
  const tree = usePassiveTree(passives, yourClass ?? guideClass);
  const passiveIcons = usePassiveIcons(tree.iconKeys, archive.clientLog || null);
  const [focus, setFocus] = useState<MapFocus | null>(null);
  if (!passives) return null;

  const ascendancy = passives.missing.filter((n) => n.ascendancy);
  const keystones = passives.missing.filter((n) => !n.ascendancy && n.type === "Keystone");
  const notables = passives.missing.filter((n) => !n.ascendancy && n.type === "Notable");
  const masteries = passives.missing.filter((n) => !n.ascendancy && n.type === "Mastery");

  const group = (title: string, nodes: typeof passives.missing, tone: string) =>
    nodes.length > 0 && (
      <div>
        <h4 className="font-display text-[13px] tracking-[0.2em] text-parchment-dim">{title}</h4>
        <ul className="mt-1 flex flex-wrap gap-2">
          {nodes.map((node) => {
            // Passives on the map can be found on it; ascendancy passives are not drawn.
            const onMap = node.id !== undefined && tree.graph?.byId.has(node.id);
            const chip = `border border-gold-dim/40 bg-black/50 px-3 py-1 text-[16px] ${tone}`;
            return (
              <li key={`${title}-${node.id ?? node.name}`}>
                {onMap ? (
                  <button
                    type="button"
                    title="Show on the tree"
                    onClick={() => node.id !== undefined && setFocus({ id: node.id })}
                    className={`${chip} hover:border-gold hover:text-gold`}
                  >
                    {node.name}
                  </button>
                ) : (
                  <span className={`block ${chip}`}>{node.name}</span>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    );

  return (
    <AtlasFrame>
      <AtlasSectionHeader title="Passive Tree" icon={<AtlasStarIcon className="h-7 w-7" />} />
      {hasCharacter ? (
        <>
          <p className="text-[19px] text-parchment">
            You have taken <span className="text-gold">{passives.shared}</span> of the guide's{" "}
            <span className="text-gold">{passives.guidePoints}</span> points for this stage
            {passives.extra > 0 ? `, plus ${passives.extra} the guide does not use` : ""}.
          </p>
          <MetalMeter
            label="Guide passive points taken"
            value={passives.shared}
            max={passives.guidePoints}
            className="mt-3 max-w-xl"
          />
        </>
      ) : (
        <p className="text-[19px] text-parchment">
          The guide takes <span className="text-gold">{passives.guidePoints}</span> points at this stage. Connect your
          character on the Character page to see which ones you already have.
        </p>
      )}
      {yourClass && guideClass && yourClass !== guideClass && (
        <ErrorNote className="mt-4">
          This guide is for a {guideClass} and your character is a {yourClass}. Each class starts in a different part
          of the tree, so the guide's passives are far from yours. Load a {yourClass} guide to follow it.
        </ErrorNote>
      )}

      {tree.loadError && <ErrorNote className="mt-4">{tree.loadError}</ErrorNote>}
      {tree.graph && passives.guideNodes && (
        <div className="mt-5">
          <ConstellationMap
            graph={tree.graph}
            guide={tree.guide}
            owned={tree.owned}
            starts={tree.starts}
            picks={tree.picks}
            focus={focus}
            icons={passiveIcons.icons}
            label="Your passive tree compared with the guide's"
          />
          <MapLegend icons={Object.keys(passiveIcons.icons).length > 0} />
          <p className="mt-2 text-[14px] text-parchment-faint">
            Passive tree {tree.graph.tree.version}. Ascendancy passives are listed below.
            {passiveIcons.note && ` ${passiveIcons.note}`}
          </p>
        </div>
      )}

      <div className="mt-6 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        {tree.progress && tree.progress.next.length > 0 && (
          <div>
            <NextSteps steps={tree.progress.next} limit={NEXT_LIMIT} onFocus={(id) => setFocus({ id })} />
          </div>
        )}
        <div className="flex flex-col gap-4">
          {group("ASCENDANCY", ascendancy, "text-[#f2d27a]")}
          {group("KEYSTONES", keystones, "text-[#f2d27a]")}
          {group("NOTABLES", notables, "text-parchment")}
          {group("MASTERIES", masteries, "text-arcane")}
          {passives.missing.length === 0 && (
            <p className="text-[18px] text-verdigris">You have every key passive of this stage.</p>
          )}
        </div>
      </div>
    </AtlasFrame>
  );
}

/**
 * Whether the character already has a guide item: uniques by name anywhere,
 * other gear by base type in the same slot (rares are named at random).
 */
function ownsItem(you: EngineBuild, item: EngineItem): boolean {
  if ((item.rarity ?? "").toUpperCase() === "UNIQUE") return you.items.some((own) => own.name === item.name);
  return you.items.some((own) => own.slot === item.slot && (own.base === item.base || own.name === item.name));
}

function GuidePage({ archive }: { archive: Archive }) {
  const guide = archive.result?.guide;
  const you = archive.result?.character;
  const upgrades = archive.result?.upgrades ?? [];
  const comparing = Boolean(guide && you && archive.result?.upgrades);

  return (
    <>
      <ImportPanel archive={archive} />

      {guide && (
        <>
          <p className="text-center text-[17px] text-parchment-dim">
            Guide: {guide.character.ascendancy ?? guide.character.class} · {guide.character.mainSkill ?? "unknown skill"}
            {!comparing && " — connect a character on the Character page to compare."}
          </p>

          <StageSelector archive={archive} guide={guide} />

          <EquipmentPanel
            items={guide.items}
            title="Artifacts of this Stage"
            intro={[
              guide.itemsFromStage
                ? `This stage has no gear of its own: this is the gear of "${guide.itemsFromStage}", the nearest stage that has it.`
                : "The guide's gear for this stage.",
              you ? "A gold mark is gear you already wear; an ember mark, gear still to find." : "",
            ].join(" ")}
            owned={you ? (item) => ownsItem(you, item) : undefined}
            emptyNote={
              guide.noStageItems
                ? "The guide lists no gear for this stage: wear what you find, with life and resistances first."
                : undefined
            }
          />

          <GemLinksPanel guide={guide} you={comparing ? you : undefined} />

          <PassivesPanel archive={archive} />

          {comparing && you && (
            <>
              <CompareTable you={you} guide={guide} />

              {upgrades.length > 0 && (
                <div className="grid items-start gap-6 lg:grid-cols-[1fr_1.1fr]">
                  <AtlasFrame>
                    <AtlasSectionHeader title="Recommended Artifact" icon={<AtlasStarIcon className="h-7 w-7" />} />
                    <UpgradeCard upgrade={upgrades[0]} />
                  </AtlasFrame>
                  <AtlasFrame>
                    <AtlasSectionHeader title="Then" icon={<QuillIcon className="h-6 w-6" />} />
                    <ol className="flex flex-col divide-y divide-gold-dim/20">
                      {upgrades.slice(1, 8).map((upgrade) => (
                        <li key={upgrade.slot} className="flex flex-wrap items-center justify-between gap-x-4 py-3">
                          <span className="flex items-center gap-3">
                            <ItemIcon src={upgrade.item.icon} className="h-12 w-12 shrink-0" />
                            <span>
                            <span className="font-display text-[13px] tracking-[0.16em] text-parchment-dim">
                              {upgrade.slot.toUpperCase()}
                            </span>
                            <span className="block text-[18px] text-parchment">{upgrade.item.name}</span>
                            {upgrade.current && (
                              <span className="block text-[15px] text-parchment-faint">instead of {upgrade.current}</span>
                            )}
                            </span>
                          </span>
                          <span className="font-display text-[17px]">
                            <Signed value={upgrade.dpsChange} /> <span className="text-[13px] text-parchment-dim">DPS</span>{" "}
                            <Signed value={upgrade.ehpChange} /> <span className="text-[13px] text-parchment-dim">EHP</span>
                          </span>
                        </li>
                      ))}
                    </ol>
                  </AtlasFrame>
                </div>
              )}

            </>
          )}


          <AscensionPanel
            guide={guide}
            owned={archive.result?.passives?.characterNodes ? new Set(archive.result.passives.characterNodes) : undefined}
            clientLog={archive.clientLog || null}
          />


          <BanditPantheonPanel guide={guide} />
        </>
      )}
    </>
  );
}

export default GuidePage;
