interface IssueCardProps {
  title: string;
  description: string;
}

function IssueCard({
  title,
  description,
}: IssueCardProps) {
  return (
    <div className="bg-orange-950 border border-orange-700 rounded-xl p-4 mb-3">
      <h3 className="font-bold text-orange-300">
        ⚠ {title}
      </h3>

      <p className="text-orange-100 mt-2">
        {description}
      </p>
    </div>
  );
}

export default IssueCard;