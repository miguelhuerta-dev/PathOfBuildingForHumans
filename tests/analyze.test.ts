import assert from "node:assert/strict";
import { test } from "node:test";
import { analyze } from "../src/analysis/analyze.ts";
import rules from "../src/data/rules/poe1.json" with { type: "json" };
import { translator } from "../src/i18n/translate.ts";
import type { EngineBuild } from "../src/types/Engine.ts";

/** A level 90 character with nothing wrong, for the rules to find faults in one stat at a time. */
function build(stats: Record<string, number> = {}, character: EngineBuild["character"] = {}, keystones: string[] = []): EngineBuild {
  return {
    character: { name: "Test", class: "Witch", ascendancy: "Necromancer", level: 90, mainSkill: "Arc", ...character },
    keystones,
    items: [],
    skills: [],
    stats: {
      FireResist: 75, ColdResist: 75, LightningResist: 75, ChaosResist: 20,
      FireResistOverCap: 30, ColdResistOverCap: 30, LightningResistOverCap: 30,
      TotalEHP: 40000, DPS: 3_000_000, NetLifeRegen: 300, FreezeAvoidChance: 100,
      PhysicalMaximumHitTaken: 9000, FireMaximumHitTaken: 10000, ColdMaximumHitTaken: 10000,
      LightningMaximumHitTaken: 10000, ChaosMaximumHitTaken: 9000,
      ...stats,
    },
  };
}

const ids = (b: EngineBuild) => analyze(b).findings.map((finding) => finding.id);

test("a healthy endgame character has no findings and a high score", () => {
  const result = analyze(build());
  assert.deepEqual(result.findings, []);
  assert.equal(result.health, "Excellent");
  assert.equal(result.damage, "strong");
  assert.equal(result.stageLabel, "Red maps and bosses");
});

test("stages follow the rules file", () => {
  for (const stage of rules.stages) {
    assert.equal(analyze(build({}, { level: stage.maxLevel })).stageLabel, stage.label);
  }
  // Above the last stage's maxLevel, the last stage still applies.
  assert.equal(analyze(build({}, { level: 100 })).stageLabel, rules.stages.at(-1)!.label);
});

test("uncapped elemental resistance in maps is found, and badly uncapped is high", () => {
  const result = analyze(build({ FireResist: 72 }));
  const fire = result.findings.find((f) => f.id === "resist-fire");
  assert.equal(fire?.severity, "medium");
  assert.equal(analyze(build({ ColdResist: 50 })).findings.find((f) => f.id === "resist-cold")?.severity, "high");
});

test("a raised resistance cap is the target, not 75%", () => {
  // 78% of a possible 80% (Purity of Fire): still short.
  const result = analyze(build({ FireResist: 78, MissingFireResist: 2 }));
  assert.match(result.findings.find((f) => f.id === "resist-fire")!.title, /78% of 80%/);
});

test("in the campaign, resistances only need the stage's floor", () => {
  assert.ok(!ids(build({ FireResist: 65 }, { level: 60 })).includes("resist-fire"));
  assert.ok(ids(build({ FireResist: 30 }, { level: 60 })).includes("resist-fire"));
});

test("little over-cap in red maps is a low finding", () => {
  const result = analyze(build({ FireResistOverCap: 2 }));
  assert.equal(result.findings.find((f) => f.id === "resist-overcap")?.severity, "low");
  assert.ok(!ids(build({ FireResistOverCap: 2 }, { level: 80 })).includes("resist-overcap"), "only in red maps");
});

test("chaos resistance is ignored with Chaos Inoculation", () => {
  assert.ok(ids(build({ ChaosResist: -40 })).includes("resist-chaos"));
  assert.ok(!ids(build({ ChaosResist: -40 }, {}, ["Chaos Inoculation"])).includes("resist-chaos"));
});

test("the weakest hit type is named when it lags behind", () => {
  // Typical hit 10,000: under 60% (6,000) is a finding, under half that (3,000) is high.
  const hit = analyze(build({ PhysicalMaximumHitTaken: 2000 })).findings.find((f) => f.id === "max-hit");
  assert.equal(hit?.severity, "high");
  assert.match(hit!.title, /physical/i);
  assert.equal(analyze(build({ PhysicalMaximumHitTaken: 5000 })).findings.find((f) => f.id === "max-hit")?.severity, "medium");
  assert.ok(!ids(build({ PhysicalMaximumHitTaken: 7000 })).includes("max-hit"));
});

test("defence and offence rules", () => {
  assert.ok(ids(build({ NetLifeRegen: 0 })).includes("life-recovery"));
  assert.ok(!ids(build({ NetLifeRegen: 0, LifeLeechGainRate: 500 })).includes("life-recovery"), "leech counts as recovery");
  assert.ok(ids(build({ FreezeAvoidChance: 0 })).includes("freeze"));
  assert.ok(ids(build({ TotalEHP: 5000 })).includes("ehp"));
  assert.ok(ids(build({ SpellSuppressionChance: 70 })).includes("suppression"));
  assert.ok(!ids(build({ SpellSuppressionChance: 20 })).includes("suppression"), "not invested");
  assert.ok(ids(build({ ManaCost: 50, ManaUnreserved: 20 })).includes("mana-cost"));
  assert.equal(analyze(build({ HitChance: 70 })).findings.find((f) => f.id === "hit-chance")?.severity, "high");
  assert.ok(ids(build({ EffectiveMovementSpeedMod: 1.05 })).includes("movement"));
});

test("findings are ordered by severity and set the priority", () => {
  const result = analyze(build({ EffectiveMovementSpeedMod: 1.05, ColdResist: 40 }));
  assert.deepEqual(result.findings.map((f) => f.severity), ["high", "low"]);
  assert.equal(result.priority, result.findings[0].action);
});

test("the verdict and the findings come in Spanish", () => {
  const result = analyze(build({ ColdResist: 40 }), [], false, translator("es"));
  assert.match(result.findings[0].title, /Resistencia/);
  assert.doesNotMatch(result.verdict, /^A level/);
  assert.equal(result.recommendedAction, result.findings[0].action);
});

test("without a guide or upgrades, the app asks for a guide", () => {
  assert.equal(analyze(build()).estimatedGain, "Load a guide");
  assert.equal(analyze(build(), [], true).estimatedGain, "Gear on track");
});
