import type { ReactNode } from "react";
import Medallion from "./Medallion";

interface AtlasSectionHeaderProps {
  title: string;
  icon: ReactNode;
  tone?: "gold" | "blood";
}

function AtlasSectionHeader({ title, icon, tone = "gold" }: AtlasSectionHeaderProps) {
  return (
    <div className="mb-5 flex items-center gap-4">
      <Medallion size={64} tone={tone}>
        {icon}
      </Medallion>

      <h2 className="gold-text font-display text-[26px] font-semibold tracking-[0.06em]">
        {title}
      </h2>
    </div>
  );
}

export default AtlasSectionHeader;
