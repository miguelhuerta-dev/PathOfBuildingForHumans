interface StatCardProps {
  title: string;
  value: string | number;
}

function StatCard({ title, value }: StatCardProps) {
  return (
    <div
      style={{
        border: "3px solid red",
        padding: "20px",
        margin: "20px",
      }}
    >
      <h3>{title}</h3>
      <p>{value}</p>
    </div>
  );
}

export default StatCard;