interface IssueCardProps {
    title: string;
    description: string;
    severity: "low" | "medium" | "high";
}

function IssueCard({
    title,
    description,
    severity,
}: IssueCardProps) {
    const styles = {
        high: {
            label: "CRITICAL",
            color: "text-red-400",
            border: "border-red-700",
        },

        medium: {
            label: "WARNING",
            color: "text-orange-400",
            border: "border-orange-700",
        },

        low: {
            label: "MINOR",
            color: "text-yellow-400",
            border: "border-yellow-700",
        },
    };

    const current = styles[severity];

    return (
        <div
            className={`
        bg-[#16120E]
        border-l-8
        p-4
        mb-3
        ${current.border}
      `}
        >
            <p
                className={`
          text-xs
          uppercase
          tracking-widest
          ${current.color}
        `}
            >
                {current.label}
            </p>

            <h3 className="font-bold mt-2">
                {title}
            </h3>


            <p className="text-slate-500 mt-2 text-sm uppercase tracking-wide">
                Expected Impact
            </p>

            <p className="text-red-200 mt-1 font-medium">
                {description}
            </p>



        </div>
    );
}

export default IssueCard;
