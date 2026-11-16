import type { ReactNode } from "react";
import { atlasArt } from "../assets/atlas";

interface MedallionProps {
  children: ReactNode;
  size?: number;
  tone?: "gold" | "blood";
}

const tones = {
  gold: "bg-[radial-gradient(circle_at_50%_40%,#3a2a14,#0b0907_75%)] text-gold",
  blood: "bg-[radial-gradient(circle_at_50%_40%,#5a1610,#120403_75%)] text-[#f08a78]",
};

function Medallion({ children, size = 64, tone = "gold" }: MedallionProps) {
  const inner = Math.round(size * 0.58);

  return (
    <div
      className="relative grid shrink-0 place-items-center"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <div
        className={`textured grid place-items-center overflow-hidden rounded-full ${tones[tone]}`}
        style={{ width: inner, height: inner }}
      >
        {children}
      </div>
      <img
        src={atlasArt.medallion}
        alt=""
        className="pointer-events-none absolute inset-0 h-full w-full drop-shadow-[0_3px_5px_rgba(0,0,0,0.8)]"
      />
    </div>
  );
}

export default Medallion;
