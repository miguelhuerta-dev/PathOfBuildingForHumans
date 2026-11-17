import { useState } from "react";
import AtlasFrame from "../components/AtlasFrame";
import AtlasSectionHeader from "../components/AtlasSectionHeader";
import AtlasTreeMap, { type AtlasFocus } from "../components/AtlasTreeMap";
import { AtlasStarIcon, QuillIcon, SigilIcon } from "../components/icons";
import { ErrorNote, MetalMeter } from "../components/ui";
import type { AtlasProgress } from "../atlas/progress";
import { useAtlasProgress, type AtlasProgressState } from "../state/useAtlasProgress";

const NEXT_LIMIT = 8;

const fieldClass =
  "resize-y border border-gold-dim/60 bg-black/50 px-3 py-2 font-mono text-[14px] text-parchment placeholder:font-body placeholder:text-[17px] placeholder:text-parchment-faint focus:border-gold focus:outline-none";
const secondaryButton =
  "border border-gold-dim/60 px-4 py-1.5 font-display text-[13px] tracking-[0.18em] text-parchment-dim hover:text-gold";

function LinkForm({ atlas }: { atlas: AtlasProgressState }) {
  const [guideLink, setGuideLink] = useState("");
  const [ownLink, setOwnLink] = useState("");

  return (
    <AtlasFrame>
      <AtlasSectionHeader title="Atlas Records" icon={<QuillIcon className="h-6 w-6" />} />
      <form
        className="flex flex-col gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          if (atlas.importLink("guide", guideLink)) setGuideLink("");
        }}
      >
        <label className="flex flex-col gap-1">
          <span className="font-display text-[13px] tracking-[0.18em] text-parchment-dim">GUIDE ATLAS TREE LINK</span>
          <textarea
            value={guideLink}
            onChange={(event) => setGuideLink(event.target.value)}
            rows={2}
            spellCheck={false}
            placeholder="https://www.pathofexile.com/fullscreen-atlas-skill-tree/…"
            className={fieldClass}
          />
        </label>
        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={!guideLink.trim()}
            className="ui-button h-12 min-w-48 font-display text-[14px] tracking-[0.2em] text-parchment transition hover:brightness-125 disabled:opacity-50"
          >
            FOLLOW THIS ATLAS
          </button>
          {atlas.guide.size > 0 && (
            <button type="button" onClick={() => atlas.clear("guide")} className={secondaryButton}>
              REMOVE GUIDE ATLAS
            </button>
          )}
        </div>
      </form>

      <form
        className="mt-6 flex flex-col gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          if (atlas.importLink("owned", ownLink)) setOwnLink("");
        }}
      >
        <label className="flex flex-col gap-1">
          <span className="font-display text-[13px] tracking-[0.18em] text-parchment-dim">
            YOUR ATLAS TREE LINK (OPTIONAL)
          </span>
          <textarea
            value={ownLink}
            onChange={(event) => setOwnLink(event.target.value)}
            rows={2}
            spellCheck={false}
            placeholder="Replaces the passives you marked"
            className={fieldClass}
          />
        </label>
        <div className="flex flex-wrap gap-3">
          <button type="submit" disabled={!ownLink.trim()} className={`${secondaryButton} disabled:opacity-50`}>
            LOAD MY ATLAS
          </button>
          {atlas.owned.size > 0 && (
            <button type="button" onClick={() => atlas.clear("owned")} className={secondaryButton}>
              CLEAR MY PASSIVES
            </button>
          )}
        </div>
      </form>

      {atlas.linkError && <ErrorNote className="mt-3">{atlas.linkError}</ErrorNote>}
      <p className="mt-4 text-[15px] text-parchment-faint">
        Path of Exile does not share your Atlas tree publicly, so mark the passives you have by clicking them on the
        map. Your marks are kept per league.
      </p>
    </AtlasFrame>
  );
}

function ProgressPanel({ progress, onFocus, onToggle }: {
  progress: AtlasProgress;
  onFocus: (id: number) => void;
  onToggle: (id: number) => void;
}) {
  const next = progress.next.slice(0, NEXT_LIMIT);
  return (
    <AtlasFrame>
      <AtlasSectionHeader title="Atlas Progress" icon={<SigilIcon className="h-7 w-7" />} />
      {progress.total === 0 ? (
        <p className="text-[17px] text-parchment-dim">
          Load your guide's Atlas tree to see what is left to take. You have marked {progress.spent} passives.
        </p>
      ) : (
        <>
          <p className="text-[17px] text-parchment">
            <span className="gold-text font-display text-[26px]">{progress.done}</span>
            <span className="text-parchment-dim"> of {progress.total} guide passives taken</span>
          </p>
          <MetalMeter label="Guide Atlas passives taken" value={progress.done} max={progress.total} className="mt-2" />
          <p className="mt-2 text-[15px] text-parchment-faint">{progress.spent} passives marked in total.</p>

          {next.length > 0 ? (
            <>
              <h3 className="mt-6 font-display text-[14px] tracking-[0.18em] text-parchment-dim">NEXT ON YOUR PATH</h3>
              <ul className="mt-2 flex flex-col divide-y divide-gold-dim/20">
                {next.map(({ node, distance }) => (
                  <li key={node.id} className="flex items-center gap-3 py-2">
                    <button
                      type="button"
                      onClick={() => onFocus(node.id)}
                      className="min-w-0 flex-1 text-left hover:text-gold"
                      title="Show on the map"
                    >
                      <span className="block truncate text-[17px] text-parchment">{node.name}</span>
                      <span className="block text-[14px] text-parchment-faint">
                        {node.region ?? "The Atlas"} ·{" "}
                        {distance === 1 ? "can be taken now" : Number.isFinite(distance) ? `${distance} points away` : "not connected yet"}
                      </span>
                    </button>
                    {distance === 1 && (
                      <button type="button" onClick={() => onToggle(node.id)} className={secondaryButton}>
                        TAKEN
                      </button>
                    )}
                  </li>
                ))}
              </ul>
              {progress.next.length > NEXT_LIMIT && (
                <p className="mt-2 text-[15px] text-parchment-faint">
                  And {progress.next.length - NEXT_LIMIT} more beyond these.
                </p>
              )}
            </>
          ) : (
            <p className="mt-4 text-[17px] text-verdigris">Every passive of the guide's Atlas is taken.</p>
          )}
        </>
      )}
    </AtlasFrame>
  );
}

function RegionPanel({ progress }: { progress: AtlasProgress }) {
  if (progress.regions.length === 0) return null;
  return (
    <AtlasFrame>
      <AtlasSectionHeader title="Regions of Study" icon={<AtlasStarIcon className="h-7 w-7" />} />
      <ul className="flex flex-col gap-3">
        {progress.regions.map((region) => (
          <li key={region.name}>
            <div className="flex justify-between text-[16px]">
              <span className="text-parchment">{region.name}</span>
              <span className="text-parchment-dim">
                {region.owned} / {region.total}
              </span>
            </div>
            <MetalMeter label={`${region.name} passives taken`} value={region.owned} max={region.total} className="mt-1" />
          </li>
        ))}
      </ul>
    </AtlasFrame>
  );
}

function Legend() {
  const items = [
    { label: "Taken", swatch: "bg-[#f2dfa8] border-gold" },
    { label: "In the guide, not taken", swatch: "bg-ink border-verdigris" },
    { label: "Taken, not in the guide", swatch: "bg-gold-dim border-gold" },
    { label: "Not planned", swatch: "bg-stone border-parchment-faint opacity-60" },
  ];
  return (
    <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-[15px] text-parchment-dim">
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-2">
          <span aria-hidden="true" className={`inline-block h-3.5 w-3.5 rounded-full border-2 ${item.swatch}`} />
          {item.label}
        </li>
      ))}
    </ul>
  );
}

/** The Atlas passive tree: the guide's plan, what the player has taken and what comes next. */
export default function AtlasPage({ league }: { league: string }) {
  const atlas = useAtlasProgress(league);
  const [focus, setFocus] = useState<AtlasFocus | null>(null);

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[1fr_380px]">
      <AtlasFrame>
        <AtlasSectionHeader title="The Atlas" icon={<AtlasStarIcon className="h-7 w-7" />} />
        <p className="mb-4 text-[17px] text-parchment-dim">
          {league} league · drag to move, scroll to zoom, click a passive to mark it as taken.
          {atlas.graph && <span className="text-parchment-faint"> Atlas tree {atlas.graph.tree.version}.</span>}
        </p>
        {atlas.loadError && <ErrorNote>{atlas.loadError}</ErrorNote>}
        {atlas.graph ? (
          <>
            <AtlasTreeMap
              graph={atlas.graph}
              guide={atlas.guide}
              owned={atlas.owned}
              onToggle={atlas.toggleOwned}
              focus={focus}
            />
            <Legend />
          </>
        ) : (
          !atlas.loadError && <p className="text-[17px] text-parchment-faint">Unrolling the star charts…</p>
        )}
      </AtlasFrame>

      <div className="flex flex-col gap-6">
        {atlas.progress && (
          <ProgressPanel progress={atlas.progress} onFocus={(id) => setFocus({ id })} onToggle={atlas.toggleOwned} />
        )}
        <LinkForm atlas={atlas} />
        {atlas.progress && <RegionPanel progress={atlas.progress} />}
      </div>
    </div>
  );
}
