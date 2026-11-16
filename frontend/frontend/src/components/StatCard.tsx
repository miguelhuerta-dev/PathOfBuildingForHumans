import type { ReactNode } from "react";
import AtlasFrame from "./AtlasFrame";
import Medallion from "./Medallion";
import { AtlasStarIcon } from "./icons";

function ArcaneRings() {
  return (
    <svg
      viewBox="0 0 200 200"
      className="pointer-events-none absolute left-1/2 top-1/2 h-[150%] -translate-x-1/2 -translate-y-1/2 text-gold-dim opacity-[0.13]"
      fill="none"
      stroke="currentColor"
      aria-hidden="true"
    >
      <circle cx="100" cy="100" r="92" />
      <circle cx="100" cy="100" r="70" />
      <circle cx="100" cy="100" r="40" />
      <path d="M100 4v192M4 100h192M32 32l136 136M168 32L32 168" strokeWidth="0.6" />
    </svg>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  icon: ReactNode;
}

export function StatCard({ title, value, icon }: StatCardProps) {
  return (
    <AtlasFrame variant="card" className="h-full overflow-hidden">
      <ArcaneRings />
      <div className="absolute -left-3 -top-3">
        <Medallion size={50}>{icon}</Medallion>
      </div>
      <div className="relative flex h-full flex-col items-center justify-center py-4 text-center">
        <p className="font-display text-[15px] tracking-[0.2em] text-parchment-dim">{title}</p>
        <p className="title-text mt-1 font-display text-[50px] font-semibold leading-none">{value}</p>
      </div>
    </AtlasFrame>
  );
}

interface ScoreCardProps {
  score: number;
  max?: number;
}

export function ScoreCard({ score, max = 10 }: ScoreCardProps) {
  const percent = Math.max(0, Math.min(100, (score / max) * 100));
  const radius = 58;
  const circumference = 2 * Math.PI * radius;

  return (
    <AtlasFrame variant="card" className="h-full">
      <div className="flex items-center gap-6 py-1">
        <div className="relative grid h-[132px] w-[132px] shrink-0 place-items-center">
          <svg viewBox="0 0 132 132" className="absolute inset-0 -rotate-90" aria-hidden="true">
            <defs>
              <linearGradient id="score-arc" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#fff0c4" />
                <stop offset="0.5" stopColor="#d9b36c" />
                <stop offset="1" stopColor="#8a6a30" />
              </linearGradient>
            </defs>
            <circle cx="66" cy="66" r={radius} fill="none" stroke="#0a0705" strokeWidth="8" />
            <circle
              cx="66"
              cy="66"
              r={radius}
              fill="none"
              stroke="url(#score-arc)"
              strokeWidth="5"
              strokeDasharray={`${(percent / 100) * circumference} ${circumference}`}
              className="drop-shadow-[0_0_6px_rgba(230,180,90,0.6)]"
            />
          </svg>
          <Medallion size={104}>
            <AtlasStarIcon className="h-11 w-11" />
          </Medallion>
        </div>

        <div className="min-w-0 flex-1">
          <p className="font-display text-[15px] tracking-[0.2em] text-parchment-dim">BUILD SCORE</p>
          <p className="font-display leading-none">
            <span className="title-text text-[68px] font-semibold">{score.toFixed(1)}</span>
            <span className="ml-2 text-[26px] text-parchment-dim">/ {max}</span>
          </p>

          <div
            className="mt-3 h-4 border border-[#4a3a22] bg-[#060403] p-[3px] shadow-[inset_0_2px_4px_#000]"
            role="meter"
            aria-label="Build score"
            aria-valuenow={score}
            aria-valuemin={0}
            aria-valuemax={max}
          >
            <div className="metal-bar h-full shadow-[0_0_10px_rgba(230,180,90,0.45)]" style={{ width: `${percent}%` }} />
          </div>
        </div>
      </div>
    </AtlasFrame>
  );
}
