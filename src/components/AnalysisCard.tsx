import type { Analysis } from "../analysis/analyze";
import AtlasFrame from "./AtlasFrame";
import AtlasSectionHeader from "./AtlasSectionHeader";
import { QuillIcon } from "./icons";

interface AnalysisCardProps {
  analysis: Analysis;
}

function Stat({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div>
      <p className="text-[17px] text-parchment-dim">{label}</p>
      <p className={`text-[22px] font-semibold ${tone}`}>{value}</p>
    </div>
  );
}

function AnalysisCard({ analysis }: AnalysisCardProps) {
  const healthTone =
    analysis.health === "Excellent" || analysis.health === "Good" ? "text-verdigris" : "text-ember";

  return (
    <AtlasFrame>
      <div className="grid gap-8 md:grid-cols-[1fr_auto_1.1fr] md:items-center">
        <div>
          <AtlasSectionHeader title="Scholar's Verdict" icon={<QuillIcon className="h-6 w-6" />} />
          <p className="text-[19px] leading-snug text-parchment/90">{analysis.verdict}</p>
        </div>

        <div
          className="hidden h-28 w-px bg-gradient-to-b from-transparent via-gold-dim to-transparent md:block"
          aria-hidden="true"
        />

        <div className="grid grid-cols-2 gap-x-8 gap-y-5">
          <Stat label={`Ready for ${analysis.stageLabel}`} value={analysis.health} tone={healthTone} />
          <Stat label="Primary Weakness" value={analysis.primaryWeakness} tone="text-ember" />
          <Stat label="Estimated Gain" value={analysis.estimatedGain} tone="text-gold" />
          <Stat label="Recommended Action" value={analysis.recommendedAction} tone="text-arcane" />
        </div>
      </div>
    </AtlasFrame>
  );
}

export default AnalysisCard;
