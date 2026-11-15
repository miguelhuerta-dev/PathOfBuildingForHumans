import { mockBuild } from "../data/mockBuild";
import StatCard from "../components/StatCard";
import IssueCard from "../components/IssueCard";
import UpgradeCard from "../components/UpgradeCard";

function Dashboard() {
  return (
    <div>
      <h1>{mockBuild.name}</h1>

      <p>Ascendancy: {mockBuild.ascendancy}</p>

      <p>Level: {mockBuild.level}</p>

      <hr />

      <StatCard
        title="Build Score"
        value={mockBuild.score}
      />

      <StatCard
        title="DPS"
        value={mockBuild.dps}
      />

      <StatCard
        title="EHP"
        value={mockBuild.ehp}
      />

      <h2>Problems</h2>

      {mockBuild.issues.map((issue) => (
        <IssueCard
          key={issue.id}
          title={issue.title}
          description={issue.description}
        />
      ))}


      <h2>Recommended Upgrade</h2>
      <UpgradeCard
        title={mockBuild.recommendedUpgrade.title}
        description={mockBuild.recommendedUpgrade.description}
        dpsIncrease={mockBuild.recommendedUpgrade.dpsIncrease}
        ehpIncrease={mockBuild.recommendedUpgrade.ehpIncrease}
/>
      
    </div>

    
  );
}

export default Dashboard;