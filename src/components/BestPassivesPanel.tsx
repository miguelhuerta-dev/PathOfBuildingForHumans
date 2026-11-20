import { useState } from "react";
import { desktop } from "../lib/desktop";
import type { BestPassives } from "../types/Engine";
import AtlasFrame from "./AtlasFrame";
import AtlasSectionHeader from "./AtlasSectionHeader";
import { AtlasStarIcon } from "./icons";

/**
 * The tree optimizer: the passives that would help this character most for the
 * points they cost. Every notable and keystone a few points away is tried on the
 * character, with the path to it, by Path of Building.
 */
function BestPassivesPanel({ character }: { character: string }) {
  const [state, setState] = useState<{ character: string; result?: BestPassives; error?: string; loading?: boolean } | null>(null);
  const current = state?.character === character ? state : null;

  const run = () => {
    setState({ character, loading: true });
    desktop.bestPassives().then(
      (result) => setState({ character, result }),
      (error: unknown) => setState({ character, error: error instanceof Error ? error.message : String(error) }),
    );
  };

  return (
    <AtlasFrame>
      <AtlasSectionHeader title="Best Next Passives" icon={<AtlasStarIcon className="h-7 w-7" />} />
      <p className="mb-4 text-[16px] leading-snug text-parchment-dim">
        Every notable and keystone within reach is tried on your character, with the path to it, and ranked by what it adds for
        each point you spend.
      </p>

      {!current?.result && (
        <button
          type="button"
          onClick={run}
          disabled={current?.loading}
          className="ui-button h-12 w-full max-w-sm font-display text-[14px] tracking-[0.2em] text-parchment transition hover:brightness-125 disabled:opacity-60"
        >
          {current?.loading ? "TRYING EVERY PATH…" : "FIND MY BEST NEXT POINTS"}
        </button>
      )}
      {current?.error && <p className="mt-3 text-[15px] text-ember">{current.error}</p>}

      {current?.result && (
        <>
          {current.result.passives.length === 0 ? (
            <p className="text-[16px] text-parchment-dim">
              Nothing within {current.result.reach} points would change your damage or defences much.
            </p>
          ) : (
            <ol className="flex flex-col gap-2">
              {current.result.passives.map((passive, index) => (
                <li key={passive.id} className="forge-row flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2">
                  <span className="w-5 font-display text-[14px] text-gold-dim">{index + 1}</span>
                  <span className="min-w-0 flex-1">
                    <span className={`text-[17px] ${passive.type === "Keystone" ? "text-gold" : "text-parchment"}`}>{passive.name}</span>
                    <span className="ml-2 font-display text-[10px] tracking-[0.16em] text-parchment-faint">{passive.type.toUpperCase()}</span>
                    {passive.type === "Keystone" && (
                      <span className="ml-2 text-[13px] italic text-parchment-faint">— a keystone changes how your build works: read its drawback first</span>
                    )}
                  </span>
                  <span className="font-display text-[12px] tracking-[0.1em] text-parchment-dim">
                    {passive.points} {passive.points === 1 ? "POINT" : "POINTS"}
                  </span>
                  <span className="flex gap-3 font-display text-[13px]">
                    {Math.abs(passive.dps) >= 0.1 && (
                      <span className={passive.dps > 0 ? "text-ember" : "text-[#c9645a]"}>
                        {passive.dps > 0 ? "+" : "−"}
                        {Math.abs(passive.dps)}% DPS
                      </span>
                    )}
                    {Math.abs(passive.ehp) >= 0.1 && (
                      <span className={passive.ehp > 0 ? "text-verdigris" : "text-[#c9645a]"}>
                        {passive.ehp > 0 ? "+" : "−"}
                        {Math.abs(passive.ehp)}% EHP
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ol>
          )}
          <p className="mt-3 text-[13px] text-parchment-faint">
            {current.result.tried} passives within {current.result.reach} points tried.{" "}
            <button type="button" onClick={run} className="underline decoration-dotted underline-offset-4 hover:text-gold">
              Try again
            </button>
          </p>
        </>
      )}
    </AtlasFrame>
  );
}

export default BestPassivesPanel;
