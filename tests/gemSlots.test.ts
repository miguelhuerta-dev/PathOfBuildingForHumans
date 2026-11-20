import assert from "node:assert/strict";
import { test } from "node:test";
import { chooseSlots } from "../src/guide/gemSlots.ts";

test("the guide's own slot always wins", () => {
  const [choice] = chooseSlots([{ slot: "Gloves", label: "6L Chest", gemCount: 6 }]);
  assert.deepEqual([choice.slot, choice.source], ["Gloves", "guide"]);
});

test("a piece named in the label comes before link counting", () => {
  const choices = chooseSlots([
    { label: "Boots: Flame Dash + Faster Casting", gemCount: 2 },
    { label: "3L Shield Mobility", gemCount: 3 },
    { label: "Helm auras", gemCount: 4 },
  ]);
  assert.deepEqual(choices.map((c) => [c.slot, c.source]), [
    ["Boots", "label"],
    ["Weapon 2", "label"],
    ["Helmet", "label"],
  ]);
});

test("\"6L\" in a label asks for a body armour even with fewer gems listed", () => {
  const [choice] = chooseSlots([{ label: "6L Summon Raging Spirits", gemCount: 4 }]);
  assert.deepEqual([choice.slot, choice.links], ["Body Armour", 6]);
});

test("unlabelled groups get an item by links, largest first, never two in one item", () => {
  const choices = chooseSlots([
    { label: "Main DMG", gemCount: 3 },
    { label: "Minions", gemCount: 4 },
    { label: "Utility", gemCount: 4 },
    { label: "Main", gemCount: 5 },
    { label: "Movement", gemCount: 2 },
  ]);
  assert.deepEqual(choices.map((c) => c.slot), ["Weapon 1", "Helmet", "Gloves", "Body Armour", "Weapon 2"]);
  assert.ok(choices.every((c) => c.source === "links"));
});

test("a labelled body armour already in use falls back to link counting", () => {
  const choices = chooseSlots([
    { slot: "Body Armour", label: "6L Main", gemCount: 6 },
    { label: "5L Chest backup", gemCount: 5 },
  ]);
  assert.deepEqual(choices.map((c) => c.slot), ["Body Armour", "Weapon 1"]);
});
