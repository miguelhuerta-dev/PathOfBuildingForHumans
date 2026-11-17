/**
 * Shapes of the tree data generated from GGG's official exports:
 * src/data/atlas/atlasTree.json (scripts/update-atlas-tree.mjs) and
 * src/data/passives/passiveTree.json (scripts/update-passive-tree.mjs).
 */

/** "root" is where allocation starts: the Atlas centre, or a class start on the passive tree. */
export type TreeNodeKind = "root" | "normal" | "notable" | "keystone" | "wormhole" | "mastery" | "jewel";

export interface TreeNode {
  id: number;
  kind: TreeNodeKind;
  name: string;
  x: number;
  y: number;
  stats?: string[];
  /** Effects the player picks one of (Atlas choice notables, passive masteries). */
  choices?: string[];
  /** Game ids of `choices`, in the same order (passive masteries). */
  effects?: number[];
  /** League mechanic the node belongs to (Atlas only: Breach, Delirium…). */
  region?: string;
  /** Name of the game's icon (e.g. "AtlasTrees/ThreadNode1"); the image is read from the installed game. */
  icon?: string;
  /** Icon once allocated, when it differs (passive masteries). */
  activeIcon?: string;
}

export interface TreeRegion {
  name: string;
  x: number;
  y: number;
}

export interface TreeData {
  version: string;
  bounds: { minX: number; minY: number; maxX: number; maxY: number };
  /** Labels drawn over the map. */
  regions: TreeRegion[];
  nodes: TreeNode[];
  edges: [number, number][];
}

export interface AtlasTreeData extends TreeData {
  totalPoints: number;
  /** The Atlas centre, which every player starts with. */
  root: number;
}

export interface PassiveTreeData extends TreeData {
  /** Start node of each class, by class name ("Witch", "Marauder"…). */
  starts: Record<string, number>;
}
