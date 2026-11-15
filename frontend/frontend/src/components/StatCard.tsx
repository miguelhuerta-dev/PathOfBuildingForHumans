interface StatCardProps {
  title: string;
  value: string | number;
  hero?: boolean;
}

function StatCard({ title, value, hero = false }: StatCardProps) {
  return (
    <div
      className={`
    bg-slate-900
    border
    rounded-2xl
    p-6
    transition
    ${hero
          ? "border-amber-500 bg-gradient-to-br from-slate-900 to-slate-800"
          : "border-slate-800 hover:border-slate-600"
        }
  `}
    >
      <h3
        className="
        text-slate-500
        text-xs
        uppercase
        tracking-widest
        "
      >
        {title}
      </h3>

      <p
        className={`font-bold mt-4 ${hero ? "text-7xl text-amber-300" : "text-4xl"
          }`}
      >
        {value}
      </p>


    </div>
  );
}

export default StatCard;