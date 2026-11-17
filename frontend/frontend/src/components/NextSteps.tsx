import type { NextStep } from "../tree/progress";
import type { TreeNodeKind } from "../tree/types";

const KIND_LABEL: Record<TreeNodeKind, string> = {
  root: "Start",
  normal: "Passive",
  notable: "Notable",
  keystone: "Keystone",
  wormhole: "Wormhole",
  mastery: "Mastery",
  jewel: "Jewel socket",
};

function distanceText(distance: number): string {
  if (distance === 1) return "can be taken now";
  return Number.isFinite(distance) ? `${distance} points away` : "not connected yet";
}

interface NextStepsProps {
  steps: NextStep[];
  limit: number;
  /** Centres the map on a node. */
  onFocus: (id: number) => void;
  /** Marks a reachable node as taken, where the player tracks the tree by hand. */
  onTake?: (id: number) => void;
}

/** The guide passives still missing, closest first, each one findable on the map. */
export default function NextSteps({ steps: allSteps, limit, onFocus, onTake }: NextStepsProps) {
  // Small passives are just the road between milestones; list the milestones while any are left.
  const milestones = allSteps.filter((step) => step.node.kind !== "normal");
  const steps = milestones.length > 0 ? milestones : allSteps;
  const shown = steps.slice(0, limit);
  if (shown.length === 0) return null;

  return (
    <>
      <h3 className="font-display text-[14px] tracking-[0.18em] text-parchment-dim">NEXT ON YOUR PATH</h3>
      <ul className="mt-2 flex flex-col divide-y divide-gold-dim/20">
        {shown.map(({ node, distance }) => (
          <li key={node.id} className="flex items-center gap-3 py-2">
            <button
              type="button"
              onClick={() => onFocus(node.id)}
              className="min-w-0 flex-1 text-left hover:text-gold"
              title="Show on the map"
            >
              <span className="block truncate text-[17px] text-parchment">{node.name}</span>
              <span className="block text-[14px] text-parchment-faint">
                {node.region ?? KIND_LABEL[node.kind]} · {distanceText(distance)}
              </span>
            </button>
            {onTake && distance === 1 && (
              <button
                type="button"
                onClick={() => onTake(node.id)}
                className="border border-gold-dim/60 px-4 py-1.5 font-display text-[13px] tracking-[0.18em] text-parchment-dim hover:text-gold"
              >
                TAKEN
              </button>
            )}
          </li>
        ))}
      </ul>
      {steps.length > limit && (
        <p className="mt-2 text-[15px] text-parchment-faint">And {steps.length - limit} more beyond these.</p>
      )}
    </>
  );
}
