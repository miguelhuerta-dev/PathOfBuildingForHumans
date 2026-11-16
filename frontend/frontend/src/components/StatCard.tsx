interface StatCardProps {
  title: string;
  value: string | number;
  hero?: boolean;
}

function StatCard({ title, value, hero = false }: StatCardProps) {
  return (
    <div
      className={`
      relative
      bg-[#16120E]
      border
      rounded-none
      p-6
      transition
      
      ${hero
          ? "border-[#A8864B] bg-[#16120E]"
          : "border-[#3A2F22] hover:border-[#A8864B]"
        }
     `}
    >

      <div
        className="
        absolute
        inset-1
        border
        border-[#3A2F22]
        pointer-events-none
        "
      />
      <h3
        className="
        text-[#8C7F68]
        text-sm
        uppercase
        tracking-widest
        font-semibold
        "
      >
        {hero ? `✦ ${title} ✦` : title}
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