import { useCallback, useEffect, useState, type ReactNode } from "react";
import { atlasArt } from "../assets/atlas";
import { useT } from "../i18n";
import { desktop, isDesktopApp } from "../lib/desktop";
import { readSetting, writeSetting } from "../lib/settings";
import AtlasFrame from "./AtlasFrame";
import { AtlasStarIcon, QuillIcon, ShieldIcon, SigilIcon, SwordIcon, WarningIcon } from "./icons";

const STORAGE = "pobh.tutorial";

/** True once the player finished or skipped the tutorial. */
export function tutorialSeen(): boolean {
  return readSetting(STORAGE) === "done";
}

interface Step {
  title: string;
  scene: string;
  points: string[];
  /** A small drawing of the screen the step talks about. */
  sketch?: () => ReactNode;
  note?: string;
  /** The step's own button, when it has something to open. */
  action?: "privacy";
}

/* ---------- Sketches: the app's controls drawn small, so each step shows where to look. ---------- */

function SketchConnect() {
  const t = useT();
  return (
    <div className="iron-card flex flex-col gap-2 px-4 py-3">
      <span className="font-display text-[11px] tracking-[0.18em] text-parchment-dim">{t("ACCOUNT NAME")}</span>
      <span className="border border-gold/70 bg-black/60 px-3 py-1.5 text-[16px] text-parchment">
        Exile<span className="text-gold">#1234</span>
        <span className="tutorial-caret ml-0.5 inline-block h-4 w-px translate-y-0.5 bg-gold" aria-hidden="true" />
      </span>
      <span className="ui-button grid h-9 place-items-center font-display text-[12px] tracking-[0.2em] text-parchment">
        {t("CONNECT")}
      </span>
    </div>
  );
}

function SketchPrivacy() {
  const t = useT();
  return (
    <div className="iron-card flex flex-col gap-2 px-4 py-3">
      <span className="font-display text-[11px] tracking-[0.18em] text-parchment-dim">{t("MY ACCOUNT · PRIVACY SETTINGS")}</span>
      <span className="flex items-center gap-3 text-[15px] text-parchment">
        <span aria-hidden="true" className="h-4 w-4 shrink-0 border border-verdigris bg-black/60" />
        {t("Hide my characters")}
        <span className="ml-auto font-display text-[11px] tracking-[0.16em] text-verdigris">{t("UNTICKED")}</span>
      </span>
      <span className="text-[13px] text-parchment-faint">{t("Characters tab: visible to everyone")}</span>
    </div>
  );
}

function SketchKept() {
  const t = useT();
  const items = [
    { icon: <SwordIcon className="h-4 w-4" />, text: "Last character of each account" },
    { icon: <SigilIcon className="h-4 w-4" />, text: "DPS, EHP and level over the league" },
    { icon: <QuillIcon className="h-4 w-4" />, text: "Your guide library" },
    { icon: <AtlasStarIcon className="h-4 w-4" />, text: "Atlas marks per league" },
  ];
  return (
    <ul className="iron-card flex flex-col gap-2 px-4 py-3">
      {items.map((item) => (
        <li key={item.text} className="flex items-center gap-3 text-[15px] text-parchment">
          <span className="text-gold" aria-hidden="true">{item.icon}</span>
          {t(item.text)}
        </li>
      ))}
    </ul>
  );
}

function SketchGuide() {
  const t = useT();
  return (
    <div className="iron-card flex flex-col gap-2 px-4 py-3">
      <span className="font-display text-[11px] tracking-[0.18em] text-parchment-dim">{t("PATH OF BUILDING CODE OR LINK")}</span>
      <span className="truncate border border-gold/70 bg-black/60 px-3 py-1.5 font-mono text-[13px] text-parchment-dim">
        https://pobb.in/…
      </span>
      <div className="flex flex-wrap gap-1.5">
        {["pobb.in", "Maxroll", "poe.ninja", "pastebin", "pob.codes"].map((site) => (
          <span key={site} className="border border-gold-dim/50 px-2 py-0.5 text-[12px] text-parchment-faint">{site}</span>
        ))}
      </div>
    </div>
  );
}

function SketchBuild() {
  const t = useT();
  const lines = [
    { text: "+92 to maximum Life", tone: "text-[#e9b49a]", kind: "Prefix" },
    { text: "+41% to Fire Resistance", tone: "text-[#9fd6c2]", kind: "Suffix" },
    { text: "+1 to Level of all Minion Skill Gems", tone: "text-[#c7c2ff]", kind: "Crafted" },
  ];
  return (
    <div className="iron-card flex flex-col gap-1.5 px-4 py-3">
      {lines.map((line) => (
        <span key={line.text} className="flex items-baseline justify-between gap-3 text-[14px]">
          <span className={line.tone}>{line.text}</span>
          <span className="shrink-0 font-display text-[10px] tracking-[0.16em] text-parchment-faint">{t(line.kind).toUpperCase()}</span>
        </span>
      ))}
      <span className="mt-1 flex gap-3 border-t border-gold-dim/30 pt-2 text-[13px]">
        <span className="text-[#d9773a]">DPS +12.4%</span>
        <span className="text-[#2aa478]">EHP +3.1%</span>
      </span>
    </div>
  );
}

const STEPS: Step[] = [
  {
    title: "Welcome, exile",
    scene: atlasArt.sceneBooks,
    points: [
      "This archive reads your character with Path of Building's own calculations and tells you, plainly, how strong you are, what is holding you back and what to upgrade next.",
      "A few short pages and you are in. You can come back to them any time from About.",
    ],
  },
  {
    title: "Connect your character",
    scene: atlasArt.sceneCandles,
    points: [
      "On the Character page, write your Path of Exile account name with its #1234 tag at the end.",
      "Pick a character from the list. The first reading takes a few seconds; after that it opens at once.",
      "Choose your game's Client.txt to see the game's own item and passive icons and follow your zone in the campaign.",
    ],
    sketch: SketchConnect,
  },
  {
    title: "Your profile must be public",
    scene: atlasArt.scenePillar,
    points: [
      "Path of Exile only shares characters you make public. On pathofexile.com open My Account, then Privacy Settings, and untick the option that hides your characters.",
      "The archive reads only what anyone can see on your public profile. It never asks for your password.",
    ],
    sketch: SketchPrivacy,
    action: "privacy",
  },
  {
    title: "What the archive keeps",
    scene: atlasArt.sceneParchmentMap,
    points: [
      "The last character you opened on each account, shown instantly while fresh numbers load.",
      "Every change in DPS, life and level, to chart your progress over the league.",
      "Your guide library, the guide you follow, your Atlas marks and your language.",
    ],
    sketch: SketchKept,
    note: "Everything stays on this computer. The archive only reads public data from pathofexile.com and market prices from poe.ninja.",
  },
  {
    title: "Follow a guide",
    scene: atlasArt.sceneAstrolabe,
    points: [
      "On the Guide page, paste a Path of Building code or a link from the guide's site.",
      "The stage is picked from your level: gear, gem links, passives, ascendancy, bandits and pantheon for that point of the game, compared with yours.",
      "On Maxroll, open the guide's Path of Building section and press Copy, then paste the code here.",
    ],
    sketch: SketchGuide,
  },
  {
    title: "Read your build",
    scene: atlasArt.sceneCoins,
    points: [
      "The Atlas Rating and the Scholar's Verdict say where your build stands; the Threat Register lists its problems, worst first, with how to fix each one.",
      "Click any equipped item to read its modifiers, coloured by kind. Open it in the Forge to measure what each modifier would add to your DPS and EHP, and how to craft it.",
      "Best Next Passives and Progress show the strongest points to take and how far you have come.",
    ],
    sketch: SketchBuild,
  },
];

const STEP_ICONS = [QuillIcon, SwordIcon, ShieldIcon, SigilIcon, AtlasStarIcon, WarningIcon];

interface TutorialProps {
  /** Called when the player finishes or skips; the tutorial is then remembered as seen. */
  onClose: () => void;
}

/**
 * The visual tour after the language is chosen: how to connect a character,
 * why the profile must be public, what is kept, and how to read a guide and a build.
 */
function Tutorial({ onClose }: TutorialProps) {
  const t = useT();
  const [index, setIndex] = useState(0);
  const step = STEPS[index];
  const last = index === STEPS.length - 1;
  const Icon = STEP_ICONS[index];

  const close = useCallback(() => {
    writeSetting(STORAGE, "done");
    onClose();
  }, [onClose]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      if (event.key === "ArrowRight") setIndex((i) => Math.min(i + 1, STEPS.length - 1));
      if (event.key === "ArrowLeft") setIndex((i) => Math.max(i - 1, 0));
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  return (
    <AtlasFrame className="reveal" contentClassName="overflow-hidden">
      <section aria-roledescription={t("tutorial")} aria-label={t("How the archive works")}>
        <header className="flex items-center justify-between gap-4">
          <p className="font-display text-[13px] tracking-[0.3em] text-gold-dim">{t("HOW THE ARCHIVE WORKS")}</p>
          <button type="button" onClick={close} className="font-display text-[12px] tracking-[0.2em] text-parchment-faint hover:text-gold">
            {t("SKIP")}
          </button>
        </header>

        {/* One page at a time; the key replays the rise-in animation on every page turn. */}
        <div key={index} className="reveal mt-4 grid items-center gap-8 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <div className="relative grid min-h-[300px] place-items-center">
            <img
              src={step.scene}
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-60 [mask-image:radial-gradient(closest-side,black_55%,transparent)]"
            />
            <div className="relative flex w-full max-w-sm flex-col items-center gap-5">
              <span className="grid h-20 w-20 place-items-center rounded-full border border-gold-dim/70 bg-black/70 text-gold shadow-[0_0_24px_rgba(160,30,20,0.45)]">
                {index === 0 ? (
                  <img src={atlasArt.emblem} alt="" className="h-16 w-auto" />
                ) : (
                  <Icon className="h-9 w-9" />
                )}
              </span>
              {step.sketch && <div className="w-full">{step.sketch()}</div>}
            </div>
          </div>

          <div>
            <p className="font-display text-[13px] tracking-[0.24em] text-parchment-faint">
              {t("STEP {n} OF {total}", { n: index + 1, total: STEPS.length })}
            </p>
            <h2 className="title-text mt-1 font-display text-[32px] leading-tight tracking-[0.04em]">{t(step.title)}</h2>
            <ul className="mt-4 flex flex-col gap-3">
              {step.points.map((point) => (
                <li key={point} className="flex gap-3 text-[18px] leading-relaxed text-parchment/90">
                  <span aria-hidden="true" className="mt-[11px] h-1.5 w-1.5 shrink-0 rotate-45 bg-gold" />
                  {t(point)}
                </li>
              ))}
            </ul>
            {step.note && <p className="mt-4 border-l-2 border-verdigris/70 pl-3 text-[16px] text-parchment-dim">{t(step.note)}</p>}
            {step.action === "privacy" && isDesktopApp && (
              <button
                type="button"
                onClick={() => void desktop.openPrivacySettings()}
                className="mt-5 border border-gold-dim/60 px-4 py-2 font-display text-[13px] tracking-[0.18em] text-parchment-dim hover:text-gold"
              >
                {t("OPEN PRIVACY SETTINGS")}
              </button>
            )}
          </div>
        </div>

        <footer className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-gold-dim/25 pt-5">
          <ol className="flex items-center gap-2 px-1" aria-label={t("Pages")}>
            {STEPS.map((item, i) => (
              <li key={item.title}>
                <button
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={t(item.title)}
                  aria-current={i === index ? "step" : undefined}
                  className={`block h-2.5 rotate-45 border transition-all ${
                    i === index ? "w-2.5 border-gold bg-gold shadow-[0_0_8px_#f2dfa8aa]" : i < index ? "w-2.5 border-gold-dim bg-gold-dim/60" : "w-2.5 border-gold-dim/60 bg-transparent"
                  }`}
                />
              </li>
            ))}
          </ol>
          <div className="flex gap-3">
            {index > 0 && (
              <button
                type="button"
                onClick={() => setIndex(index - 1)}
                className="border border-gold-dim/60 px-5 py-2 font-display text-[13px] tracking-[0.18em] text-parchment-dim hover:text-gold"
              >
                {t("BACK")}
              </button>
            )}
            <button
              type="button"
              onClick={() => (last ? close() : setIndex(index + 1))}
              className="ui-button h-11 min-w-44 px-8 font-display text-[14px] tracking-[0.2em] text-parchment transition hover:brightness-125"
            >
              {last ? t("ENTER THE ARCHIVE") : t("NEXT")}
            </button>
          </div>
        </footer>
      </section>
    </AtlasFrame>
  );
}

export default Tutorial;
