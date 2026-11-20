import { useContext } from "react";
import { LEAGUE_ICON_KEYS, leagueIcon } from "../data/leagues";
import { GameLocation } from "../state/useItemArt";
import { usePassiveIcons } from "../state/usePassiveIcons";

interface LeagueBadgeProps {
  league: string;
  /** "icon": the logo alone, with the name as a tooltip; "full": logo and name. */
  variant?: "icon" | "full";
  className?: string;
}

/**
 * A league's mark: the Atlas icon the game uses for that mechanic, read from the
 * player's installation, set in a small iron medallion. Without the game, or for
 * leagues the Atlas has no icon for, an engraved plate with the name.
 */
function LeagueBadge({ league, variant = "full", className = "" }: LeagueBadgeProps) {
  const clientLog = useContext(GameLocation);
  // All league icons are read together, once, and shared by every badge.
  const { icons } = usePassiveIcons(LEAGUE_ICON_KEYS, clientLog);
  const key = leagueIcon(league);
  const src = key ? icons[key] : undefined;

  return (
    <span title={`${league} league`} className={`inline-flex items-center gap-1.5 align-middle ${className}`}>
      {src ? (
        <span className="league-medal grid h-6 w-6 shrink-0 place-items-center rounded-full">
          <img src={src} alt="" className="h-[78%] w-[78%] object-contain" />
        </span>
      ) : (
        variant === "icon" && <span className="league-plate px-1.5 font-display text-[9px] leading-4 tracking-[0.14em]">{league.toUpperCase()}</span>
      )}
      {variant === "full" && <span className="font-display text-[11px] tracking-[0.16em] text-gold-dim">{league.toUpperCase()}</span>}
    </span>
  );
}

export default LeagueBadge;
