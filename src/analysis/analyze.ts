import rules from "../data/rules/poe1.json";
import type { EngineBuild, Upgrade } from "../types/Engine";
import { formatNumber } from "../utils/formatNumber";
import { extraDamageTaken, signedPercent } from "./numbers";

export type Severity = "high" | "medium" | "low";

export interface Finding {
  id: string;
  severity: Severity;
  title: string;
  /** What happens to the player because of it. */
  impact: string;
  /** What to do about it. */
  remedy: string;
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

function resistFindings(build: EngineBuild, stage: Stage): Finding[] {
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
      findings.push({
        id: `resist-${name.toLowerCase()}`,
        severity: value < criticalBelow ? "high" : "medium",
        title: `${name} Resistance ${value}%` + (max !== rules.resistCap ? ` of ${max}%` : ""),
        impact:
          extra > 0
            ? `You take ${extra}% more ${name.toLowerCase()} damage than you would at your ${max}% maximum.`
            : `${name} hits land harder than they should.`,
        remedy: `Add ${name.toLowerCase()} resistance on rings, belt or boots until you reach ${Math.max(target, 0)}%.`,
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
      const names = thin.map((element) => element.name.toLowerCase());
      findings.push({
        id: "resist-overcap",
        severity: "low",
        title: "Little resistance to spare",
        impact: `Your ${names.join(", ")} resistance has under ${rules.resistOverCap.warnBelow}% over the cap: a curse or a map mod takes you below it.`,
        remedy: "Aim for 20-30% over the cap on each element, or carry curse immunity.",
      });
    }
  }

  const chaos = build.stats.ChaosResist;
  const immune = build.keystones.some((k) => rules.chaosImmunityKeystones.includes(k));
  if (stage.chaosResist && chaos !== undefined && !immune && chaos < stage.chaosResist.warnBelow) {
    findings.push({
      id: "resist-chaos",
      severity: chaos < stage.chaosResist.criticalBelow ? "high" : "medium",
      title: `Chaos Resistance ${chaos}%`,
      impact: "Chaos damage and poison bypass energy shield and hit you hard.",
      remedy: "Look for chaos resistance on jewellery or an Amethyst Flask, and aim for at least 0%.",
    });
  }
  return findings;
}

const HIT_TYPES = ["Physical", "Fire", "Cold", "Lightning", "Chaos"] as const;

function defenceFindings(build: EngineBuild, stage: Stage): Finding[] {
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
        const kind = weakest.type.toLowerCase();
        findings.push({
          id: "max-hit",
          severity: weakest.value < (typical * rules.maxHit.weakShare) / 2 ? "high" : "medium",
          title: `Weak to ${kind} hits`,
          impact: `The biggest ${kind} hit you survive is ${formatNumber(weakest.value)}, against about ${formatNumber(typical)} for other damage.`,
          remedy:
            weakest.type === "Physical"
              ? "Add armour, physical damage reduction or more life."
              : weakest.type === "Chaos"
                ? "Add chaos resistance or more life; energy shield does not stop chaos damage."
                : `Raise your ${kind} resistance and life before anything else.`,
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
      title: "No life recovery",
      impact: "Without regeneration or leech, every hit stays with you until you drink a flask.",
      remedy: "Get life regeneration on the tree or gear, life leech, or a Vitality aura.",
    });
  }

  // Freeze stops you dead in maps; a flask "of Heat" is the usual answer.
  const freeze = build.stats.FreezeAvoidChance;
  const inMaps = stage.id === "early-maps" || stage.id === "red-maps";
  if (inMaps && freeze !== undefined && freeze < 100 && !/heat|freeze/i.test(itemNames)) {
    findings.push({
      id: "freeze",
      severity: "low",
      title: "You can be frozen",
      impact: "Frozen, you cannot move or attack while you keep taking hits.",
      remedy: 'Use a flask with the "of Heat" suffix, or get freeze immunity from the tree or gear.',
    });
  }

  const ehp = build.stats.TotalEHP;
  if (ehp !== undefined && ehp < stage.ehp.warnBelow) {
    findings.push({
      id: "ehp",
      severity: ehp < stage.ehp.criticalBelow ? "high" : "medium",
      title: `Low effective HP (${formatNumber(ehp)})`,
      impact: `Content at this stage can take ${formatNumber(stage.ehp.warnBelow)} or more in a single burst.`,
      remedy: "Prioritise life, energy shield or armour on your next gear upgrades.",
    });
  }

  const suppression = build.stats.SpellSuppressionChance;
  if (suppression !== undefined && suppression >= rules.spellSuppression.investedFrom && suppression < 100) {
    findings.push({
      id: "suppression",
      severity: "low",
      title: `Spell Suppression ${Math.round(suppression)}%`,
      impact: `You invested in suppression but are ${Math.round(100 - suppression)}% short of the cap, so spells still land at full damage sometimes.`,
      remedy: "Cap it at 100% with suppression on boots, gloves or the passive tree.",
    });
  }
  return findings;
}

function offenceFindings(build: EngineBuild): Finding[] {
  const findings: Finding[] = [];
  const cost = build.stats.ManaCost;
  const mana = build.stats.ManaUnreserved;
  if (cost !== undefined && mana !== undefined && cost > 0 && cost > mana) {
    findings.push({
      id: "mana-cost",
      severity: "high",
      title: `Not enough mana for ${build.character.mainSkill ?? "your main skill"}`,
      impact: `It costs ${formatNumber(cost)} mana and you have ${formatNumber(mana)} free after reservations.`,
      remedy: "Reserve less, add mana, or link Inspiration or a cost-reducing support.",
    });
  }

  const hit = build.stats.HitChance;
  if (hit !== undefined && hit < rules.hitChance.warnBelow) {
    findings.push({
      id: "hit-chance",
      severity: hit < rules.hitChance.criticalBelow ? "high" : "medium",
      title: `Chance to Hit ${Math.round(hit)}%`,
      impact: `About ${Math.round(100 - hit)}% of your attacks miss.`,
      remedy: "Add accuracy with Precision, accuracy on gear or the passive tree.",
    });
  }

  const level = build.character.level ?? 1;
  const speed = build.stats.EffectiveMovementSpeedMod;
  if (speed !== undefined && level >= rules.movementSpeed.fromLevel && speed < rules.movementSpeed.lowBelow) {
    findings.push({
      id: "movement",
      severity: "low",
      title: `Movement speed ${signedPercent((speed - 1) * 100)}`,
      impact: "Slow movement makes mapping feel sluggish and dodging harder.",
      remedy: "Get 25-30% movement speed on boots and use a Quicksilver Flask.",
    });
  }
  return findings;
}

const SEVERITY_ORDER: Record<Severity, number> = { high: 0, medium: 1, low: 2 };
const SEVERITY_COST: Record<Severity, number> = { high: 2, medium: 1, low: 0.3 };

export function analyze(build: EngineBuild, upgrades: Upgrade[] = []): Analysis {
  const level = build.character.level ?? 1;
  const stage = stageFor(level);

  const findings = [...resistFindings(build, stage), ...defenceFindings(build, stage), ...offenceFindings(build)].sort(
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
  const skill = build.character.mainSkill ? ` using ${build.character.mainSkill}` : "";
  const defenceWord = findings.some((f) => f.severity === "high") ? "has gaps that will get you killed" : findings.length ? "holds up with a few soft spots" : "is solid";
  const verdict =
    `A level ${level} ${who}${skill}. For ${stage.label.toLowerCase()}, damage is ${damage} and the defence ${defenceWord}.` +
    (top ? ` Main weakness: ${top.title.replace(/\s[-\d.,%()]+.*$/, "") || top.title}.` : " No critical weaknesses found.");

  const describeGain = (u: Upgrade) => {
    const parts = [];
    if (Math.abs(u.dpsChange) >= 0.5) parts.push(`${u.dpsChange > 0 ? "+" : ""}${Math.round(u.dpsChange)}% DPS`);
    if (Math.abs(u.ehpChange) >= 0.5) parts.push(`${u.ehpChange > 0 ? "+" : ""}${Math.round(u.ehpChange)}% EHP`);
    return parts.join(", ");
  };

  return {
    stageLabel: stage.label,
    findings,
    score,
    health,
    priority: top ? top.remedy.split(",")[0].split(" until")[0] : "Keep upgrading",
    verdict,
    damage,
    primaryWeakness: top ? top.title : "None found",
    estimatedGain: bestUpgrade ? describeGain(bestUpgrade) || "Small" : "Load a guide",
    recommendedAction: bestUpgrade ? `Replace ${bestUpgrade.slot}` : top ? top.remedy.split(",")[0] : "Load a guide",
  };
}
