import { useState, type PointerEvent } from "react";
import type { Snapshot } from "../state/characterMemory";
import { formatNumber } from "../utils/formatNumber";
import AtlasFrame from "./AtlasFrame";
import AtlasSectionHeader from "./AtlasSectionHeader";
import { QuillIcon } from "./icons";

/**
 * The character's progress over the league: damage and survival, each on its
 * own chart (two scales never share one axis), with the level and date of every
 * moment on hover, and the same numbers as a table.
 *
 * Chart colours were checked on the dark surface for lightness, chroma, colour
 * blindness and contrast: ember for damage, verdigris for survival.
 */

const DPS_COLOR = "#d9773a";
const EHP_COLOR = "#2aa478";
const WIDTH = 560;
const HEIGHT = 170;
const PAD = { left: 52, right: 14, top: 14, bottom: 26 };

const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

function LineChart({ title, color, values, history }: { title: string; color: string; values: number[]; history: Snapshot[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...values);
  const min = Math.min(...values, max);
  const low = min === max ? 0 : min * 0.9;
  const plotW = WIDTH - PAD.left - PAD.right;
  const plotH = HEIGHT - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (values.length === 1 ? plotW / 2 : (i / (values.length - 1)) * plotW);
  const y = (v: number) => PAD.top + plotH - ((v - low) / Math.max(1, max - low)) * plotH;
  const path = values.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join("");
  const ticks = [low, (low + max) / 2, max];
  const last = values[values.length - 1];
  const first = values[0];
  const change = first > 0 ? ((last - first) / first) * 100 : 0;

  const onMove = (event: PointerEvent<SVGRectElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const rel = ((event.clientX - box.left) / box.width) * plotW;
    const index = values.length === 1 ? 0 : Math.round((rel / plotW) * (values.length - 1));
    setHover(Math.max(0, Math.min(values.length - 1, index)));
  };

  const shown = hover ?? values.length - 1;
  return (
    <figure className="iron-card px-4 py-3">
      <figcaption className="flex items-baseline justify-between gap-3">
        <span className="font-display text-[13px] tracking-[0.2em] text-parchment-dim">{title}</span>
        <span className="text-[14px] text-parchment-dim">
          <span className="font-display text-[20px] text-parchment">{formatNumber(values[shown])}</span>
          {hover === null && values.length > 1 && Math.abs(change) >= 0.5 && (
            <span className="ml-2 text-parchment-faint">
              {change > 0 ? "+" : "−"}
              {Math.abs(Math.round(change))}% since the first entry
            </span>
          )}
          {hover !== null && (
            <span className="ml-2 text-parchment-faint">
              level {history[shown].level} · {shortDate(history[shown].at)}
            </span>
          )}
        </span>
      </figcaption>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="mt-2 w-full" role="img" aria-label={`${title} over time`}>
        {ticks.map((tick, i) => (
          <g key={i}>
            <line x1={PAD.left} x2={WIDTH - PAD.right} y1={y(tick)} y2={y(tick)} stroke="rgb(170 160 150 / 0.12)" strokeWidth={1} />
            <text x={PAD.left - 8} y={y(tick) + 4} textAnchor="end" fontSize={11} fill="rgb(182 168 140 / 0.7)">
              {formatNumber(tick)}
            </text>
          </g>
        ))}
        <text x={PAD.left} y={HEIGHT - 6} fontSize={11} fill="rgb(182 168 140 / 0.7)">
          {shortDate(history[0].at)}
        </text>
        {values.length > 1 && (
          <text x={WIDTH - PAD.right} y={HEIGHT - 6} textAnchor="end" fontSize={11} fill="rgb(182 168 140 / 0.7)">
            {shortDate(history[history.length - 1].at)}
          </text>
        )}
        {values.length > 1 && <path d={path} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />}
        {hover !== null && (
          <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={PAD.top + plotH} stroke="rgb(216 180 106 / 0.45)" strokeWidth={1} />
        )}
        <circle cx={x(shown)} cy={y(values[shown])} r={4.5} fill={color} stroke="#0b0907" strokeWidth={2} />
        {/* A hit area larger than the line, so the hover is easy to catch. */}
        <rect
          x={PAD.left}
          y={0}
          width={plotW}
          height={HEIGHT}
          fill="transparent"
          onPointerMove={onMove}
          onPointerLeave={() => setHover(null)}
        />
      </svg>
    </figure>
  );
}

function ProgressPanel({ history }: { history: Snapshot[] }) {
  if (history.length === 0) return null;
  return (
    <AtlasFrame>
      <AtlasSectionHeader title="Your Progress" icon={<QuillIcon className="h-7 w-7" />} />
      <p className="mb-4 text-[16px] text-parchment-dim">
        {history.length === 1
          ? "The archive keeps a page each time your character changes. Come back after a few upgrades to see the line."
          : `${history.length} entries since ${shortDate(history[0].at)}: one each time your damage, defences or level changed.`}
      </p>
      <div className="grid gap-4 lg:grid-cols-2">
        <LineChart title="DPS" color={DPS_COLOR} values={history.map((s) => s.dps)} history={history} />
        <LineChart title="EFFECTIVE HP" color={EHP_COLOR} values={history.map((s) => s.ehp)} history={history} />
      </div>
      <details className="mt-3 text-[14px] text-parchment-dim">
        <summary className="cursor-pointer font-display text-[12px] tracking-[0.18em] text-parchment-faint hover:text-gold">SHOW AS A TABLE</summary>
        <table className="mt-2 w-full text-left">
          <thead className="font-display text-[11px] tracking-[0.14em] text-parchment-faint">
            <tr>
              <th className="py-1">WHEN</th>
              <th>LEVEL</th>
              <th>DPS</th>
              <th>EHP</th>
              <th>LIFE</th>
            </tr>
          </thead>
          <tbody>
            {[...history].reverse().map((s) => (
              <tr key={s.at} className="border-t border-[#2a2220]">
                <td className="py-1">{shortDate(s.at)}</td>
                <td>{s.level}</td>
                <td>{formatNumber(s.dps)}</td>
                <td>{formatNumber(s.ehp)}</td>
                <td>{formatNumber(s.life)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </AtlasFrame>
  );
}

export default ProgressPanel;
