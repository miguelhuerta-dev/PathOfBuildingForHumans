import type { Severity } from "../analysis/analyze";
import AtlasFrame from "./AtlasFrame";
import { SkullIcon, WarningIcon } from "./icons";
import { useT } from "../i18n";

const severityStyles = {
  high: {
    label: "CRITICAL",
    labelColor: "text-[#ef7563]",
    block: "bg-[linear-gradient(180deg,#a3241a,#4a0c07)] shadow-[inset_-1px_0_0_#b8332580,0_0_24px_rgba(200,50,30,0.35)]",
    icon: <SkullIcon className="h-7 w-7 text-[#f0a495]" />,
  },
  medium: {
    label: "WARNING",
    labelColor: "text-amber",
    block: "bg-[linear-gradient(180deg,#a8731c,#4a3008)] shadow-[inset_-1px_0_0_#c2861f80]",
    icon: <WarningIcon className="h-7 w-7 text-[#f6d38f]" />,
  },
  low: {
    label: "MINOR",
    labelColor: "text-parchment-dim",
    block: "bg-[linear-gradient(180deg,#3d3427,#1a150f)]",
    icon: <WarningIcon className="h-7 w-7 text-parchment-dim" />,
  },
};

interface IssueCardProps {
  title: string;
  impact: string;
  remedy: string;
  severity: Severity;
}

function IssueCard({ title, impact, remedy, severity }: IssueCardProps) {
  const t = useT();
  const style = severityStyles[severity];

  return (
    <AtlasFrame variant="card" className="p-[10px]">
      <article className="flex items-stretch">
        <div className={`textured flex w-[76px] shrink-0 items-center justify-center ${style.block}`}>
          <div className="grid h-12 w-12 place-items-center rounded-full border border-gold-dim/70 bg-black/40">
            {style.icon}
          </div>
        </div>

        <div className="flex-1 px-5 py-3">
          <p className={`font-display text-[13px] tracking-[0.22em] ${style.labelColor}`}>{t(style.label)}</p>
          <h3 className="title-text font-display text-[23px] font-semibold leading-tight">{title}</h3>
          <p className="mt-1 text-[17px] text-parchment/85">{impact}</p>
          <p className="mt-1 text-[16px] text-verdigris">
            <span className="text-parchment-faint">{t("Remedy:")} </span>
            {remedy}
          </p>
        </div>

      </article>
    </AtlasFrame>
  );
}

export default IssueCard;
