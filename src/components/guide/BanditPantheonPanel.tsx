import { useT } from "../../i18n";
import type { ReactNode } from "react";
import { atlasArt } from "../../assets/atlas";
import type { BanditChoice, EngineBuild, PantheonGod } from "../../types/Engine";
import AtlasFrame from "../AtlasFrame";
import AtlasSectionHeader from "../AtlasSectionHeader";
import { ShieldIcon, SkullIcon } from "../icons";

/** The four ways out of the Act 2 bandit quest, as Path of Building names them. */
const BANDIT_OPTIONS: { choice: string; label: string }[] = [
  { choice: "None", label: "Kill all" },
  { choice: "Oak", label: "Oak" },
  { choice: "Kraityn", label: "Kraityn" },
  { choice: "Alira", label: "Alira" },
];

/** Why a guide picks each option, in a sentence. */
const BANDIT_REASON: Record<string, string> = {
  None: "A passive point is worth more to most builds than any single reward, and it never stops being useful.",
  Oak: "Flat life early on, for builds that reach their life passives late.",
  Kraityn: "Movement speed, for builds that need nothing else and want to clear faster.",
  Alira: "Elemental resistances smooth the campaign and leave gear free for life and damage.",
};

/** A panel with a painted scene behind it, faded so the text stays readable. */
function ScenePanel({ image, children }: { image: string; children: ReactNode }) {
  return (
    <AtlasFrame className="h-full" contentClassName="h-full">
      <img
        src={image}
        alt=""
        aria-hidden="true"
        loading="lazy"
        className="pointer-events-none absolute -inset-x-2 -top-6 h-[calc(100%+2rem)] w-[calc(100%+1rem)] object-cover opacity-55 [mask-image:linear-gradient(180deg,black,black_45%,transparent)]"
      />
      <div className="relative">{children}</div>
    </AtlasFrame>
  );
}

function BanditCard({ bandit }: { bandit: BanditChoice }) {
  const t = useT();
  return (
    <ScenePanel image={atlasArt.sceneBandits}>
      <AtlasSectionHeader title="The Bandits" tone="blood" icon={<SkullIcon className="h-7 w-7" />} />
      <p className="text-[15px] text-parchment-dim">{t("Act 2, the bandit lords of the Western Forest.")}</p>
      <ul className="mt-4 grid grid-cols-4 gap-2" aria-label={t("Bandit choices")}>
        {BANDIT_OPTIONS.map((option) => {
          const chosen = option.choice === bandit.choice;
          return (
            <li
              key={option.choice}
              className={`iron-card px-2 py-2 text-center font-display text-[13px] tracking-[0.12em] ${
                chosen ? "iron-card--main text-gold" : "text-parchment-faint"
              }`}
              aria-current={chosen ? "true" : undefined}
            >
              {t(option.label).toUpperCase()}
            </li>
          );
        })}
      </ul>
      <p className="mt-5 font-display text-[24px] text-parchment">{t(bandit.label)}</p>
      <p className="text-[18px] text-gold">{bandit.reward}</p>
      <p className="mt-2 text-[16px] leading-relaxed text-parchment-dim">{t(BANDIT_REASON[bandit.choice])}</p>
    </ScenePanel>
  );
}

function GodCard({ god, kind }: { god: PantheonGod; kind: string }) {
  const t = useT();
  const [base, ...upgrades] = god.souls;
  return (
    <div className="iron-card px-4 py-3">
      <p className="font-display text-[12px] tracking-[0.2em] text-parchment-faint">{t(kind)}</p>
      <p className="font-display text-[21px] text-parchment">{god.name}</p>
      {base && (
        <ul className="mt-1 text-[15px] leading-snug text-gold">
          {base.lines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      )}
      {upgrades.length > 0 && (
        <ul className="mt-3 flex flex-col gap-2 border-t border-[#2a201c] pt-2">
          {upgrades.map((soul) => (
            <li key={soul.name} className="text-[14px] leading-snug">
              <span className="block font-display text-[12px] tracking-[0.12em] text-[#c9645a]">
                {t("CAPTURE")} {soul.name.toUpperCase()}
              </span>
              {soul.lines.map((line) => (
                <span key={line} className="block text-parchment-dim">
                  {line}
                </span>
              ))}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PantheonCard({ major, minor }: { major?: PantheonGod; minor?: PantheonGod }) {
  const t = useT();
  return (
    <ScenePanel image={atlasArt.scenePantheon}>
      <AtlasSectionHeader title="The Pantheon" icon={<ShieldIcon className="h-6 w-6" />} />
      <p className="text-[15px] text-parchment-dim">
        {t("Unlocked in Acts 6 to 9; captured map bosses' souls (with a Divine Vessel) upgrade each god.")}
      </p>
      <div className="mt-4 grid gap-3">
        {major && <GodCard god={major} kind="MAJOR GOD" />}
        {minor && <GodCard god={minor} kind="MINOR GOD" />}
      </div>
    </ScenePanel>
  );
}

/** The guide's bandit choice and Pantheon powers, side by side. */
function BanditPantheonPanel({ guide }: { guide: EngineBuild }) {
  const { bandit, pantheon } = guide;
  if (!bandit && !pantheon?.major && !pantheon?.minor) return null;
  return (
    <div className="grid items-stretch gap-6 lg:grid-cols-2">
      {bandit && <BanditCard bandit={bandit} />}
      {(pantheon?.major || pantheon?.minor) && <PantheonCard major={pantheon.major} minor={pantheon.minor} />}
    </div>
  );
}

export default BanditPantheonPanel;
