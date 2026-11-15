import { mockBuild } from "../data/mockBuild";
import StatCard from "../components/StatCard";
import IssueCard from "../components/IssueCard";
import UpgradeCard from "../components/UpgradeCard";
import { formatNumber } from "../utils/formatNumber";




function Dashboard() {
  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div
          className="
  bg-slate-900
  border
  border-slate-800
  rounded-3xl
  p-8
  mb-8
  "
        >
          <h1 className="text-6xl font-black tracking-tight">
            {mockBuild.name}
          </h1>

          <p className="text-emerald-400 mt-2 text-lg font-semibold">
            BUILD HEALTH: EXCELLENT
          </p>

          <p className="text-amber-400 text-sm mt-1 font-medium tracking-wide">
            PRIORITY: Fix Chaos Resistance
          </p>

          <p className="text-slate-400 mt-3">
            {mockBuild.ascendancy} • Level {mockBuild.level}
          </p>
        </div>


        <div className="grid grid-cols-4 gap-4 mt-8">
          <div className="col-span-2">
            <StatCard
              hero
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

        <h2 className="text-2xl font-bold mt-10 mb-4 text-amber-300">
          Critical Issues
        </h2>

        {mockBuild.issues.map((issue) => (
          <IssueCard
            key={issue.id}
            title={issue.title}
            description={issue.description}
          />
        ))}

        <h2 className="text-2xl font-bold mt-10 mb-4">
          Next Best Upgrade
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