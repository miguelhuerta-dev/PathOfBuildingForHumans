import type { ReactNode } from "react";
import { atlasArt } from "../assets/atlas";

interface AtlasFrameProps {
  children: ReactNode;
  /** "iron" is the panel's frame tarnished to black iron, for the armoury. */
  variant?: "outer" | "panel" | "card" | "iron";
  pendant?: boolean;
  className?: string;
  contentClassName?: string;
}

function AtlasFrame({
  children,
  variant = "panel",
  pendant = false,
  className = "",
  contentClassName = "",
}: AtlasFrameProps) {
  return (
    <div className={`atlas-frame atlas-frame--${variant} ${className}`}>
      <div className="atlas-frame__surface" aria-hidden="true" />
      <div className="atlas-frame__border" aria-hidden="true" />

      {pendant && (
        <img
          src={atlasArt.pendant}
          alt=""
          className="pointer-events-none absolute left-1/2 top-0 z-10 h-24 w-auto -translate-x-1/2 -translate-y-[42%] drop-shadow-[0_4px_6px_rgba(0,0,0,0.8)]"
        />
      )}

      <div className={`relative ${contentClassName}`}>{children}</div>
    </div>
  );
}

export default AtlasFrame;
