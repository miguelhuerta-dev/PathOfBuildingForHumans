import { atlasArt } from "../assets/atlas";
import { mockBuild } from "../data/mockBuild";
import { formatNumber } from "../utils/formatNumber";
import AtlasBackground from "../components/AtlasBackground";
import AtlasScene from "../components/AtlasScene";
import AtlasFrame from "../components/AtlasFrame";
import AtlasSectionHeader from "../components/AtlasSectionHeader";
import AnalysisCard from "../components/AnalysisCard";
import { ScoreCard, StatCard } from "../components/StatCard";
import IssueCard from "../components/IssueCard";
import UpgradeCard from "../components/UpgradeCard";
import TopNav from "../components/TopNav";
import { AtlasStarIcon, ShieldIcon, SigilIcon, SkullIcon, SwordIcon } from "../components/icons";

function Motto({ lines, align }: { lines: string[]; align: "left" | "right" }) {
  return (
    <p
      className={`hidden font-display text-[13px] engraved font-medium leading-relaxed tracking-[0.22em] text-parchment-dim lg:block ${
        align === "right" ? "text-right" : ""
      }`}
    >
      {lines.map((line) => (
        <span key={line} className="block">
          {line}
        </span>
      ))}
    </p>
  );
}

function BuildHeader() {
  return (
    <AtlasFrame pendant>
      <div className="grid items-center gap-6 md:grid-cols-[200px_1fr_auto_auto]">
        <div className="relative hidden h-40 md:block">
          <img
            src={atlasArt.portraitInquisitor}
            alt={`${mockBuild.ascendancy} portrait`}
            className="absolute -left-14 -top-14 h-[270px] w-[270px] max-w-none object-cover brightness-90 saturate-[0.85] [mask-image:radial-gradient(ellipse_70%_75%_at_45%_42%,black_55%,transparent_100%)]"
          />
        </div>

        <div>
          <h1 className="title-text font-display text-[clamp(34px,4.2vw,56px)] font-semibold leading-tight lg:whitespace-nowrap">
            {mockBuild.name}
          </h1>
          <p className="mt-1 font-display text-[17px] tracking-[0.16em] text-gold-dim">
            {mockBuild.ascendancy.toUpperCase()} • LEVEL {mockBuild.level}
          </p>
          <p className="mt-3 max-w-xs text-[18px] italic leading-snug text-gold-dim">
            “{mockBuild.quote}”
          </p>
        </div>

        <div className="hidden h-40 flex-col items-center md:flex" aria-hidden="true">
          <div className="w-px flex-1 bg-gradient-to-b from-transparent to-gold-dim" />
          <SigilIcon className="my-2 h-10 w-10 text-gold-dim" />
          <div className="w-px flex-1 bg-gradient-to-t from-transparent to-gold-dim" />
        </div>

        <dl className="min-w-60 pr-2">
          <dt className="font-display text-[14px] tracking-[0.18em] text-parchment-dim">BUILD HEALTH</dt>
          <dd className="engraved font-display text-[28px] font-semibold text-verdigris">
            {mockBuild.health.toUpperCase()}
          </dd>
          <div className="my-3 h-px bg-gradient-to-r from-gold-dim/60 to-transparent" aria-hidden="true" />
          <dt className="font-display text-[14px] tracking-[0.18em] text-parchment-dim">PRIORITY</dt>
          <dd className="text-[22px] font-medium text-ember">{mockBuild.priority}</dd>
        </dl>
      </div>
    </AtlasFrame>
  );
}

function Dashboard() {
  return (
    <div className="relative isolate min-h-screen overflow-hidden px-2 py-3 sm:px-4">
      <AtlasBackground />
      <div className="film-grain pointer-events-none absolute inset-0 z-30" aria-hidden="true" />
      <AtlasScene />

      <AtlasFrame variant="outer" className="relative z-10 mx-auto max-w-[1320px]">
        <TopNav />

        <div className="flex items-start justify-between pb-10 pt-5 md:min-h-[150px]">
          <Motto align="left" lines={["EXILES", "STUDY", "ADAPT", "CONQUER"]} />
          <Motto align="right" lines={["KNOWLEDGE", "BUILDS", "SURVIVAL"]} />
        </div>

        <main className="flex flex-col gap-4">
          <BuildHeader />

          <AnalysisCard analysis={mockBuild.analysis} />

          <section aria-label="Key stats" className="grid gap-4 md:grid-cols-[1.75fr_1fr_1fr]">
            <ScoreCard score={mockBuild.score} />
            <StatCard title="DPS" value={formatNumber(mockBuild.dps)} icon={<SwordIcon className="h-4 w-4" />} />
            <StatCard title="EHP" value={formatNumber(mockBuild.ehp)} icon={<ShieldIcon className="h-4 w-4" />} />
          </section>

          <div className="mt-4 grid items-stretch gap-x-5 gap-y-10 lg:grid-cols-[1.12fr_1fr]">
            <AtlasFrame className="flex flex-col" contentClassName="flex flex-1 flex-col">
              <AtlasSectionHeader
                title="Critical Issues"
                tone="blood"
                icon={<SkullIcon className="h-7 w-7" />}
              />
              <div className="flex flex-col gap-3">
                {mockBuild.issues.map((issue) => (
                  <IssueCard
                    key={issue.id}
                    title={issue.title}
                    description={issue.description}
                    severity={issue.severity}
                  />
                ))}
              </div>
              <figure className="mt-auto pt-8 text-center">
                <blockquote className="text-[19px] italic text-gold-dim">
                  “A single weakness can undo an empire.”
                </blockquote>
                <figcaption className="mt-1 font-display text-[12px] tracking-[0.24em] text-parchment-faint">
                  — THE ATLAS ARCHIVIST
                </figcaption>
              </figure>
            </AtlasFrame>

            <AtlasFrame>
              <AtlasSectionHeader title="Next Best Upgrade" icon={<AtlasStarIcon className="h-7 w-7" />} />
              <UpgradeCard {...mockBuild.recommendedUpgrade} />
            </AtlasFrame>
          </div>

          <p className="pb-4 pt-14 text-center font-display text-[14px] leading-relaxed tracking-[0.24em] text-parchment-faint md:pb-24">
            SAME BUILDS.
            <br />
            A DEEPER UNDERSTANDING.
          </p>
        </main>
      </AtlasFrame>
    </div>
  );
}

export default Dashboard;
