import { useMemo } from "react";
import { atlasArt } from "../assets/atlas";
import { analyze } from "../analysis/analyze";
import { formatNumber } from "../utils/format";
import { ErrorNote } from "../components/ui";
import AtlasFrame from "../components/AtlasFrame";
import AtlasSectionHeader from "../components/AtlasSectionHeader";
import AnalysisCard from "../components/AnalysisCard";
import ConnectPanel from "../components/ConnectPanel";
import EquipmentPanel from "../components/EquipmentPanel";
import { ScoreCard, StatCard } from "../components/StatCard";
import IssueCard from "../components/IssueCard";
import UpgradeCard from "../components/UpgradeCard";
import type { Page } from "../components/TopNav";
import type { Archive } from "../state/useArchive";
import type { EngineBuild } from "../types/Engine";
import type { Analysis } from "../analysis/analyze";
import { AtlasStarIcon, ShieldIcon, SigilIcon, SkullIcon, SwordIcon } from "../components/icons";

function BuildHeader({ build, analysis }: { build: EngineBuild; analysis: Analysis }) {
  const { character } = build;
  const title = character.ascendancy && character.ascendancy !== "None" ? character.ascendancy : character.class;

  return (
    <AtlasFrame pendant>
      <div className="grid items-center gap-6 md:grid-cols-[220px_1fr_auto_auto]">
        {/* The emblem rises above the frame but stays inside its own column, clear of the text. */}
        <div className="relative hidden h-44 md:block" aria-hidden="true">
          <img
            src={atlasArt.emblem}
            alt=""
            className="absolute -top-24 left-1/2 h-[250px] w-[250px] max-w-none -translate-x-1/2 -rotate-6 [filter:drop-shadow(0_14px_22px_rgba(0,0,0,0.9))_drop-shadow(0_0_26px_rgba(217,179,108,0.28))]"
          />
        </div>

        <div className="min-w-0">
          <h1 className="title-text truncate font-display text-[clamp(32px,4vw,54px)] font-semibold leading-tight">
            {character.name ?? "Unknown Exile"}
          </h1>
          <p className="mt-1 font-display text-[17px] tracking-[0.16em] text-gold-dim">
            {(title ?? "").toUpperCase()} • LEVEL {character.level}
            {character.league ? ` • ${character.league.toUpperCase()}` : ""}
          </p>
          {character.mainSkill && (
            <p className="mt-3 text-[18px] italic leading-snug text-gold-dim">Main skill: {character.mainSkill}</p>
          )}
        </div>

        <div className="hidden h-40 flex-col items-center md:flex" aria-hidden="true">
          <div className="w-px flex-1 bg-gradient-to-b from-transparent to-gold-dim" />
          <SigilIcon className="my-2 h-10 w-10 text-gold-dim" />
          <div className="w-px flex-1 bg-gradient-to-t from-transparent to-gold-dim" />
        </div>

        <dl className="min-w-60 pr-2">
          <dt className="font-display text-[14px] tracking-[0.18em] text-parchment-dim">BUILD HEALTH</dt>
          <dd
            className={`engraved font-display text-[28px] font-semibold ${
              analysis.health === "Excellent" || analysis.health === "Good" ? "text-verdigris" : "text-ember"
            }`}
          >
            {analysis.health.toUpperCase()}
          </dd>
          <div className="my-3 h-px bg-gradient-to-r from-gold-dim/60 to-transparent" aria-hidden="true" />
          <dt className="font-display text-[14px] tracking-[0.18em] text-parchment-dim">PRIORITY</dt>
          <dd className="text-[20px] font-medium text-ember">{analysis.priority}</dd>
        </dl>
      </div>
    </AtlasFrame>
  );
}

function StatusBar({ archive }: { archive: Archive }) {
  if (!archive.isDesktopApp) {
    return (
      <p role="status" className="text-center text-[16px] text-parchment-dim">
        Demo character. Open the desktop app to connect your own exile.
      </p>
    );
  }
  return (
    <div role="status" className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[16px] text-parchment-dim">
      <span>
        {archive.characterState === "loading"
          ? "Consulting the archive…"
          : archive.updatedAt
            ? `Updated at ${archive.updatedAt.toLocaleTimeString()}`
            : "Not loaded yet"}
      </span>
      {archive.lastZone && <span>Last zone: {archive.lastZone}</span>}
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={archive.autoRefresh}
          onChange={(event) => archive.setAutoRefresh(event.target.checked)}
          className="h-4 w-4 accent-[#d9b36c]"
        />
        Refresh when I change zone
      </label>
      <button
        type="button"
        onClick={archive.refresh}
        disabled={archive.characterState === "loading" || !archive.selected}
        className="border border-gold-dim/60 px-4 py-1 font-display text-[13px] tracking-[0.18em] text-parchment hover:text-gold disabled:opacity-50"
      >
        REFRESH NOW
      </button>
    </div>
  );
}

interface DashboardProps {
  archive: Archive;
  onNavigate: (page: Page) => void;
}

function Dashboard({ archive, onNavigate }: DashboardProps) {
  const build = archive.result?.character;
  const upgrades = archive.result?.upgrades;
  const analysis = useMemo(() => (build ? analyze(build, upgrades) : null), [build, upgrades]);

  return (
    <>
      <StatusBar archive={archive} />

      {archive.characterError && <ErrorNote className="text-center">{archive.characterError}</ErrorNote>}

      {build && analysis && (
        <>
          <BuildHeader build={build} analysis={analysis} />
          <AnalysisCard analysis={analysis} />

          <section aria-label="Key stats" className="grid gap-4 md:grid-cols-[1.75fr_1fr_1fr]">
            <ScoreCard score={analysis.score} />
            <StatCard title="DPS" value={formatNumber(build.stats.DPS)} icon={<SwordIcon className="h-4 w-4" />} />
            <StatCard title="EHP" value={formatNumber(build.stats.TotalEHP ?? 0)} icon={<ShieldIcon className="h-4 w-4" />} />
          </section>

          <EquipmentPanel items={build.items} />

          <div className="mt-4 grid items-stretch gap-x-5 gap-y-10 lg:grid-cols-[1.12fr_1fr]">
            <AtlasFrame className="flex flex-col" contentClassName="flex flex-1 flex-col">
              <AtlasSectionHeader title="Threat Register" tone="blood" icon={<SkullIcon className="h-7 w-7" />} />
              <div className="flex flex-col gap-3">
                {analysis.findings.length === 0 && (
                  <p className="text-[18px] text-verdigris">No weaknesses found for {analysis.stageLabel.toLowerCase()}.</p>
                )}
                {analysis.findings.slice(0, 4).map((finding) => (
                  <IssueCard key={finding.id} {...finding} />
                ))}
              </div>
              <figure className="mt-auto pt-8 text-center">
                <blockquote className="text-[19px] italic text-gold-dim">“A single weakness can undo an empire.”</blockquote>
                <figcaption className="mt-1 font-display text-[12px] tracking-[0.24em] text-parchment-faint">
                  — THE ATLAS ARCHIVIST
                </figcaption>
              </figure>
            </AtlasFrame>

            <AtlasFrame>
              <AtlasSectionHeader title="Recommended Artifact" icon={<AtlasStarIcon className="h-7 w-7" />} />
              {upgrades && upgrades.length > 0 ? (
                <UpgradeCard upgrade={upgrades[0]} onViewDetails={() => onNavigate("guide")} />
              ) : (
                <div className="flex flex-col items-center gap-4 py-10 text-center">
                  <p className="max-w-sm text-[19px] text-parchment-dim">
                    Load the guide you are following and the archive will tell you which item to chase next.
                  </p>
                  <button
                    type="button"
                    onClick={() => onNavigate("guide")}
                    className="ui-button h-14 w-full max-w-sm font-display text-[15px] tracking-[0.2em] text-parchment transition hover:brightness-125"
                  >
                    LOAD A GUIDE
                  </button>
                </div>
              )}
            </AtlasFrame>
          </div>

        </>
      )}

      {archive.isDesktopApp && <ConnectPanel archive={archive} />}
    </>
  );
}

export default Dashboard;
