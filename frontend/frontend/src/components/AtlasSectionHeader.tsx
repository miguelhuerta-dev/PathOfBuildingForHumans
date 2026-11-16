import type { ReactNode } from "react";
import Medallion from "./Medallion";

interface AtlasSectionHeaderProps {
  title: string;
  icon: ReactNode;
  tone?: "gold" | "blood";
}

function AtlasSectionHeader({ title, icon, tone = "gold" }: AtlasSectionHeaderProps) {
  return (
    <div className="-ml-[34px] -mt-[40px] mb-3 flex items-center gap-3">
      <Medallion size={80} tone={tone}>
        {icon}
      </Medallion>

      <h2 className="heading-text font-display text-[27px] font-medium tracking-[0.05em] pt-2">
        {title}
      </h2>
    </div>
  );
}

export default AtlasSectionHeader;
