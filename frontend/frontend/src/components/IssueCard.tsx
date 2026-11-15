interface IssueCardProps {
  title: string;
  description: string;
}

function IssueCard({
  title,
  description,
}: IssueCardProps) {
  return (
    <div
      style={{
        border: "2px solid orange",
        padding: "16px",
        margin: "12px",
      }}
    >
      <h3>⚠ {title}</h3>

      <p>{description}</p>
    </div>
  );
}

export default IssueCard;