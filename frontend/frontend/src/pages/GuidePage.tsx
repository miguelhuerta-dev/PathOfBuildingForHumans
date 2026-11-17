import { useState } from "react";
import AtlasFrame from "../components/AtlasFrame";
import AtlasSectionHeader from "../components/AtlasSectionHeader";
import UpgradeCard from "../components/UpgradeCard";
import ConstellationMap, { MapLegend, type MapFocus } from "../components/ConstellationMap";
import ItemIcon from "../components/ItemIcon";
import { AtlasStarIcon, QuillIcon, SigilIcon, SwordIcon } from "../components/icons";
import type { Archive } from "../state/useArchive";
import { usePassiveIcons } from "../state/usePassiveIcons";
import { usePassiveTree } from "../state/usePassiveTree";
import type { EngineBuild, EngineStats } from "../types/Engine";
import { changeTone, formatNumber, formatSignedPercent } from "../utils/format";
import { ChipGroup, ErrorNote, MetalMeter } from "../components/ui";

function Signed({ value }: { value: number }) {
  return <span className={changeTone(value)}>{formatSignedPercent(value)}</span>;
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

function PassivesPanel({ archive }: { archive: Archive }) {
  const passives = archive.result?.passives;
  const tree = usePassiveTree(passives, archive.result?.character?.character.class);
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
          <MapLegend />
          <p className="mt-2 text-[14px] text-parchment-faint">
            Passive tree {tree.graph.tree.version}. Ascendancy passives are listed below.
            {passiveIcons.unavailable && ` ${passiveIcons.unavailable}`}
          </p>
        </div>
      )}

      <div className="mt-6 flex flex-col gap-4">
        {group("ASCENDANCY", ascendancy, "text-[#f2d27a]")}
        {group("KEYSTONES", keystones, "text-[#f2d27a]")}
        {group("NOTABLES", notables, "text-parchment")}
        {group("MASTERIES", masteries, "text-arcane")}
        {passives.missing.length === 0 && (
          <p className="text-[18px] text-verdigris">You have every key passive of this stage.</p>
        )}
      </div>
    </AtlasFrame>
  );
}

function GemsPanel({ you, guide }: { you?: EngineBuild; guide: EngineBuild }) {
  const owned = new Set(you?.skills.flatMap((group) => group.gems.map((gem) => gem.name)) ?? []);
  const groups = guide.skills.filter((group) => group.gems.length > 0);
  if (groups.length === 0) return null;

  return (
    <AtlasFrame>
      <AtlasSectionHeader title="Gem Links" icon={<SigilIcon className="h-7 w-7" />} />
      {you && <p className="mb-4 text-[17px] text-parchment-dim">Gems you do not have yet are marked in ember.</p>}
      <ul className="grid gap-3 md:grid-cols-2">
        {groups.map((group, index) => (
          <li key={`${group.label}-${index}`} className="border border-gold-dim/30 bg-black/40 px-4 py-3">
            <p className="font-display text-[13px] tracking-[0.16em] text-parchment-dim">
              {(group.slot ?? "Socketed").toUpperCase()}
              {group.main ? " · MAIN SKILL" : ""}
            </p>
            <p className="mt-1 text-[17px] leading-relaxed">
              {group.gems.map((gem, gemIndex) => (
                <span key={`${gem.name}-${gemIndex}`}>
                  {gemIndex > 0 && <span className="text-parchment-faint"> · </span>}
                  <span className={you && !owned.has(gem.name) ? "text-ember" : "text-parchment"}>{gem.name}</span>
                </span>
              ))}
            </p>
          </li>
        ))}
      </ul>
    </AtlasFrame>
  );
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

              <PassivesPanel archive={archive} />
            </>
          )}

          <GemsPanel you={comparing ? you : undefined} guide={guide} />
        </>
      )}
    </>
  );
}

export default GuidePage;
