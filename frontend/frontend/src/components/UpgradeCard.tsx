import AtlasDivider from "./AtlasDivider";
import AtlasFrame from "./AtlasFrame";

interface UpgradeCardProps {
  title: string;
  description: string;
  dpsIncrease: number;
  ehpIncrease: number;
}

function UpgradeCard({
  title,
  description,
  dpsIncrease,
  ehpIncrease,
}: UpgradeCardProps) {
  return (
    <AtlasFrame>
      <div
        className="
        bg-gradient-to-b
        from-[#21170F]
        via-[#16120E]
        to-[#120E0B]
        border
        border-[#8C6A34]
        p-5
        relative
        shadow-[inset_0_0_18px_rgba(0,0,0,0.65)]
        "
      >
        <div
          className="
          absolute
          inset-2
          border
          border-[#2A2118]
          pointer-events-none
          "
        />

        <p
          className="
          text-xs
          uppercase
          tracking-widest
          text-amber-500
          text-center
          mb-2
          "
        >
          ✦ Rare Item ✦
        </p>

        <AtlasDivider />

        <h3
          className="
          text-[#D4AF6A]
          text-2xl
          font-bold
          text-center
          "
          style={{
            fontFamily: "Cinzel",
          }}
        >
          {title.toUpperCase()}
        </h3>

        <AtlasDivider />

        <p className="text-center text-slate-300 mt-3">
          {description}
        </p>

        <div className="flex justify-center gap-6 mt-4">
          <span className="text-emerald-400">
            +{dpsIncrease}% DPS
          </span>

          <span className="text-sky-400">
            +{ehpIncrease}% EHP
          </span>
        </div>
      </div>
    </AtlasFrame>
  );
}

export default UpgradeCard;
