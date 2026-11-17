import type { AtlasNode, AtlasTreeData } from "./types";

export interface AtlasGraph {
  tree: AtlasTreeData;
  byId: Map<number, AtlasNode>;
  neighbours: Map<number, number[]>;
}

export function buildGraph(tree: AtlasTreeData): AtlasGraph {
  const byId = new Map(tree.nodes.map((node) => [node.id, node]));
  const neighbours = new Map<number, number[]>();
  const link = (from: number, to: number) => {
    const list = neighbours.get(from);
    if (list) list.push(to);
    else neighbours.set(from, [to]);
  };
  for (const [a, b] of tree.edges) {
    link(a, b);
    link(b, a);
  }
  return { tree, byId, neighbours };
}

export interface NextStep {
  node: AtlasNode;
  /** Points needed to reach it from what is already allocated (1 = can be taken now). */
  distance: number;
}

export interface RegionProgress {
  name: string;
  owned: number;
  total: number;
}

export interface AtlasProgress {
  /** Guide nodes the player already has. */
  done: number;
  /** Guide nodes in total (the root is not counted). */
  total: number;
  /** Points the player has spent (the root is not counted). */
  spent: number;
  /** Missing guide nodes, closest first. */
  next: NextStep[];
  regions: RegionProgress[];
}

/** Distance in points from the allocated nodes to every reachable node. */
function distancesFrom(graph: AtlasGraph, owned: Set<number>): Map<number, number> {
  const distance = new Map<number, number>();
  const queue: number[] = [];
  for (const id of owned) {
    distance.set(id, 0);
    queue.push(id);
  }
  for (let head = 0; head < queue.length; head++) {
    const id = queue[head];
    const next = (distance.get(id) ?? 0) + 1;
    for (const other of graph.neighbours.get(id) ?? []) {
      if (distance.has(other)) continue;
      distance.set(other, next);
      queue.push(other);
    }
  }
  return distance;
}

export function computeProgress(graph: AtlasGraph, guide: Set<number>, owned: Set<number>): AtlasProgress {
  const root = graph.tree.root;
  const allocated = new Set(owned).add(root);
  const distance = distancesFrom(graph, allocated);

  const regions = new Map<string, RegionProgress>();
  const next: NextStep[] = [];
  let done = 0;
  let total = 0;

  for (const id of guide) {
    const node = graph.byId.get(id);
    if (!node || node.kind === "root") continue;
    total += 1;
    const has = owned.has(id);
    if (has) done += 1;
    else next.push({ node, distance: distance.get(id) ?? Infinity });

    const name = node.region ?? "The Atlas";
    const region = regions.get(name) ?? { name, owned: 0, total: 0 };
    region.total += 1;
    if (has) region.owned += 1;
    regions.set(name, region);
  }

  next.sort((a, b) => a.distance - b.distance || a.node.name.localeCompare(b.node.name));
  let spent = 0;
  for (const id of owned) if (id !== root && graph.byId.has(id)) spent += 1;

  return {
    done,
    total,
    spent,
    next,
    regions: [...regions.values()].sort((a, b) => b.total - a.total || a.name.localeCompare(b.name)),
  };
}
