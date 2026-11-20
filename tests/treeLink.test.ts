// Run with `npm test` (Node's built-in test runner; Node 22.18+ runs TypeScript directly).
import assert from "node:assert/strict";
import { test } from "node:test";
import { readAtlasLink } from "../src/atlas/treeLink.ts";

/** Builds a link in GGG's format: u32 version, class, ascendancy, then the node list. */
function link(version: number, nodes: number[], { counted }: { counted: boolean }): string {
  const bytes = [0, 0, 0, version, 0, 0, counted ? nodes.length : 1];
  for (const id of nodes) bytes.push(id >> 8, id & 0xff);
  const code = Buffer.from(bytes).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return `https://www.pathofexile.com/fullscreen-atlas-skill-tree/${code}`;
}

test("reads version 6 links, with or without a query string", () => {
  const url = link(6, [29045, 1234, 65000], { counted: true });
  assert.deepEqual(readAtlasLink(url), [29045, 1234, 65000]);
  assert.deepEqual(readAtlasLink(`${url}?accountName=x#top`), [29045, 1234, 65000]);
});

test("reads version 4 links, where nodes run to the end", () => {
  assert.deepEqual(readAtlasLink(link(4, [10, 20, 30], { counted: false })), [10, 20, 30]);
});

test("accepts a bare code", () => {
  const code = link(5, [7, 8], { counted: true }).split("/").pop()!;
  assert.deepEqual(readAtlasLink(code), [7, 8]);
});

test("explains what is wrong with bad links", () => {
  assert.throws(() => readAtlasLink("hello"), /does not look like an Atlas tree link/);
  assert.throws(() => readAtlasLink(link(9, [1], { counted: true })), /format 9 are not supported/);
  const incomplete = link(6, [1, 2, 3], { counted: true }).slice(0, -4);
  assert.throws(() => readAtlasLink(incomplete), /incomplete|damaged|too short/);
});
