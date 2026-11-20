import { useT } from "../i18n";
import { useMemo, useState } from "react";
import AtlasFrame from "../components/AtlasFrame";
import AtlasSectionHeader from "../components/AtlasSectionHeader";
import NextSteps from "../components/NextSteps";
import ConstellationMap, { MapLegend, type MapFocus } from "../components/ConstellationMap";
import { AtlasStarIcon, QuillIcon, SigilIcon } from "../components/icons";
import { ErrorNote, MetalMeter } from "../components/ui";
import type { TreeProgress } from "../tree/progress";
import { useAtlasProgress, type AtlasProgressState } from "../state/useAtlasProgress";
import { usePassiveIcons } from "../state/usePassiveIcons";

const NEXT_LIMIT = 8;

const fieldClass =
  "resize-y border border-gold-dim/60 bg-black/50 px-3 py-2 font-mono text-[14px] text-parchment placeholder:font-body placeholder:text-[17px] placeholder:text-parchment-faint focus:border-gold focus:outline-none";
const secondaryButton =
  "border border-gold-dim/60 px-4 py-1.5 font-display text-[13px] tracking-[0.18em] text-parchment-dim hover:text-gold";

function LinkForm({ atlas }: { atlas: AtlasProgressState }) {
  const t = useT();
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
          <span className="font-display text-[13px] tracking-[0.18em] text-parchment-dim">{t("GUIDE ATLAS TREE LINK")}</span>
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
            {t("FOLLOW THIS ATLAS")}
          </button>
          {atlas.guide.size > 0 && (
            <button type="button" onClick={() => atlas.clear("guide")} className={secondaryButton}>
              {t("REMOVE GUIDE ATLAS")}
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
            {t("YOUR ATLAS TREE LINK (OPTIONAL)")}
          </span>
          <textarea
            value={ownLink}
            onChange={(event) => setOwnLink(event.target.value)}
            rows={2}
            spellCheck={false}
            placeholder={t("Replaces the passives you marked")}
            className={fieldClass}
          />
        </label>
        <div className="flex flex-wrap gap-3">
          <button type="submit" disabled={!ownLink.trim()} className={`${secondaryButton} disabled:opacity-50`}>
            {t("LOAD MY ATLAS")}
          </button>
          {atlas.owned.size > 0 && (
            <button type="button" onClick={() => atlas.clear("owned")} className={secondaryButton}>
              {t("CLEAR MY PASSIVES")}
            </button>
          )}
        </div>
      </form>

      {atlas.linkError && <ErrorNote className="mt-3">{atlas.linkError}</ErrorNote>}
      <p className="mt-4 text-[15px] text-parchment-faint">
        {t("Path of Exile does not share your Atlas tree publicly, so mark the passives you have by clicking them on the map. Your marks are kept per league.")}
      </p>
    </AtlasFrame>
  );
}

function ProgressPanel({ progress, onFocus, onToggle }: {
  progress: TreeProgress;
  onFocus: (id: number) => void;
  onToggle: (id: number) => void;
}) {
  const t = useT();
  return (
    <AtlasFrame>
      <AtlasSectionHeader title="Atlas Progress" icon={<SigilIcon className="h-7 w-7" />} />
      {progress.total === 0 ? (
        <p className="text-[17px] text-parchment-dim">
          {t("Load your guide's Atlas tree to see what is left to take. You have marked {count} passives.", { count: progress.spent })}
        </p>
      ) : (
        <>
          <p className="text-[17px] text-parchment">
            <span className="gold-text font-display text-[26px]">{progress.done}</span>
            <span className="text-parchment-dim"> {t("of {total} guide passives taken", { total: progress.total })}</span>
          </p>
          <MetalMeter label={t("Guide Atlas passives taken")} value={progress.done} max={progress.total} className="mt-2" />
          <p className="mt-2 text-[15px] text-parchment-faint">{t("{count} passives marked in total.", { count: progress.spent })}</p>

          {progress.next.length > 0 ? (
            <div className="mt-6">
              <NextSteps steps={progress.next} limit={NEXT_LIMIT} onFocus={onFocus} onTake={onToggle} />
            </div>
          ) : (
            <p className="mt-4 text-[17px] text-verdigris">{t("Every passive of the guide's Atlas is taken.")}</p>
          )}
        </>
      )}
    </AtlasFrame>
  );
}

function RegionPanel({ progress }: { progress: TreeProgress }) {
  const t = useT();
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
            <MetalMeter label={t("{region} passives taken", { region: region.name })} value={region.owned} max={region.total} className="mt-1" />
          </li>
        ))}
      </ul>
    </AtlasFrame>
  );
}

const NO_KEYS: string[] = [];

interface AtlasPageProps {
  league: string;
  /** The game's Client.txt, when the player chose one: it also locates the game for its icons. */
  clientLog: string | null;
}

/** The Atlas passive tree: the guide's plan, what the player has taken and what comes next. */
export default function AtlasPage({ league, clientLog }: AtlasPageProps) {
  const t = useT();
  const atlas = useAtlasProgress(league);
  const [focus, setFocus] = useState<MapFocus | null>(null);
  const root = atlas.graph?.tree.root;
  const starts = useMemo(() => new Set(root === undefined ? [] : [root]), [root]);
  const iconKeys = useMemo(
    () => atlas.graph?.tree.nodes.flatMap((node) => (node.icon ? [node.icon] : [])) ?? NO_KEYS,
    [atlas.graph],
  );
  const passiveIcons = usePassiveIcons(iconKeys, clientLog);

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[1fr_380px]">
      <AtlasFrame>
        <AtlasSectionHeader title="The Atlas" icon={<AtlasStarIcon className="h-7 w-7" />} />
        <p className="mb-4 text-[17px] text-parchment-dim">
          {t("{league} league · drag to move, scroll to zoom, click a passive to mark it as taken.", { league })}
          {atlas.graph && <span className="text-parchment-faint"> {t("Atlas tree {version}.", { version: atlas.graph.tree.version })}</span>}
        </p>
        {atlas.loadError && <ErrorNote>{atlas.loadError}</ErrorNote>}
        {atlas.graph ? (
          <>
            <ConstellationMap
              graph={atlas.graph}
              starts={starts}
              label={t("Atlas passive tree. Click a passive to mark it as taken.")}
              guide={atlas.guide}
              owned={atlas.owned}
              onToggle={atlas.toggleOwned}
              focus={focus}
              icons={passiveIcons.icons}
            />
            <MapLegend icons={Object.keys(passiveIcons.icons).length > 0} />
            {passiveIcons.note && <p className="mt-2 text-[14px] text-parchment-faint">{t(passiveIcons.note)}</p>}
          </>
        ) : (
          !atlas.loadError && <p className="text-[17px] text-parchment-faint">{t("Unrolling the star charts…")}</p>
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
