import { useMemo, useState } from "react";
import { atlasArt } from "../assets/atlas";
import { analyze } from "../analysis/analyze";
import { formatNumber } from "../utils/format";
import { ErrorNote } from "../components/ui";
import AtlasFrame from "../components/AtlasFrame";
import AtlasSectionHeader from "../components/AtlasSectionHeader";
import AnalysisCard from "../components/AnalysisCard";
import ConnectPanel from "../components/ConnectPanel";
import EquipmentPanel from "../components/EquipmentPanel";
import BestPassivesPanel from "../components/BestPassivesPanel";
import ProgressPanel from "../components/ProgressPanel";
import { ScoreCard, StatCard } from "../components/StatCard";
import IssueCard from "../components/IssueCard";
import UpgradeCard from "../components/UpgradeCard";
import type { Page } from "../components/TopNav";
import type { Archive } from "../state/useArchive";
import type { Bandit, EngineBuild } from "../types/Engine";
import type { Analysis } from "../analysis/analyze";
import { AtlasStarIcon, ShieldIcon, SigilIcon, SkullIcon, SwordIcon } from "../components/icons";
import { useT } from "../i18n";

function BuildHeader({ build, analysis }: { build: EngineBuild; analysis: Analysis }) {
  const t = useT();
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
            {character.name ?? t("Unknown Exile")}
          </h1>
          <p className="mt-1 font-display text-[17px] tracking-[0.16em] text-gold-dim">
            {(title ?? "").toUpperCase()} • {t("LEVEL")} {character.level}
            {character.league ? ` • ${character.league.toUpperCase()}` : ""}
          </p>
          {character.mainSkill && (
            <p className="mt-3 text-[18px] italic leading-snug text-gold-dim">{t("Main skill: {skill}", { skill: character.mainSkill })}</p>
          )}
        </div>

        <div className="hidden h-40 flex-col items-center md:flex" aria-hidden="true">
          <div className="w-px flex-1 bg-gradient-to-b from-transparent to-gold-dim" />
          <SigilIcon className="my-2 h-10 w-10 text-gold-dim" />
          <div className="w-px flex-1 bg-gradient-to-t from-transparent to-gold-dim" />
        </div>

        <dl className="min-w-60 pr-2">
          <dt className="font-display text-[14px] tracking-[0.18em] text-parchment-dim">{t("BUILD HEALTH")}</dt>
          <dd
            className={`engraved font-display text-[28px] font-semibold ${
              analysis.health === "Excellent" || analysis.health === "Good" ? "text-verdigris" : "text-ember"
            }`}
          >
            {t(analysis.health).toUpperCase()}
          </dd>
          <div className="my-3 h-px bg-gradient-to-r from-gold-dim/60 to-transparent" aria-hidden="true" />
          <dt className="font-display text-[14px] tracking-[0.18em] text-parchment-dim">{t("PRIORITY")}</dt>
          <dd className="text-[20px] font-medium text-ember">{analysis.priority}</dd>
        </dl>
      </div>
    </AtlasFrame>
  );
}

function StatusBar({ archive }: { archive: Archive }) {
  const t = useT();
  if (!archive.isDesktopApp) {
    return (
      <p role="status" className="text-center text-[16px] text-parchment-dim">
        {t("Demo character. Open the desktop app to connect your own exile.")}
      </p>
    );
  }
  return (
    <div role="status" className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[16px] text-parchment-dim">
      <span>
        {archive.characterState === "loading"
          ? archive.result && archive.updatedAt
            ? t("Refreshing… showing your last session ({time})", { time: archive.updatedAt.toLocaleTimeString() })
            : t("Consulting the archive…")
          : archive.updatedAt
            ? t("Updated at {time}", { time: archive.updatedAt.toLocaleTimeString() })
            : t("Not loaded yet")}
      </span>
      {archive.lastZone && <span>{t("Last zone: {zone}", { zone: archive.lastZone })}</span>}
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={archive.autoRefresh}
          onChange={(event) => archive.setAutoRefresh(event.target.checked)}
          className="h-4 w-4 accent-[#d9b36c]"
        />
        {t("Refresh when I change zone")}
      </label>
      {archive.selected && (
        <label className="flex items-center gap-2" title={t("Public profiles do not say which bandit you helped, and it changes your stats.")}>
          {t("Act 2 bandit")}
          <select
            value={archive.bandit ?? "None"}
            onChange={(event) => archive.setBandit(event.target.value as Bandit)}
            className="border border-gold-dim/60 bg-black/60 px-2 py-0.5 font-display text-[13px] tracking-[0.12em] text-parchment"
          >
            {BANDIT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {t(option.label)}
              </option>
            ))}
          </select>
        </label>
      )}
      <button
        type="button"
        onClick={archive.refresh}
        disabled={archive.characterState === "loading" || !archive.selected}
        className="border border-gold-dim/60 px-4 py-1 font-display text-[13px] tracking-[0.18em] text-parchment hover:text-gold disabled:opacity-50"
      >
        {t("REFRESH NOW")}
      </button>
    </div>
  );
}

const BANDIT_OPTIONS: { value: Bandit; label: string }[] = [
  { value: "None", label: "Killed all" },
  { value: "Alira", label: "Helped Alira" },
  { value: "Kraityn", label: "Helped Kraityn" },
  { value: "Oak", label: "Helped Oak" },
];

/**
 * Public profiles leave out the bandit choice, and Alira's +15% resistances or
 * Oak's life regeneration change the numbers, so the archive asks once per character.
 */
function BanditPrompt({ archive }: { archive: Archive }) {
  const t = useT();
  const level = archive.result?.character?.character.level ?? 0;
  if (!archive.isDesktopApp || !archive.selected || archive.bandit || level < 13) return null;
  return (
    <div role="note" className="iron-card flex flex-wrap items-center justify-center gap-x-5 gap-y-3 px-5 py-4 text-center">
      <p className="text-[17px] text-parchment-dim">
        <span className="font-display tracking-[0.12em] text-gold">{t("Which bandit did you help in Act 2?")}</span>{" "}
        {t("Your public profile does not say, and it changes your resistances and more.")}
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        {BANDIT_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => archive.setBandit(option.value)}
            className="border border-gold-dim/60 px-3 py-1 font-display text-[13px] tracking-[0.16em] text-parchment transition hover:border-gold hover:text-gold"
          >
            {t(option.label).toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );
}

/** The worst threats first; the rest one click away, so the panel stays readable. */
function ThreatList({ findings }: { findings: Analysis["findings"] }) {
  const t = useT();
  const [showAll, setShowAll] = useState(false);
  const shown = showAll ? findings : findings.slice(0, 4);
  return (
    <>
      {shown.map((finding) => (
        <IssueCard key={finding.id} {...finding} />
      ))}
      {findings.length > 4 && (
        <button
          type="button"
          onClick={() => setShowAll((value) => !value)}
          className="self-center border border-gold-dim/60 px-4 py-1 font-display text-[13px] tracking-[0.18em] text-parchment transition hover:border-gold hover:text-gold"
        >
          {showAll ? t("SHOW FEWER") : t("SHOW ALL {count} THREATS", { count: findings.length })}
        </button>
      )}
    </>
  );
}

interface DashboardProps {
  archive: Archive;
  onNavigate: (page: Page) => void;
}

function Dashboard({ archive, onNavigate }: DashboardProps) {
  const t = useT();
  const build = archive.result?.character;
  const upgrades = archive.result?.upgrades;
  const guideLoaded = Boolean(archive.result?.guide);
  const analysis = useMemo(() => (build ? analyze(build, upgrades, guideLoaded, t) : null), [build, upgrades, guideLoaded, t]);

  return (
    <>
      <StatusBar archive={archive} />
      <BanditPrompt archive={archive} />

      {archive.characterError && <ErrorNote className="text-center">{archive.characterError}</ErrorNote>}

      {build && analysis && (
        <>
          <BuildHeader build={build} analysis={analysis} />
          <AnalysisCard analysis={analysis} />

          <section aria-label={t("Key stats")} className="grid gap-4 md:grid-cols-[1.75fr_1fr_1fr]">
            <ScoreCard score={analysis.score} />
            <StatCard title="DPS" value={formatNumber(build.stats.DPS)} icon={<SwordIcon className="h-4 w-4" />} />
            <StatCard title="EHP" value={formatNumber(build.stats.TotalEHP ?? 0)} icon={<ShieldIcon className="h-4 w-4" />} />
          </section>

          <EquipmentPanel items={build.items} measure />

          <div className="mt-4 grid items-stretch gap-x-5 gap-y-10 lg:grid-cols-[1.12fr_1fr]">
            <AtlasFrame className="flex flex-col" contentClassName="flex flex-1 flex-col">
              <AtlasSectionHeader title="Threat Register" tone="blood" icon={<SkullIcon className="h-7 w-7" />} />
              <div className="flex flex-col gap-3">
                {analysis.findings.length === 0 && (
                  <p className="text-[18px] text-verdigris">{t("No weaknesses found for {stage}.", { stage: analysis.stageLabel.toLowerCase() })}</p>
                )}
                <ThreatList findings={analysis.findings} />
              </div>
              <figure className="mt-auto pt-8 text-center">
                <blockquote className="text-[19px] italic text-gold-dim">{t("“A single weakness can undo an empire.”")}</blockquote>
                <figcaption className="mt-1 font-display text-[12px] tracking-[0.24em] text-parchment-faint">
                  {t("— THE ATLAS ARCHIVIST")}
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
                    {guideLoaded
                      ? t("Nothing in your guide beats your gear at this stage. Pick a later stage to plan your next upgrades.")
                      : t("Load the guide you are following and the archive will tell you which item to chase next.")}
                  </p>
                  <button
                    type="button"
                    onClick={() => onNavigate("guide")}
                    className="ui-button h-14 w-full max-w-sm font-display text-[15px] tracking-[0.2em] text-parchment transition hover:brightness-125"
                  >
                    {guideLoaded ? t("OPEN THE GUIDE") : t("LOAD A GUIDE")}
                  </button>
                </div>
              )}
            </AtlasFrame>
          </div>

          {archive.isDesktopApp && archive.selected && <BestPassivesPanel character={archive.selected} />}
          {archive.isDesktopApp && <ProgressPanel history={archive.history} />}
        </>
      )}

      {archive.isDesktopApp && <ConnectPanel archive={archive} />}
    </>
  );
}

export default Dashboard;
