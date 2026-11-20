import type { ReactNode } from "react";
import Medallion from "./Medallion";
import { useT } from "../i18n";

interface AtlasSectionHeaderProps {
  title: string;
  icon: ReactNode;
  tone?: "gold" | "blood";
}

/** Section titles are translated here, once for every section of the archive. */
function AtlasSectionHeader({ title, icon, tone = "gold" }: AtlasSectionHeaderProps) {
  const t = useT();
  return (
    <div className="-ml-[34px] -mt-[40px] mb-3 flex items-center gap-3">
      <Medallion size={80} tone={tone}>
        {icon}
      </Medallion>

      <h2 className="heading-text font-display text-[27px] font-medium tracking-[0.05em] pt-2">
        {t(title)}
      </h2>
    </div>
  );
}

export default AtlasSectionHeader;
