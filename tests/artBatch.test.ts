import assert from "node:assert/strict";
import { test } from "node:test";
import { createArtBatch } from "../src/lib/artBatch.ts";

test("names asked for together are read once, and answers are remembered", async () => {
  const reads: string[][] = [];
  const art = createArtBatch(async (names) => {
    reads.push(names);
    return { "Divine Life Flask": "flask.png", "Vaal Regalia": "regalia.png" };
  });

  const answers = await Promise.all([
    art("Divine Life Flask"),
    art("Vaal Regalia"),
    art("Divine Life Flask"),
    art("Not An Item"),
  ]);
  assert.deepEqual(answers, ["flask.png", "regalia.png", "flask.png", undefined]);
  assert.deepEqual(reads, [["Divine Life Flask", "Vaal Regalia", "Not An Item"]]);

  assert.equal(await art("Vaal Regalia"), "regalia.png");
  assert.equal(reads.length, 1, "a known name is not read again");
});

test("a failed read is tried again next time", async () => {
  let calls = 0;
  const art = createArtBatch(async () => {
    calls += 1;
    if (calls === 1) throw new Error("game not found");
    return { "Granite Flask": "granite.png" };
  });
  assert.equal(await art("Granite Flask"), undefined);
  assert.equal(await art("Granite Flask"), "granite.png");
  assert.equal(calls, 2);
});
