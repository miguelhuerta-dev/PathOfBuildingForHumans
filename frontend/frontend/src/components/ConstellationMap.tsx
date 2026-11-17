import { memo, useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { atlasArt } from "../assets/atlas";
import type { TreeGraph } from "../tree/progress";
import type { TreeNode, TreeNodeKind } from "../tree/types";
import type { PassiveIcons } from "../state/usePassiveIcons";

/**
 * A passive tree (the Atlas or a character's) drawn as a constellation chart
 * over the painted star atlas. Positions and texts come from GGG's data; the
 * frames and marks are ours. In the desktop app each passive also shows its
 * icon, read from the player's own Path of Exile installation (never bundled
 * or downloaded).
 */

interface ViewBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

type NodeState = "owned" | "target" | "extra" | "idle";

const RADIUS: Record<TreeNodeKind, number> = {
  root: 95,
  normal: 34,
  notable: 58,
  wormhole: 62,
  keystone: 86,
  mastery: 62,
  jewel: 52,
};

const HIT_RADIUS = 110;
const PADDING = 600;
const MIN_WIDTH = 1200;
const DRAG_THRESHOLD_PX = 4;

/** Ids of the start nodes the player has (the Atlas centre, their class start); other starts stay unlit. */
type Starts = ReadonlySet<number>;

function nodeState(node: TreeNode, guide: ReadonlySet<number>, owned: ReadonlySet<number>, starts: Starts): NodeState {
  if (node.kind === "root") return starts.has(node.id) ? "owned" : "idle";
  if (owned.has(node.id)) return guide.size === 0 || guide.has(node.id) ? "owned" : "extra";
  return guide.has(node.id) ? "target" : "idle";
}

const isTaken = (state: NodeState) => state === "owned" || state === "extra";

const NODE_STYLE: Record<NodeState, { fill: string; stroke: string; opacity: number }> = {
  owned: { fill: "#f2dfa8", stroke: "#d9b36c", opacity: 1 },
  // Bronze, not gold: with icons the ring is what tells it apart from a guide passive.
  extra: { fill: "#a8864b", stroke: "#a8864b", opacity: 0.9 },
  target: { fill: "#0b0907", stroke: "#86d6b4", opacity: 1 },
  idle: { fill: "#15110d", stroke: "#bcae8f", opacity: 0.7 },
};

interface LayerProps {
  graph: TreeGraph;
  guide: ReadonlySet<number>;
  owned: ReadonlySet<number>;
  starts: Starts;
}

/** SVG id of each icon's <symbol>, by icon name. */
type IconIds = ReadonlyMap<string, string>;

const ICON_CLIP = "constellation-icon-clip";

/** Each icon is defined once and reused by every passive that shows it. */
const IconSymbols = memo(function IconSymbols({ icons, ids }: { icons: PassiveIcons; ids: IconIds }) {
  return (
    <>
      <clipPath id={ICON_CLIP} clipPathUnits="objectBoundingBox">
        <circle cx={0.5} cy={0.5} r={0.5} />
      </clipPath>
      {[...ids].map(([name, id]) => (
        <symbol key={id} id={id} viewBox="0 0 1 1">
          <image href={icons[name]} width={1} height={1} clipPath={`url(#${ICON_CLIP})`} />
        </symbol>
      ))}
    </>
  );
});

const RegionLabels = memo(function RegionLabels({ graph }: { graph: TreeGraph }) {
  return (
    <g aria-hidden="true" className="pointer-events-none select-none">
      {graph.tree.regions.map((region) => (
        <text
          key={`${region.name}@${region.x},${region.y}`}
          x={region.x}
          y={region.y}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={120}
          letterSpacing={12}
          fill="#d9b36c"
          fillOpacity={0.3}
          stroke="#000"
          strokeOpacity={0.6}
          strokeWidth={14}
          paintOrder="stroke"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {region.name.toUpperCase()}
        </text>
      ))}
    </g>
  );
});

const Edges = memo(function Edges({ graph, guide, owned, starts }: LayerProps) {
  return (
    <g aria-hidden="true" className="pointer-events-none">
      {graph.tree.edges.map(([a, b]) => {
        const from = graph.byId.get(a);
        const to = graph.byId.get(b);
        if (!from || !to) return null;
        const sa = nodeState(from, guide, owned, starts);
        const sb = nodeState(to, guide, owned, starts);
        const lit = isTaken(sa) && isTaken(sb);
        const planned = !lit && sa !== "idle" && sb !== "idle";
        const wormhole = from.kind === "wormhole" && to.kind === "wormhole";
        const colour = lit ? "#d9b36c" : planned ? "#86d6b4" : "#8c7f68";
        return (
          <g key={`${a}-${b}`}>
            <line
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke={colour}
              // With a plan on the map, the rest of the tree steps back.
              strokeOpacity={lit ? 0.9 : planned ? 0.75 : guide.size > 0 ? 0.22 : 0.38}
              strokeWidth={lit ? 16 : 9}
              strokeDasharray={planned || wormhole ? "40 30" : undefined}
            />
            {/* The path also keeps a minimum width on screen, so it stays readable when zoomed out. */}
            {(lit || planned) && (
              <line
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke={colour}
                strokeOpacity={0.85}
                strokeWidth={lit ? 2.5 : 2}
                vectorEffect="non-scaling-stroke"
              />
            )}
          </g>
        );
      })}
    </g>
  );
});

const Nodes = memo(function Nodes({
  graph,
  guide,
  owned,
  starts,
  iconIds,
  clickable,
}: LayerProps & { iconIds: IconIds; clickable: boolean }) {
  return (
    <g>
      {graph.tree.nodes.map((node) => {
        const state = nodeState(node, guide, owned, starts);
        const style = NODE_STYLE[state];
        const r = RADIUS[node.kind];
        const ring = node.kind === "keystone" || node.kind === "root";
        const iconName = isTaken(state) && node.activeIcon ? node.activeIcon : node.icon;
        const iconId = iconName ? iconIds.get(iconName) : undefined;
        const strokeWidth = node.kind === "normal" ? 8 : 12;
        return (
          <g
            key={node.id}
            data-id={node.id}
            opacity={state === "idle" && guide.size > 0 ? 0.45 : style.opacity}
            className={clickable && node.kind !== "root" ? "cursor-pointer" : undefined}
          >
            {/* Generous invisible hit area: small passives are only a few pixels wide when zoomed out. */}
            <circle cx={node.x} cy={node.y} r={Math.max(r * 1.8, HIT_RADIUS)} fill="transparent" />
            {state === "owned" && <circle cx={node.x} cy={node.y} r={r * 1.9} fill="url(#constellation-glow)" />}
            {state === "target" && <circle cx={node.x} cy={node.y} r={r * 2} fill="url(#constellation-plan)" />}
            {iconId ? (
              <>
                <circle cx={node.x} cy={node.y} r={r} fill="#0b0907" />
                <use href={`#${iconId}`} x={node.x - r} y={node.y - r} width={r * 2} height={r * 2} />
                {/* Passives outside the plan stay dim, like unlit stars. */}
                {state === "idle" && <circle cx={node.x} cy={node.y} r={r} fill="#0b0907" fillOpacity={0.5} />}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={r}
                  fill="none"
                  stroke={style.stroke}
                  strokeWidth={isTaken(state) ? strokeWidth * 1.5 : strokeWidth}
                />
                {state !== "idle" && (
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={r}
                    fill="none"
                    stroke={style.stroke}
                    strokeWidth={2}
                    vectorEffect="non-scaling-stroke"
                  />
                )}
              </>
            ) : (
              <>
                <circle cx={node.x} cy={node.y} r={r} fill={style.fill} stroke={style.stroke} strokeWidth={strokeWidth} />
                {state !== "idle" && (
                  <circle cx={node.x} cy={node.y} r={r} fill={style.fill} stroke={style.stroke} strokeWidth={2} vectorEffect="non-scaling-stroke" />
                )}
              </>
            )}
            {ring && (
              <circle cx={node.x} cy={node.y} r={r * 1.35} fill="none" stroke={style.stroke} strokeWidth={8} />
            )}
            {node.kind === "wormhole" && (
              <circle cx={node.x} cy={node.y} r={r * 0.45} fill="#8fbbe8" fillOpacity={0.8} />
            )}
          </g>
        );
      })}
    </g>
  );
});

/** A request to centre the map on a node; pass a new object to centre again on the same node. */
export interface MapFocus {
  id: number;
}

/** Effect picked on a choice node (passive masteries), by node id. */
export type Picks = ReadonlyMap<number, number>;

interface ConstellationMapProps {
  graph: TreeGraph;
  /** Nodes of the plan being followed. */
  guide: ReadonlySet<number>;
  /** Nodes the player has. */
  owned: ReadonlySet<number>;
  /** Start nodes the player has; the map opens centred on the first one. */
  starts: Starts;
  /** Accessible description of the map. */
  label: string;
  /** Lets the player mark passives by clicking them. */
  onToggle?: (id: number) => void;
  focus?: MapFocus | null;
  /** The game's icons by name; passives without one keep the app's own mark. */
  icons?: PassiveIcons;
  /** Effects chosen on mastery-like nodes by the guide and by the player. */
  picks?: { guide: Picks; owned: Picks };
}

const NO_ICONS: PassiveIcons = {};
const TOOLTIP_WIDTH = 288;

/** Width in tree units of the opening view around the player's start. */
const OPENING_WIDTH = 7000;

function fitView(graph: TreeGraph): ViewBox {
  const { minX, minY, maxX, maxY } = graph.tree.bounds;
  return { x: minX - PADDING, y: minY - PADDING, w: maxX - minX + PADDING * 2, h: maxY - minY + PADDING * 2 };
}

/** Margin in tree units around the passives the opening view frames. */
const OPENING_MARGIN = 900;

/**
 * Opens on what matters: the player's start, their passives and the guide's,
 * all in view. With nothing allocated yet it shows the start at a scale where
 * passives are readable.
 */
function openingView(graph: TreeGraph, whole: ViewBox, focusIds: Iterable<number>): ViewBox {
  const nodes = [...new Set(focusIds)].flatMap((id) => graph.byId.get(id) ?? []);
  if (nodes.length === 0) return whole;
  const xs = nodes.map((node) => node.x);
  const ys = nodes.map((node) => node.y);
  const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  // Just the box around those nodes: the SVG fits it into the map whatever the map's shape, so a
  // wide route fills a wide map. Never closer than the readable opening scale, never wider than the tree.
  const w = Math.min(whole.w, Math.max(OPENING_WIDTH, maxX - minX + OPENING_MARGIN * 2));
  const h = Math.min(whole.h, Math.max(OPENING_WIDTH / 2, maxY - minY + OPENING_MARGIN * 2));
  return { x: (minX + maxX) / 2 - w / 2, y: (minY + maxY) / 2 - h / 2, w, h };
}

/** Changes when the plan or the starts change, but not when the player takes another passive. */
function planKey(guide: ReadonlySet<number>, starts: Starts): string {
  let sum = 0;
  for (const id of guide) sum += id;
  return `${[...starts].join()}|${guide.size}|${sum}`;
}

function choiceText(node: TreeNode, effect: number | undefined): string | undefined {
  if (effect === undefined) return undefined;
  const index = node.effects?.indexOf(effect) ?? -1;
  return index >= 0 ? node.choices?.[index] : undefined;
}

function ConstellationMap({
  graph,
  guide,
  owned,
  starts,
  label,
  onToggle,
  focus,
  icons = NO_ICONS,
  picks,
}: ConstellationMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const home = useMemo(() => fitView(graph), [graph]);
  const iconIds = useMemo<IconIds>(
    () => new Map(Object.keys(icons).map((name, index) => [name, `constellation-icon-${index}`])),
    [icons],
  );
  const [view, setView] = useState<ViewBox>(() => openingView(graph, home, [...starts, ...guide, ...owned]));
  const [hover, setHover] = useState<{ node: TreeNode; left: number; top: number } | null>(null);
  const drag = useRef<{ x: number; y: number; view: ViewBox; moved: boolean } | null>(null);

  // A new tree, guide or class start re-opens the map framing the plan; taking a passive keeps the view.
  const plan = planKey(guide, starts);
  const [opened, setOpened] = useState({ graph, plan });
  if (opened.graph !== graph || opened.plan !== plan) {
    setOpened({ graph, plan });
    setView(openingView(graph, fitView(graph), [...starts, ...guide, ...owned]));
  }

  /** Screen pixel to tree units, using the SVG's own transform (handles letterboxing). */
  const toTree = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current;
    const matrix = svg?.getScreenCTM();
    if (!svg || !matrix) return null;
    const point = new DOMPoint(clientX, clientY).matrixTransform(matrix.inverse());
    return { x: point.x, y: point.y };
  }, []);

  const zoomAt = useCallback(
    (factor: number, clientX?: number, clientY?: number) => {
      setView((current) => {
        const maxW = home.w * 1.2;
        const w = Math.min(maxW, Math.max(MIN_WIDTH, current.w * factor));
        const scale = w / current.w;
        const anchor =
          clientX !== undefined && clientY !== undefined ? toTree(clientX, clientY) : null;
        const ax = anchor?.x ?? current.x + current.w / 2;
        const ay = anchor?.y ?? current.y + current.h / 2;
        return {
          x: ax - (ax - current.x) * scale,
          y: ay - (ay - current.y) * scale,
          w,
          h: current.h * scale,
        };
      });
    },
    [home.w, toTree],
  );

  // Wheel zoom needs a non-passive listener so the page does not scroll.
  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      zoomAt(event.deltaY > 0 ? 1.18 : 1 / 1.18, event.clientX, event.clientY);
    };
    element.addEventListener("wheel", onWheel, { passive: false });
    return () => element.removeEventListener("wheel", onWheel);
  }, [zoomAt]);

  // A new focus request (each one is a new object) centres the map on its node.
  const [centred, setCentred] = useState<MapFocus | null>(null);
  const focusNode = focus ? graph.byId.get(focus.id) : undefined;
  if (focus !== centred) {
    setCentred(focus ?? null);
    if (focusNode) {
      const w = Math.min(view.w, 5000);
      const h = (view.h / view.w) * w;
      setView({ x: focusNode.x - w / 2, y: focusNode.y - h / 2, w, h });
    }
  }

  const nodeAt = (target: EventTarget | null): TreeNode | null => {
    const element = (target as Element | null)?.closest?.("[data-id]");
    const id = element ? Number(element.getAttribute("data-id")) : NaN;
    return Number.isNaN(id) ? null : (graph.byId.get(id) ?? null);
  };

  const onPointerDown = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (event.button !== 0) return;
    drag.current = { x: event.clientX, y: event.clientY, view, moved: false };
  };

  const onPointerMove = (event: ReactPointerEvent<SVGSVGElement>) => {
    const state = drag.current;
    if (state) {
      const dx = event.clientX - state.x;
      const dy = event.clientY - state.y;
      if (!state.moved && Math.hypot(dx, dy) > DRAG_THRESHOLD_PX) {
        state.moved = true;
        event.currentTarget.setPointerCapture(event.pointerId);
      }
      if (state.moved) {
        const box = event.currentTarget.getBoundingClientRect();
        const unitsPerPx = Math.max(state.view.w / box.width, state.view.h / box.height);
        setView({ ...state.view, x: state.view.x - dx * unitsPerPx, y: state.view.y - dy * unitsPerPx });
        setHover(null);
        return;
      }
    }
    const node = nodeAt(event.target);
    const box = containerRef.current?.getBoundingClientRect();
    if (node && box) {
      const x = event.clientX - box.left;
      const y = event.clientY - box.top;
      // Keep the tooltip inside the map: flip it to the left of the pointer near the right edge.
      const left = x + 18 + TOOLTIP_WIDTH > box.width ? Math.max(8, x - 18 - TOOLTIP_WIDTH) : x + 18;
      setHover({ node, left, top: Math.max(8, y - 20) });
    } else if (hover) setHover(null);
  };

  const onPointerUp = (event: ReactPointerEvent<SVGSVGElement>) => {
    const state = drag.current;
    drag.current = null;
    if (state?.moved || !onToggle) return;
    const node = nodeAt(event.target);
    if (node && node.kind !== "root") onToggle(node.id);
  };

  const hoverState = hover ? nodeState(hover.node, guide, owned, starts) : null;
  const guidePick = hover && picks ? choiceText(hover.node, picks.guide.get(hover.node.id)) : undefined;
  const ownPick = hover && picks ? choiceText(hover.node, picks.owned.get(hover.node.id)) : undefined;

  return (
    <div
      ref={containerRef}
      className="relative h-[clamp(480px,68vh,760px)] overflow-hidden border border-gold-dim/50 bg-ink shadow-[inset_0_0_60px_#000]"
    >
      <img
        src={atlasArt.starAtlas}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-70"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_75%_at_50%_50%,rgba(11,9,7,0.35),rgba(0,0,0,0.85)_100%)]"
      />

      <svg
        ref={svgRef}
        role="img"
        aria-label={label}
        viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
        className="relative h-full w-full touch-none select-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={() => setHover(null)}
      >
        <defs>
          <radialGradient id="constellation-glow">
            <stop offset="0%" stopColor="#f2dfa8" stopOpacity={0.55} />
            <stop offset="100%" stopColor="#f2dfa8" stopOpacity={0} />
          </radialGradient>
          <radialGradient id="constellation-plan">
            <stop offset="0%" stopColor="#86d6b4" stopOpacity={0.45} />
            <stop offset="100%" stopColor="#86d6b4" stopOpacity={0} />
          </radialGradient>
          <IconSymbols icons={icons} ids={iconIds} />
        </defs>
        <RegionLabels graph={graph} />
        <Edges graph={graph} guide={guide} owned={owned} starts={starts} />
        <Nodes
          graph={graph}
          guide={guide}
          owned={owned}
          starts={starts}
          iconIds={iconIds}
          clickable={onToggle !== undefined}
        />
        {focusNode && (
          <circle
            cx={focusNode.x}
            cy={focusNode.y}
            r={RADIUS[focusNode.kind] * 2.4}
            fill="none"
            stroke="#e8935a"
            strokeWidth={14}
            className="pointer-events-none"
          />
        )}
      </svg>

      <div className="absolute right-3 top-3 flex flex-col gap-1">
        {[
          { label: "Zoom in", text: "+", action: () => zoomAt(1 / 1.4) },
          { label: "Zoom out", text: "−", action: () => zoomAt(1.4) },
          { label: "Show the whole tree", text: "⌂", action: () => setView(home) },
        ].map((control) => (
          <button
            key={control.label}
            type="button"
            aria-label={control.label}
            title={control.label}
            onClick={control.action}
            className="nav-plate h-9 w-9 border border-gold-dim/60 font-display text-[18px] text-parchment hover:text-gold"
          >
            {control.text}
          </button>
        ))}
      </div>

      {hover && (
        <div
          role="tooltip"
          className="pointer-events-none absolute z-10 border border-gold-dim/70 bg-[#0b0907]/95 px-4 py-3 shadow-[0_8px_24px_#000]"
          style={{ left: hover.left, top: hover.top, width: TOOLTIP_WIDTH }}
        >
          <p className="font-display text-[15px] tracking-[0.06em] text-gold">{hover.node.name}</p>
          {hover.node.region && <p className="text-[14px] text-parchment-faint">{hover.node.region}</p>}
          <ul className="mt-1 flex flex-col gap-0.5 text-[15px] leading-snug text-parchment">
            {(hover.node.stats ?? []).map((stat) => (
              <li key={stat}>{stat}</li>
            ))}
          </ul>
          {guidePick || ownPick ? (
            <dl className="mt-1 flex flex-col gap-1 text-[14px] leading-snug">
              {guidePick && (
                <div>
                  <dt className="font-display text-[12px] tracking-[0.16em] text-verdigris">GUIDE PICKS</dt>
                  <dd className="text-parchment">{guidePick}</dd>
                </div>
              )}
              {ownPick && (
                <div>
                  <dt className="font-display text-[12px] tracking-[0.16em] text-gold">YOU PICKED</dt>
                  <dd className="text-parchment">{ownPick}</dd>
                </div>
              )}
            </dl>
          ) : (
            hover.node.choices && (
              <ul className="mt-1 flex flex-col gap-0.5 text-[14px] leading-snug text-parchment-dim">
                {hover.node.choices.map((choice) => (
                  <li key={choice}>• {choice}</li>
                ))}
              </ul>
            )
          )}
          {hoverState && hoverState !== "idle" && hover.node.kind !== "root" && (
            <p className="mt-2 font-display text-[12px] tracking-[0.16em] text-verdigris">
              {hoverState === "target" ? "IN THE GUIDE · NOT TAKEN" : hoverState === "extra" ? "TAKEN · NOT IN THE GUIDE" : "TAKEN"}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/** Colour key for the node states, shown under a map. */
export function MapLegend({ icons = false }: { icons?: boolean }) {
  // With the game's icons a passive's state shows as its ring; without them, as its fill.
  const items = icons
    ? [
        { label: "Taken", swatch: "border-[3px] border-[#d9b36c] bg-[#3a2c1a] shadow-[0_0_8px_#f2dfa8aa]" },
        { label: "In the guide, not taken", swatch: "border-2 border-verdigris bg-[#2a2016]" },
        { label: "Taken, not in the guide", swatch: "border-[3px] border-[#a8864b] bg-[#3a2c1a]" },
        { label: "Not planned", swatch: "border-2 border-parchment-faint bg-[#15110d] opacity-60" },
      ]
    : [
        { label: "Taken", swatch: "border-2 border-gold bg-[#f2dfa8]" },
        { label: "In the guide, not taken", swatch: "border-2 border-verdigris bg-ink" },
        { label: "Taken, not in the guide", swatch: "border-2 border-[#a8864b] bg-gold-dim" },
        { label: "Not planned", swatch: "border-2 border-parchment-faint bg-stone opacity-60" },
      ];
  return (
    <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-[15px] text-parchment-dim">
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-2">
          <span aria-hidden="true" className={`inline-block h-4 w-4 rounded-full ${item.swatch}`} />
          {item.label}
        </li>
      ))}
    </ul>
  );
}

export default ConstellationMap;
