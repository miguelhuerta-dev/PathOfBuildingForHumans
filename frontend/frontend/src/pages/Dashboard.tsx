import { mockBuild } from "../data/mockBuild";
import StatCard from "../components/StatCard";

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
    </div>
  );
}

export default Dashboard;