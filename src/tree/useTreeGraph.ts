import { useEffect, useState } from "react";
import { buildGraph, type TreeGraph } from "./progress";
import type { TreeData } from "./types";

/**
 * Loads a tree's data once, on first use: the JSON files are a few hundred KB,
 * so they live in their own chunk instead of the app's main bundle.
 */
export function treeLoader<T extends TreeData>(load: () => Promise<{ default: unknown }>) {
  let graph: Promise<TreeGraph<T>> | null = null;
  return () =>
    // JSON imports widen tuples and unions; the generators guarantee the shape.
    (graph ??= load().then((module) => buildGraph(module.default as T)));
}

export function useTreeGraph<T extends TreeData>(load: () => Promise<TreeGraph<T>>, name: string) {
  const [graph, setGraph] = useState<TreeGraph<T> | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    load().then(
      (loaded) => active && setGraph(loaded),
      () => active && setLoadError(`The ${name} could not be loaded.`),
    );
    return () => {
      active = false;
    };
  }, [load, name]);

  return { graph, loadError };
}
