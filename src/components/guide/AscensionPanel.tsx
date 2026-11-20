import { useT } from "../../i18n";
import { atlasArt } from "../../assets/atlas";
import { usePassiveIcons } from "../../state/usePassiveIcons";
import type { AscendancyStep, EngineBuild } from "../../types/Engine";
import AtlasFrame from "../AtlasFrame";
import AtlasSectionHeader from "../AtlasSectionHeader";
import { AtlasStarIcon } from "../icons";

/**
 * The order the guide takes its ascendancy passives in, one Labyrinth at a
 * time, with each passive's own icon from the player's game.
 */

/** When each Labyrinth is usually run; a guide, not a rule. */
const LAB_LEVEL = ["around level 33", "around level 55", "around level 68", "level 75 and up"];

const ICON_PREFIX = "Art/2DArt/SkillIcons/passives/";
const iconKey = (path?: string) =>
  path?.startsWith(ICON_PREFIX) && path.endsWith(".png") ? path.slice(ICON_PREFIX.length, -".png".length) : undefined;

function PassiveMedal({ step, icon, owned }: { step: AscendancyStep; icon?: string; owned?: boolean }) {
  return (
    <span
      className={`ascend-medal ${step.notable ? "ascend-medal--notable" : ""} ${owned ? "ascend-medal--owned" : ""}`}
      title={[step.name, ...(step.stats ?? [])].join("\n")}
    >
      {icon ? <img src={icon} alt="" className="h-full w-full rounded-full object-cover" /> : <AtlasStarIcon className="h-1/2 w-1/2 text-parchment-dim" />}
    </span>
  );
}

function AscensionPanel({
  guide,
  owned,
  clientLog,
}: {
  guide: EngineBuild;
  /** Passive ids the character has, when one is connected. */
  owned?: ReadonlySet<number>;
  clientLog: string | null;
}) {
  const t = useT();
  const plan = guide.ascendancyPlan ?? [];
  const keys = plan.flatMap((step) => iconKey(step.icon) ?? []);
  const { icons } = usePassiveIcons(keys, clientLog);
  if (plan.length === 0) return null;

  const labs = [1, 2, 3, 4].map((lab) => plan.filter((step) => step.lab === lab)).filter((steps) => steps.length > 0);
  const iconOf = (step: AscendancyStep) => {
    const key = iconKey(step.icon);
    return key ? icons[key] : undefined;
  };

  return (
    <AtlasFrame>
      <AtlasSectionHeader title="Ascension Path" icon={<AtlasStarIcon className="h-7 w-7" />} />
      <p className="mb-5 text-[16px] text-parchment-dim">
        {t("{ascendancy} passives in the order the guide takes them, Labyrinth by Labyrinth.", { ascendancy: guide.character.ascendancy ?? t("Ascendancy") })}
      </p>

      <div className="relative">
        {/* The iron chain the Labyrinths hang on. */}
        <div
          aria-hidden="true"
          className="absolute inset-x-6 top-[3.25rem] hidden h-6 bg-repeat-x opacity-80 [filter:saturate(0.15)_brightness(0.8)] md:block"
          style={{ backgroundImage: `url(${atlasArt.chain})`, backgroundSize: "auto 100%" }}
        />
        <ol className="relative grid gap-5 md:grid-cols-4">
          {labs.map((steps, index) => {
            const notables = steps.filter((step) => step.notable);
            const minor = steps.filter((step) => !step.notable);
            return (
              <li key={steps[0].labName} className="flex flex-col items-center text-center">
                <span className="font-display text-[12px] tracking-[0.2em] text-parchment-faint">{t("STEP {n}", { n: index + 1 })}</span>
                <span className="mt-1 grid min-h-20 place-items-center gap-1">
                  <span className="flex flex-wrap justify-center gap-2">
                    {notables.map((step) => (
                      <PassiveMedal key={step.id} step={step} icon={iconOf(step)} owned={owned?.has(step.id)} />
                    ))}
                  </span>
                </span>
                <span className="mt-2 font-display text-[15px] tracking-[0.08em] text-gold">{t(steps[0].labName)}</span>
                <span className="text-[13px] text-parchment-faint">{t(LAB_LEVEL[steps[0].lab - 1])}</span>
                {notables.map((step) => (
                  <span key={step.id} className="mt-2 block">
                    <span className={`block text-[16px] ${owned?.has(step.id) ? "text-gold" : "text-parchment"}`}>{step.name}</span>
                    {(step.stats ?? []).slice(0, 3).map((line) => (
                      <span key={line} className="block text-[13px] leading-snug text-parchment-dim">
                        {line}
                      </span>
                    ))}
                  </span>
                ))}
                {minor.length > 0 && (
                  <span className="mt-3 flex flex-wrap justify-center gap-1.5" aria-label={t("Minor passives on the way")}>
                    {minor.map((step) => (
                      <PassiveMedal key={step.id} step={step} icon={iconOf(step)} owned={owned?.has(step.id)} />
                    ))}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </AtlasFrame>
  );
}

export default AscensionPanel;
