import { mockBuild } from "../data/mockBuild";
import StatCard from "../components/StatCard";
import IssueCard from "../components/IssueCard";
import UpgradeCard from "../components/UpgradeCard";
import { formatNumber } from "../utils/formatNumber";
import AnalysisCard from "../components/AnalysisCard";




function Dashboard() {
  return (
    <div className="
    min-h-screen 
    bg-gradient-to-b
    from-slate-950
    via-black
    to-slate-950
    text-white 
    p-8">







      <div className="max-w-7xl mx-auto">
        <div
          className="
            bg-slate-900
            border
            border-amber-700
            rounded-3xl
            p-8
            mb-8
            shadow-[0-0-60px-rgba(212,175,55,0.12)]
            "
          >
        
          <h1 className="
          inline-block
          text-8xl 
          font-black 
          tracking-tight 
          text-white
          
          "
            style={{ 
              fontFamily: "Cinzel", 
            }}
          >
            {mockBuild.name}
          </h1>



          <p className="text-amber-300 mt-2 text-lg font-semibold">
            BUILD HEALTH: EXCELLENT
          </p>

          <p className="text-amber-400 text-sm mt-1 font-medium tracking-wide">
            PRIORITY: Fix Chaos Resistance
          </p>

          <div className="
          mt-4
          h-px
          bg-gradient-to-r
          from-transparent
          via-amber-500
          to-transparent
          "
          />
            {mockBuild.ascendancy} • Level {mockBuild.level}
          
        </div>

        <AnalysisCard />



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