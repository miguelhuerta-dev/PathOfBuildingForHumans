import { useState } from "react";
import { officialIcon } from "../config/features";
import { useItemArt } from "../state/useItemArt";
import { AtlasStarIcon } from "./icons";

interface ItemIconProps {
  /** Icon URL from pathofexile.com or poe.ninja, when the item has one. */
  src?: string;
  /** The item's base type; without an official icon, its art is read from the player's game. */
  base?: string;
  className?: string;
}

/**
 * An item's official icon when available, else the game's own art for its
 * base (from the player's installation), else the archive's star.
 */
function ItemIcon({ src, base, className = "h-12 w-12" }: ItemIconProps) {
  const [failed, setFailed] = useState<string | null>(null);
  const official = officialIcon(src);
  const usable = official && failed !== official ? official : undefined;
  const art = useItemArt(usable ? undefined : base);
  const url = usable ?? (art && failed !== art ? art : undefined);

  if (!url) {
    return (
      <span className={`grid place-items-center text-gold-dim ${className}`} aria-hidden="true">
        <AtlasStarIcon className="h-3/5 w-3/5" />
      </span>
    );
  }
  return (
    <img
      src={url}
      alt=""
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(url)}
      className={`object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] ${className}`}
    />
  );
}

export default ItemIcon;
