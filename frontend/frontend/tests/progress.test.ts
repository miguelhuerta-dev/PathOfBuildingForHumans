import assert from "node:assert/strict";
import { test } from "node:test";
import { buildGraph, computeProgress } from "../src/tree/progress.ts";
import type { TreeData, TreeNode } from "../src/tree/types.ts";

// A small tree:  start(1) — 2 — 3(notable) — 4(keystone)
//                         \— 5 (Breach)            6 is not connected.
const node = (id: number, kind: TreeNode["kind"], region?: string): TreeNode => ({
  id, kind, name: `Node ${id}`, x: id * 100, y: 0, region,
});
const tree: TreeData = {
  version: "test",
  bounds: { minX: 0, minY: 0, maxX: 600, maxY: 0 },
  regions: [],
  nodes: [node(1, "root"), node(2, "normal", "Breach"), node(3, "notable", "Breach"), node(4, "keystone"), node(5, "normal", "Ritual"), node(6, "notable")],
  edges: [[1, 2], [2, 3], [3, 4], [2, 5]],
};
const graph = buildGraph(tree);

test("counts guide passives taken and spent points, never the start", () => {
  const progress = computeProgress(graph, new Set([1, 2, 3]), new Set([2, 5]), [1]);
  assert.equal(progress.total, 2);
  assert.equal(progress.done, 1);
  assert.equal(progress.spent, 2);
});

test("orders the missing passives by distance from what is allocated", () => {
  const progress = computeProgress(graph, new Set([3, 4, 6]), new Set([2]), [1]);
  assert.deepEqual(
    progress.next.map((step) => [step.node.id, step.distance]),
    [[3, 1], [4, 2], [6, Infinity]],
  );
});

test("groups guide passives by region when the tree has regions", () => {
  const progress = computeProgress(graph, new Set([2, 3, 5]), new Set([2]), [1]);
  assert.deepEqual(progress.regions, [
    { name: "Breach", owned: 1, total: 2 },
    { name: "Ritual", owned: 0, total: 1 },
  ]);
});
