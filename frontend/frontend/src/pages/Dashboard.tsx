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
import Medallion from "../components/Medallion";
import { AtlasStarIcon, ShieldIcon, SigilIcon, SkullIcon, SwordIcon } from "../components/icons";

const navLinks = ["Builds", "Analyze", "Atlas", "Guides", "About"];

function TopNav() {
  return (
    <header className="relative z-20 border-b border-gold-dim/50 bg-[linear-gradient(180deg,rgba(20,16,12,0.95),rgba(10,8,6,0.9))] shadow-[0_6px_20px_rgba(0,0,0,0.7)]">
      <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-x-8 gap-y-2 px-6 py-3">
        <a href="#" className="gold-text font-display text-[19px] tracking-[0.08em]">
          Path of Building for Humans
        </a>

        <nav aria-label="Main" className="flex flex-wrap items-center gap-x-9 gap-y-1">
          {navLinks.map((link) => (
            <a
              key={link}
              href="#"
              className="font-display text-[14px] tracking-[0.2em] text-parchment-dim transition-colors hover:text-gold"
            >
              {link.toUpperCase()}
            </a>
          ))}
          <Medallion size={44}>
            <AtlasStarIcon className="h-5 w-5" />
          </Medallion>
        </nav>
      </div>
    </header>
  );
}

function SideMotto({ lines, side }: { lines: string[]; side: "left" | "right" }) {
  return (
    <p
      className={`pointer-events-none absolute top-10 z-10 hidden font-display text-[12px] leading-relaxed tracking-[0.22em] text-parchment-faint 2xl:block ${
        side === "left" ? "left-10 text-left" : "right-10 text-right"
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
      <div className="grid items-center gap-6 md:grid-cols-[auto_1fr_auto_auto]">
        <img
          src={atlasArt.portraitInquisitor}
          alt={`${mockBuild.ascendancy} portrait`}
          className="-my-6 -ml-4 hidden h-52 w-52 object-cover [mask-image:radial-gradient(ellipse_75%_80%_at_45%_45%,black_55%,transparent_100%)] md:block"
        />

        <div>
          <h1 className="gold-text font-display text-[clamp(34px,4.4vw,54px)] font-semibold leading-tight lg:whitespace-nowrap">
            {mockBuild.name}
          </h1>
          <p className="mt-1 font-display text-[17px] tracking-[0.16em] text-parchment-dim">
            {mockBuild.ascendancy.toUpperCase()} • LEVEL {mockBuild.level}
          </p>
          <p className="mt-3 max-w-xs text-[18px] italic leading-snug text-gold-dim">
            “{mockBuild.quote}”
          </p>
        </div>

        <div className="hidden h-36 flex-col items-center md:flex" aria-hidden="true">
          <div className="w-px flex-1 bg-gradient-to-b from-transparent to-gold-dim" />
          <SigilIcon className="my-2 h-9 w-9 text-gold-dim" />
          <div className="w-px flex-1 bg-gradient-to-t from-transparent to-gold-dim" />
        </div>

        <dl className="min-w-56 pr-4">
          <dt className="font-display text-[14px] tracking-[0.18em] text-parchment-dim">BUILD HEALTH</dt>
          <dd className="engraved font-display text-[26px] text-verdigris">{mockBuild.health.toUpperCase()}</dd>
          <div className="my-3 h-px bg-gradient-to-r from-gold-dim/60 to-transparent" aria-hidden="true" />
          <dt className="font-display text-[14px] tracking-[0.18em] text-parchment-dim">PRIORITY</dt>
          <dd className="text-[21px] text-ember">{mockBuild.priority}</dd>
        </dl>
      </div>
    </AtlasFrame>
  );
}

function Dashboard() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <AtlasBackground />
      <TopNav />

      <div className="relative">
        <AtlasScene />
        <SideMotto side="left" lines={["EXILES", "STUDY", "ADAPT", "CONQUER"]} />
        <SideMotto side="right" lines={["KNOWLEDGE", "BUILDS", "SURVIVAL"]} />

        <main className="relative z-10 mx-auto flex max-w-[1120px] flex-col gap-7 px-4 pb-10 pt-16 sm:px-6 md:pt-40">
          <BuildHeader />

          <AnalysisCard analysis={mockBuild.analysis} />

          <section aria-label="Key stats" className="grid gap-5 md:grid-cols-[1.7fr_1fr_1fr]">
            <ScoreCard score={mockBuild.score} />
            <StatCard title="DPS" value={formatNumber(mockBuild.dps)} icon={<SwordIcon className="h-7 w-7" />} />
            <StatCard title="EHP" value={formatNumber(mockBuild.ehp)} icon={<ShieldIcon className="h-7 w-7" />} />
          </section>

          <div className="grid items-start gap-6 lg:grid-cols-[1.15fr_1fr]">
            <AtlasFrame>
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
              <figure className="mt-8 text-center">
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

          <p className="py-10 text-center font-display text-[14px] leading-relaxed tracking-[0.24em] text-parchment-faint">
            SAME BUILDS.
            <br />
            A DEEPER UNDERSTANDING.
          </p>
        </main>
      </div>
    </div>
  );
}

export default Dashboard;
