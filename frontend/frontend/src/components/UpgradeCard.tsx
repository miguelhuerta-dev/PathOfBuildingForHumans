import AtlasDivider from "./AtlasDivider";
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
    <div className="bg-[#1E1812] border border-[#A8864B] p-5 relative">

      <p
        className="
        text-xs
        uppercase
        tracking-widest
        text-amber-500
        text-center
        mb-2
        ">

       ✦ Rare Item ✦


      </p>

      <div
        className="
        absolute
        inset-2
        border
        border-[#3A2F22]
        pointer-events-none
        "
      />

      <AtlasDivider />





      <h3 className="
        text-amber-300
        text-2xl
        font-bold
        text-center
        "
        style={{ fontFamily: "Cinzel" }}

      >
        {title.toUpperCase()}
      </h3>

      <AtlasDivider />

      


      <p className="text-center
      text-slate-300 mt-3">
        {description}
      </p>


      <div className="flex 
      justify-center gap-6 mt-4">
        <span className="text-emerald-400">
          +{dpsIncrease}% DPS
        </span>

        <span className="text-sky-400">
          +{ehpIncrease}% EHP
        </span>




      </div>
    </div>
  );
}

export default UpgradeCard;