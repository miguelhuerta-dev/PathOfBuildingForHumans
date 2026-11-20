import { useMemo } from "react";
import type { Picks } from "../components/ConstellationMap";
import { computeProgress } from "../tree/progress";
import type { PassiveTreeData } from "../tree/types";
import { treeLoader, useTreeGraph } from "../tree/useTreeGraph";
import type { PassiveComparison } from "../types/Engine";

// The tree data (~590 KB, ~120 KB compressed) is only fetched when a guide comparison is shown.
const loadPassiveTree = treeLoader<PassiveTreeData>(() => import("../data/passives/passiveTree.json"));

const NONE: readonly number[] = [];
const NO_KEYS: readonly string[] = [];

function picksOf(masteries: Record<string, number> | undefined): Picks {
  return new Map(Object.entries(masteries ?? {}).map(([node, effect]) => [Number(node), effect]));
}

/**
 * The character's passive tree compared with the guide's, as calculated by
 * Path of Building, ready for the constellation map.
 */
export function usePassiveTree(passives: PassiveComparison | undefined, className: string | undefined) {
  const { graph, loadError } = useTreeGraph(loadPassiveTree, "passive tree");
  const guideIds = passives?.guideNodes ?? NONE;
  const ownedIds = passives?.characterNodes ?? NONE;

  const guide = useMemo(() => new Set(guideIds), [guideIds]);
  const owned = useMemo(() => new Set(ownedIds), [ownedIds]);
  const start = className ? graph?.tree.starts[className] : undefined;
  const starts = useMemo(() => new Set(start === undefined ? [] : [start]), [start]);
  const picks = useMemo(
    () => ({ guide: picksOf(passives?.guideMasteries), owned: picksOf(passives?.characterMasteries) }),
    [passives?.guideMasteries, passives?.characterMasteries],
  );
  const progress = useMemo(
    () => (graph ? computeProgress(graph, guide, owned, starts) : null),
    [graph, guide, owned, starts],
  );
  // Every icon the map may show, including masteries' allocated look.
  const iconKeys = useMemo(
    () => graph?.tree.nodes.flatMap((node) => [node.icon, node.activeIcon].filter((icon) => icon !== undefined)) ?? NO_KEYS,
    [graph],
  );

  return { graph, loadError, guide, owned, starts, picks, progress, iconKeys };
}
