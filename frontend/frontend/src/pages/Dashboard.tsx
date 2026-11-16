import { mockBuild } from "../data/mockBuild";
import StatCard from "../components/StatCard";
import IssueCard from "../components/IssueCard";
import UpgradeCard from "../components/UpgradeCard";
import { formatNumber } from "../utils/formatNumber";
import AnalysisCard from "../components/AnalysisCard";
import AtlasSeal from "../components/AtlasSeal";
import AtlasSectionHeader from "../components/AtlasSectionHeader";
import AtlasBackground from "../components/AtlasBackground";




function Dashboard() {
  return (
    <div className="
    
    min-h-screen 
    bg-gradient-to-b
    from-[#0B0907]
    via-black
    to-[#0B0907]
    relative  
    overflow-hidden
    text-white 
    p-8">


      <AtlasBackground />




      <div className="max-w-7xl mx-auto relative z-10">
        <div
          className="
            bg-[#16120E]
            border
            border-amber-700
            rounded-none
            p-8
            mb-8
            shadow-[0-0-60px-rgba(212,175,55,0.12)]
            "
        >

          <div className="flex justify-between items-start gap-8">

            <div className="flex items-center gap-6">
              <AtlasSeal label="INQ" />

              <div>
                <h1
                  className="
                  text-6xl
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

                <p className="text-slate-300 mt-4">
                  {mockBuild.ascendancy} • Level {mockBuild.level}
                </p>
              </div>
            </div>

            <div className="text-right">
              <p className="text-[#A8864B] text-sm tracking-widest">
                BUILD HEALTH
              </p>

              <p
                className="text-3xl"
                style={{
                  fontFamily: "Cinzel",
                }}
              >
                EXCELLENT
              </p>

              <div className="mt-4" />

              <p className="text-[#A8864B] text-sm tracking-widest">
                PRIORITY
              </p>

              <p className="text-amber-300">
                Fix Chaos Resistance
              </p>
            </div>

          </div>

          <div
            className="
            mt-6
            h-px
            bg-gradient-to-r
            from-transparent
            via-[#A8864B]
            to-transparent
            "
          />



          

        </div>

        <AnalysisCard />



        <div className="grid grid-cols-4 gap-4 mt-8">
          <div className="col-span-2">
            <StatCard
              hero
              title="ATLAS RATING"
              value={`${mockBuild.score} / 10`}
            />
          </div>

          <StatCard
            title="DAMAGE OUTPUT"
            value={formatNumber(mockBuild.dps)}
          />

          <StatCard
            title="SURVIVABILITY"
            value={formatNumber(mockBuild.ehp)}
          />
        </div>

        <AtlasSectionHeader
          title="THREAT REGISTER"
        />

        {mockBuild.issues.map((issue) => (
          <IssueCard
            key={issue.id}
            title={issue.title}
            description={issue.description}
            severity={issue.severity}
          />
        ))}

        <AtlasSectionHeader
          title="RECOMMENDED ARTIFACT"
        />

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