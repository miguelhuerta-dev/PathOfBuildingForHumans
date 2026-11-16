import { atlasArt } from "../assets/atlas";
import type { Upgrade } from "../types/Build";
import AtlasFrame from "./AtlasFrame";

const rarityStyles = {
  normal: { label: "NORMAL ITEM", title: "text-parchment" },
  magic: { label: "MAGIC ITEM", title: "text-[#8fa8ff]" },
  rare: { label: "RARE ITEM", title: "text-[#f2d27a]" },
  unique: { label: "UNIQUE ITEM", title: "text-[#e08a3c]" },
};

function UpgradeCard({ title, rarity, description, dpsIncrease, ehpIncrease }: Upgrade) {
  const style = rarityStyles[rarity];

  return (
    <AtlasFrame variant="card" className="text-center">
      <p className="font-display text-[13px] tracking-[0.3em] text-parchment-dim">{style.label}</p>
      <h3 className={`engraved font-display text-[30px] font-semibold tracking-[0.06em] ${style.title}`}>
        {title.toUpperCase()}
      </h3>
      <div
        className="mx-auto mt-2 h-px w-4/5 bg-gradient-to-r from-transparent via-gold-dim to-transparent"
        aria-hidden="true"
      />

      <div className="relative mx-auto mt-6 h-44 w-44">
        <div className="absolute inset-[18%] bg-[radial-gradient(circle,rgba(90,140,230,0.28),transparent_70%)]" />
        <img
          src={atlasArt.itemRareRing}
          alt={title}
          className="absolute inset-[12%] h-[76%] w-[76%] object-contain drop-shadow-[0_0_14px_rgba(100,150,255,0.45)]"
        />
        <img
          src={atlasArt.frameItem}
          alt=""
          className="pointer-events-none absolute inset-0 h-full w-full"
        />
      </div>

      <p className="mt-5 text-[19px] text-parchment/90">{description}</p>

      <div className="mx-auto mt-4 grid max-w-sm grid-cols-2 border-y border-gold-dim/40 py-3">
        <p className="border-r border-gold-dim/40 font-display text-[22px] text-verdigris">
          +{dpsIncrease}% <span className="text-[15px]">DPS</span>
        </p>
        <p className="font-display text-[22px] text-arcane">
          +{ehpIncrease}% <span className="text-[15px]">EHP</span>
        </p>
      </div>

      <button
        type="button"
        className="ui-button mx-auto mt-6 block h-14 w-full max-w-sm font-display text-[15px] tracking-[0.2em] text-parchment transition hover:brightness-125 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
      >
        VIEW DETAILS
      </button>
    </AtlasFrame>
  );
}

export default UpgradeCard;
