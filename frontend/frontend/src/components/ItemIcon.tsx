import { useState } from "react";
import { officialIcon } from "../config/features";
import { AtlasStarIcon } from "./icons";

interface ItemIconProps {
  /** Icon URL from pathofexile.com, if the item came from the character. */
  src?: string;
  className?: string;
}

/** An item's official icon when available, the archive's star otherwise. */
function ItemIcon({ src, className = "h-12 w-12" }: ItemIconProps) {
  const [failed, setFailed] = useState(false);
  const url = officialIcon(src);

  if (!url || failed) {
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
      onError={() => setFailed(true)}
      className={`object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] ${className}`}
    />
  );
}

export default ItemIcon;
