import { mockBuild } from "../data/mockBuild";
import StatCard from "../components/StatCard";
import IssueCard from "../components/IssueCard";
import UpgradeCard from "../components/UpgradeCard";
import { formatNumber } from "../utils/formatNumber";

function Dashboard() {
  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-5xl font-bold">
          {mockBuild.name}
        </h1>

        <p className="text-emerald-400 mt-2">
          Build Health: Excellent
        </p>

        <p className="text-slate-400 text-sm">
          Priority: Fix Chaos Resistance
        </p>

        <p className="text-slate-400 mt-2">
          {mockBuild.ascendancy} • Level {mockBuild.level}
        </p>


        <div className="grid grid-cols-4 gap-4 mt-8">
          <div className="col-span-2">
            <StatCard
              title="Build Score"
              value={`${mockBuild.score} / 10`}
            />
          </div>

          <StatCard
            title="DPS"
            value={formatNumber(mockBuild.dps)}
          />

          <StatCard
            title="EHP"
            value={formatNumber(mockBuild.ehp)}
          />
        </div>

        <h2 className="text-2xl font-bold mt-10 mb-4">
          Problems
        </h2>

        {mockBuild.issues.map((issue) => (
          <IssueCard
            key={issue.id}
            title={issue.title}
            description={issue.description}
          />
        ))}

        <h2 className="text-2xl font-bold mt-10 mb-4">
          Recommended Upgrade
        </h2>

        <UpgradeCard
          title={mockBuild.recommendedUpgrade.title}
          description={mockBuild.recommendedUpgrade.description}
          dpsIncrease={mockBuild.recommendedUpgrade.dpsIncrease}
          ehpIncrease={mockBuild.recommendedUpgrade.ehpIncrease}
        />
      </div>
    </div>
  );
}

export default Dashboard;