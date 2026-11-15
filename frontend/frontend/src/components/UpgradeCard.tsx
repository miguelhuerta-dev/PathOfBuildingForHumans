interface UpgradeCardProps {
  title: string;
  description: string;
  dpsIncrease: number;
  ehpIncrease: number;
}

function UpgradeCard({
  title,
  description,
  dpsIncrease,
  ehpIncrease,
}: UpgradeCardProps) {
  return (
    <div
      style={{
        border: "2px solid green",
        padding: "16px",
        margin: "12px",
      }}
    >
      <h3>⬆ {title}</h3>

      <p>{description}</p>

      <p>+{dpsIncrease}% DPS</p>

      <p>+{ehpIncrease}% EHP</p>
    </div>
  );
}

export default UpgradeCard;
