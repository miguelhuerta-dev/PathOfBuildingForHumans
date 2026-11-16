import { atlasArt } from "../assets/atlas";
import type { Upgrade } from "../types/Engine";
import { changeTone, formatSignedPercent } from "../utils/format";
import { rarityStyle } from "../utils/rarity";
import AtlasFrame from "./AtlasFrame";
import ItemIcon from "./ItemIcon";
import { officialIcon } from "../config/features";
import { AtlasStarIcon } from "./icons";


interface UpgradeCardProps {
  upgrade: Upgrade;
  onViewDetails?: () => void;
}

/** The guide's item for one slot, with the measured effect of equipping it. */
function UpgradeCard({ upgrade, onViewDetails }: UpgradeCardProps) {
  const style = rarityStyle(upgrade.item.rarity);
  const isRing = upgrade.slot.startsWith("Ring");
  const mods = [...upgrade.item.implicits, ...upgrade.item.explicits].slice(0, 6);

  return (
    <AtlasFrame variant="card" className="text-center">
      <p className="font-display text-[13px] tracking-[0.3em] text-parchment-dim">
        {style.label} · {upgrade.slot.toUpperCase()}
      </p>
      <h3 className={`engraved font-display text-[26px] font-semibold tracking-[0.04em] ${style.tone}`}>
        {upgrade.item.name.toUpperCase()}
      </h3>
      {upgrade.item.base && upgrade.item.base !== upgrade.item.name && (
        <p className="text-[16px] text-parchment-dim">{upgrade.item.base}</p>
      )}
      <div
        className="mx-auto mt-2 h-px w-4/5 bg-gradient-to-r from-transparent via-gold-dim to-transparent"
        aria-hidden="true"
      />

      <div className="relative mx-auto mt-5 h-36 w-36">
        <div className="absolute inset-[18%] bg-[radial-gradient(circle,rgba(220,170,90,0.25),transparent_70%)]" />
        {officialIcon(upgrade.item.icon) ? (
          <div className="absolute inset-[18%] flex items-center justify-center overflow-hidden">
            <ItemIcon src={upgrade.item.icon} className="h-auto max-h-full w-auto max-w-full" />
          </div>
        ) : isRing ? (
          <img
            src={atlasArt.itemRareRing}
            alt=""
            className="absolute inset-[12%] h-[76%] w-[76%] object-contain drop-shadow-[0_0_14px_rgba(100,150,255,0.45)]"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-gold-dim">
            <AtlasStarIcon className="h-14 w-14" />
          </div>
        )}
        <img src={atlasArt.frameItem} alt="" className="pointer-events-none absolute inset-0 h-full w-full" />
      </div>

      {mods.length > 0 && (
        <ul className="mx-auto mt-4 max-w-sm space-y-0.5 text-[16px] text-[#9fb6e8]">
          {mods.map((mod) => (
            <li key={mod}>{mod}</li>
          ))}
        </ul>
      )}

      <div className="mx-auto mt-4 grid max-w-sm grid-cols-2 border-y border-gold-dim/40 py-3">
        <p className={`border-r border-gold-dim/40 font-display text-[22px] ${changeTone(upgrade.dpsChange)}`}>
          {formatSignedPercent(upgrade.dpsChange)} <span className="text-[15px]">DPS</span>
        </p>
        <p className={`font-display text-[22px] ${changeTone(upgrade.ehpChange)}`}>
          {formatSignedPercent(upgrade.ehpChange)} <span className="text-[15px]">EHP</span>
        </p>
      </div>

      <p className="mt-3 flex items-center justify-center gap-2 text-[16px] text-parchment-faint">
        {upgrade.current && <ItemIcon src={upgrade.currentIcon} className="h-10 w-10" />}
        <span>
          Replaces {upgrade.current ? <span className="text-parchment-dim">{upgrade.current}</span> : "an empty slot"}
        </span>
      </p>

      {onViewDetails && (
        <button
          type="button"
          onClick={onViewDetails}
          className="ui-button mx-auto mt-5 block h-14 w-full max-w-sm font-display text-[15px] tracking-[0.2em] text-parchment transition hover:brightness-125 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
        >
          VIEW IN GUIDE
        </button>
      )}
    </AtlasFrame>
  );
}

export default UpgradeCard;
