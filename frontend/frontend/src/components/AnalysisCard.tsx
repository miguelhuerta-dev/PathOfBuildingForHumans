import AtlasSectionHeader from "./AtlasSectionHeader";
import AtlasFrame from "./AtlasFrame";

function AnalysisCard() {
  return (
    <AtlasFrame>
      <div
        className="
        bg-[#16120E]
        border
        border-[#A8864B]
        p-6
        relative
        "
      >
        <div
          className="
          absolute
          inset-2
          border
          border-[#3A2F22]
          pointer-events-none
          "
        />

        <AtlasSectionHeader
          title="SCHOLAR'S VERDICT"
        />

        <div className="mt-6 grid grid-cols-2 gap-6">

          <div>
            <p className="text-slate-500 text-sm uppercase tracking-wide">
              Mapping Performance
            </p>

            <p className="text-emerald-400 font-semibold mt-1">
              Excellent
            </p>
          </div>

          <div>
            <p className="text-slate-500 text-sm uppercase tracking-wide">
              Primary Weakness
            </p>

            <p className="text-orange-400 font-semibold mt-1">
              Chaos Resistance
            </p>
          </div>

          <div>
            <p className="text-slate-500 text-sm uppercase tracking-wide">
              Estimated Gain
            </p>

            <p className="text-amber-300 font-semibold mt-1">
              +18% Survivability
            </p>
          </div>

          <div>
            <p className="text-slate-500 text-sm uppercase tracking-wide">
              Recommended Action
            </p>

            <p className="text-sky-400 font-semibold mt-1">
              Replace Current Ring
            </p>
          </div>

        </div>

      </div>
    </AtlasFrame>
  );
}

export default AnalysisCard;