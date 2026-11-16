import type { ReactNode } from "react";
import AtlasFrame from "./AtlasFrame";
import Medallion from "./Medallion";
import { AtlasStarIcon } from "./icons";

interface StatCardProps {
  title: string;
  value: string;
  icon: ReactNode;
}

export function StatCard({ title, value, icon }: StatCardProps) {
  return (
    <AtlasFrame variant="card" className="h-full">
      <div className="absolute -left-1 -top-1 text-gold-dim" aria-hidden="true">
        {icon}
      </div>
      <div className="flex h-full flex-col items-center justify-center py-3 text-center">
        <p className="font-display text-[15px] tracking-[0.18em] text-parchment-dim">{title}</p>
        <p className="engraved mt-1 font-display text-[46px] leading-none text-parchment">{value}</p>
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

  return (
    <AtlasFrame variant="card" className="h-full">
      <div className="flex items-center gap-6 py-2">
        <Medallion size={104}>
          <AtlasStarIcon className="h-11 w-11" />
        </Medallion>

        <div className="min-w-0 flex-1">
          <p className="font-display text-[15px] tracking-[0.18em] text-parchment-dim">BUILD SCORE</p>
          <p className="font-display leading-none">
            <span className="gold-text text-[64px]">{score.toFixed(1)}</span>
            <span className="ml-2 text-[26px] text-parchment-dim">/ {max}</span>
          </p>

          <div
            className="mt-3 h-3 border border-[#4a3a22] bg-[#060403] p-[2px] shadow-[inset_0_2px_4px_#000]"
            role="meter"
            aria-label="Build score"
            aria-valuenow={score}
            aria-valuemin={0}
            aria-valuemax={max}
          >
            <div className="metal-bar h-full" style={{ width: `${percent}%` }} />
          </div>
        </div>
      </div>
    </AtlasFrame>
  );
}
