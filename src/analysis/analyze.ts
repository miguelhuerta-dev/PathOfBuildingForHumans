import rules from "../data/rules/poe1.json";
import type { EngineBuild, Upgrade } from "../types/Engine";
import { formatNumber } from "../utils/formatNumber";
import { extraDamageTaken, signedPercent } from "./numbers";
import { translator, type Translate } from "../i18n";

export type Severity = "high" | "medium" | "low";

export interface Finding {
  id: string;
  severity: Severity;
  title: string;
  /** What happens to the player because of it. */
  impact: string;
  /** What to do about it. */
  remedy: string;
  /** The remedy as a short command, for the dashboard's priority. */
  action: string;
}

export interface Analysis {
  stageLabel: string;
  findings: Finding[];
  score: number;
  health: "Excellent" | "Good" | "Fragile" | "Struggling";
  priority: string;
  verdict: string;
  damage: "strong" | "solid" | "low";
  primaryWeakness: string;
  estimatedGain: string;
  recommendedAction: string;
}

type Stage = (typeof rules.stages)[number];

function stageFor(level: number): Stage {
  return rules.stages.find((stage) => level <= stage.maxLevel) ?? rules.stages[rules.stages.length - 1];
}

const ELEMENTS = [
  { key: "FireResist", missing: "MissingFireResist", overCap: "FireResistOverCap", name: "Fire" },
  { key: "ColdResist", missing: "MissingColdResist", overCap: "ColdResistOverCap", name: "Cold" },
  { key: "LightningResist", missing: "MissingLightningResist", overCap: "LightningResistOverCap", name: "Lightning" },
] as const;

function resistFindings(build: EngineBuild, stage: Stage, t: Translate): Finding[] {
  const findings: Finding[] = [];
  const mapping = stage.elementalResist.warnBelow >= rules.resistCap;

  for (const { key, missing, name } of ELEMENTS) {
    const value = build.stats[key];
    if (value === undefined) continue;
    // The character's own maximum: 75%, or more with Purity auras, passives or items.
    const max = value + Math.max(0, build.stats[missing] ?? rules.resistCap - value);
    const { warnBelow, criticalBelow } = stage.elementalResist;
    // In maps the target is the character's own cap; in the campaign, the stage's floor.
    const target = mapping ? max : warnBelow;
    if (value < target) {
      const extra = extraDamageTaken(value, max);
      const element = t(name.toLowerCase());
      findings.push({
        id: `resist-${name.toLowerCase()}`,
        severity: value < criticalBelow ? "high" : "medium",
        title:
          max !== rules.resistCap
            ? t("{Element} Resistance {value}% of {max}%", { Element: t(name), value, max })
            : t("{Element} Resistance {value}%", { Element: t(name), value }),
        impact:
          extra > 0
            ? t("You take {extra}% more {element} damage than you would at your {max}% maximum.", { extra, element, max })
            : t("{Element} hits land harder than they should.", { Element: t(name) }),
        remedy: t("Add {element} resistance on rings, belt or boots until you reach {target}%.", { element, target: Math.max(target, 0) }),
        action: t("Add {element} resistance", { element }),
      });
    }
  }

  // Capped, but with nothing to spare: Elemental Weakness or a "-max resistance" map drops it below.
  if (mapping && stage.id === "red-maps") {
    const thin = ELEMENTS.filter(({ key, missing, overCap }) => {
      const value = build.stats[key];
      return value !== undefined && (build.stats[missing] ?? 0) <= 0 && (build.stats[overCap] ?? 0) < rules.resistOverCap.warnBelow;
    });
    if (thin.length > 0) {
      const names = thin.map((element) => t(element.name.toLowerCase()));
      findings.push({
        id: "resist-overcap",
        severity: "low",
        title: t("Little resistance to spare"),
        impact: t("Your {elements} resistance has under {over}% over the cap: a curse or a map mod takes you below it.", {
          elements: names.join(", "),
          over: rules.resistOverCap.warnBelow,
        }),
        remedy: t("Aim for 20-30% over the cap on each element, or carry curse immunity."),
        action: t("Overcap your resistances"),
      });
    }
  }

  const chaos = build.stats.ChaosResist;
  const immune = build.keystones.some((k) => rules.chaosImmunityKeystones.includes(k));
  if (stage.chaosResist && chaos !== undefined && !immune && chaos < stage.chaosResist.warnBelow) {
    findings.push({
      id: "resist-chaos",
      severity: chaos < stage.chaosResist.criticalBelow ? "high" : "medium",
      title: t("{Element} Resistance {value}%", { Element: t("Chaos"), value: chaos }),
      impact: t("Chaos damage and poison bypass energy shield and hit you hard."),
      remedy: t("Look for chaos resistance on jewellery or an Amethyst Flask, and aim for at least 0%."),
      action: t("Add chaos resistance"),
    });
  }
  return findings;
}

const HIT_TYPES = ["Physical", "Fire", "Cold", "Lightning", "Chaos"] as const;

function defenceFindings(build: EngineBuild, stage: Stage, t: Translate): Finding[] {
  const findings: Finding[] = [];
  const level = build.character.level ?? 1;
  const chaosImmune = build.keystones.some((k) => rules.chaosImmunityKeystones.includes(k));
  const itemNames = build.items.map((item) => `${item.name} ${item.base ?? ""}`).join(" ");

  // The hit type that would kill you first, when it lags far behind the others.
  if (level >= rules.maxHit.fromLevel) {
    const hits = HIT_TYPES.filter((type) => !(type === "Chaos" && chaosImmune))
      .map((type) => ({ type, value: build.stats[`${type}MaximumHitTaken`] }))
      .filter((hit): hit is { type: (typeof HIT_TYPES)[number]; value: number } => typeof hit.value === "number" && hit.value > 0)
      .sort((a, b) => a.value - b.value);
    if (hits.length >= 3) {
      const weakest = hits[0];
      const typical = hits[Math.floor(hits.length / 2)].value;
      if (weakest.value < typical * rules.maxHit.weakShare) {
        const kind = t(weakest.type.toLowerCase());
        findings.push({
          id: "max-hit",
          severity: weakest.value < (typical * rules.maxHit.weakShare) / 2 ? "high" : "medium",
          title: t("Weak to {kind} hits", { kind }),
          impact: t("The biggest {kind} hit you survive is {weakest}, against about {typical} for other damage.", {
            kind,
            weakest: formatNumber(weakest.value),
            typical: formatNumber(typical),
          }),
          remedy:
            weakest.type === "Physical"
              ? t("Add armour, physical damage reduction or more life.")
              : weakest.type === "Chaos"
                ? t("Add chaos resistance or more life; energy shield does not stop chaos damage.")
                : t("Raise your {kind} resistance and life before anything else.", { kind }),
          action: t("Shore up against {kind} hits", { kind }),
        });
      }
    }
  }

  // Recovery: nothing but flasks keeps you alive through a long fight.
  const regen = build.stats.NetLifeRegen ?? build.stats.LifeRegenRecovery;
  const leech = build.stats.LifeLeechGainRate;
  if (level >= rules.lifeRecovery.fromLevel && !chaosImmune && regen !== undefined && regen <= 0 && !(leech && leech > 0)) {
    findings.push({
      id: "life-recovery",
      severity: "medium",
      title: t("No life recovery"),
      impact: t("Without regeneration or leech, every hit stays with you until you drink a flask."),
      remedy: t("Get life regeneration on the tree or gear, life leech, or a Vitality aura."),
      action: t("Add life recovery"),
    });
  }

  // Freeze stops you dead in maps; a flask "of Heat" is the usual answer.
  const freeze = build.stats.FreezeAvoidChance;
  const inMaps = stage.id === "early-maps" || stage.id === "red-maps";
  if (inMaps && freeze !== undefined && freeze < 100 && !/heat|freeze/i.test(itemNames)) {
    findings.push({
      id: "freeze",
      severity: "low",
      title: t("You can be frozen"),
      impact: t("Frozen, you cannot move or attack while you keep taking hits."),
      remedy: t('Use a flask with the "of Heat" suffix, or get freeze immunity from the tree or gear.'),
      action: t("Get freeze immunity"),
    });
  }

  const ehp = build.stats.TotalEHP;
  if (ehp !== undefined && ehp < stage.ehp.warnBelow) {
    findings.push({
      id: "ehp",
      severity: ehp < stage.ehp.criticalBelow ? "high" : "medium",
      title: t("Low effective HP ({ehp})", { ehp: formatNumber(ehp) }),
      impact: t("Content at this stage can take {amount} or more in a single burst.", { amount: formatNumber(stage.ehp.warnBelow) }),
      remedy: t("Prioritise life, energy shield or armour on your next gear upgrades."),
      action: t("Prioritise life"),
    });
  }

  const suppression = build.stats.SpellSuppressionChance;
  if (suppression !== undefined && suppression >= rules.spellSuppression.investedFrom && suppression < 100) {
    findings.push({
      id: "suppression",
      severity: "low",
      title: t("Spell Suppression {value}%", { value: Math.round(suppression) }),
      impact: t("You invested in suppression but are {short}% short of the cap, so spells still land at full damage sometimes.", {
        short: Math.round(100 - suppression),
      }),
      remedy: t("Cap it at 100% with suppression on boots, gloves or the passive tree."),
      action: t("Cap spell suppression"),
    });
  }
  return findings;
}

function offenceFindings(build: EngineBuild, t: Translate): Finding[] {
  const findings: Finding[] = [];
  const cost = build.stats.ManaCost;
  const mana = build.stats.ManaUnreserved;
  if (cost !== undefined && mana !== undefined && cost > 0 && cost > mana) {
    findings.push({
      id: "mana-cost",
      severity: "high",
      title: t("Not enough mana for {skill}", { skill: build.character.mainSkill ?? t("your main skill") }),
      impact: t("It costs {cost} mana and you have {mana} free after reservations.", { cost: formatNumber(cost), mana: formatNumber(mana) }),
      remedy: t("Reserve less, add mana, or link Inspiration or a cost-reducing support."),
      action: t("Fix your mana"),
    });
  }

  const hit = build.stats.HitChance;
  if (hit !== undefined && hit < rules.hitChance.warnBelow) {
    findings.push({
      id: "hit-chance",
      severity: hit < rules.hitChance.criticalBelow ? "high" : "medium",
      title: t("Chance to Hit {value}%", { value: Math.round(hit) }),
      impact: t("About {miss}% of your attacks miss.", { miss: Math.round(100 - hit) }),
      remedy: t("Add accuracy with Precision, accuracy on gear or the passive tree."),
      action: t("Add accuracy"),
    });
  }

  const level = build.character.level ?? 1;
  const speed = build.stats.EffectiveMovementSpeedMod;
  if (speed !== undefined && level >= rules.movementSpeed.fromLevel && speed < rules.movementSpeed.lowBelow) {
    findings.push({
      id: "movement",
      severity: "low",
      title: t("Movement speed {value}", { value: signedPercent((speed - 1) * 100) }),
      impact: t("Slow movement makes mapping feel sluggish and dodging harder."),
      remedy: t("Get 25-30% movement speed on boots and use a Quicksilver Flask."),
      action: t("Get movement speed"),
    });
  }
  return findings;
}

const SEVERITY_ORDER: Record<Severity, number> = { high: 0, medium: 1, low: 2 };
const SEVERITY_COST: Record<Severity, number> = { high: 2, medium: 1, low: 0.3 };

/** `guideLoaded`: a guide is open, so "no upgrades" means nothing better at this stage, not "no guide". */
export function analyze(build: EngineBuild, upgrades: Upgrade[] = [], guideLoaded = false, t: Translate = translator("en")): Analysis {
  const level = build.character.level ?? 1;
  const stage = stageFor(level);
  const stageLabel = t(stage.label);

  const findings = [...resistFindings(build, stage, t), ...defenceFindings(build, stage, t), ...offenceFindings(build, t)].sort(
    (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity],
  );

  const dps = build.stats.DPS ?? 0;
  const damage = dps >= stage.dps.goodAbove ? "strong" : dps < stage.dps.lowBelow ? "low" : "solid";

  let score = 10 - findings.reduce((total, f) => total + SEVERITY_COST[f.severity], 0);
  if (damage === "low") score -= 1.5;
  if (damage === "strong") score += 0.5;
  score = Math.round(Math.max(1, Math.min(10, score)) * 10) / 10;

  const health = score >= 8 ? "Excellent" : score >= 6 ? "Good" : score >= 4 ? "Fragile" : "Struggling";

  const top = findings[0];
  const bestUpgrade = upgrades[0];

  const who = [build.character.ascendancy && build.character.ascendancy !== "None" ? build.character.ascendancy : build.character.class]
    .filter(Boolean)
    .join("");
  const defence = findings.some((f) => f.severity === "high")
    ? t("the defence has gaps that will get you killed")
    : findings.length
      ? t("the defence holds up with a few soft spots")
      : t("the defence is solid");
  const opening = build.character.mainSkill
    ? t("A level {level} {who} using {skill}.", { level, who, skill: build.character.mainSkill })
    : t("A level {level} {who}.", { level, who });
  const weakness = top ? top.title.replace(/\s[-\d.,%()]+.*$/, "") || top.title : "";
  const verdict =
    `${opening} ${t("For {stage}, damage is {damage} and {defence}.", { stage: stageLabel.toLowerCase(), damage: t(damage), defence })} ` +
    (top ? t("Main weakness: {weakness}.", { weakness }) : t("No critical weaknesses found."));

  const describeGain = (u: Upgrade) => {
    const parts = [];
    if (Math.abs(u.dpsChange) >= 0.5) parts.push(`${u.dpsChange > 0 ? "+" : ""}${Math.round(u.dpsChange)}% DPS`);
    if (Math.abs(u.ehpChange) >= 0.5) parts.push(`${u.ehpChange > 0 ? "+" : ""}${Math.round(u.ehpChange)}% EHP`);
    return parts.join(", ");
  };

  return {
    stageLabel,
    findings,
    score,
    health,
    priority: top ? top.action : t("Keep upgrading"),
    verdict,
    damage,
    primaryWeakness: top ? top.title : t("None found"),
    estimatedGain: bestUpgrade ? describeGain(bestUpgrade) || t("Small") : guideLoaded ? t("Gear on track") : t("Load a guide"),
    recommendedAction: bestUpgrade
      ? t("Replace {slot}", { slot: t(bestUpgrade.slot) })
      : top
        ? top.action
        : guideLoaded
          ? t("Follow your guide's next stage")
          : t("Load a guide"),
  };
}
