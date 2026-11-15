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
    <div className="bg-green-950 border border-green-700 rounded-xl p-5">
      <h3 className="text-green-300 font-bold">
        ⬆ {title}
      </h3>

      <p className="mt-2">
        {description}
      </p>

      <div className="mt-4 flex gap-6">
        <span>+{dpsIncrease}% DPS</span>
        <span>+{ehpIncrease}% EHP</span>
      </div>
    </div>
  );
}

export default UpgradeCard;