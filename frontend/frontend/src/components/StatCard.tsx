import AtlasFrame from "./AtlasFrame";
import AtlasGlyph from "./AtlasGlyph";

interface StatCardProps {
  title: string;
  value: string | number;
  hero?: boolean;
}

function StatCard({
  title,
  value,
  hero = false,
}: StatCardProps) {
  return (
    <AtlasFrame>
      <div
        className={`
        relative
        bg-gradient-to-b
        from-[#231911]
        via-[#17120E]
        to-[#0F0C09]
        border
        p-6
        shadow-[inset_0_0_18px_rgba(0,0,0,0.65)]
        ${hero
            ? "border-[#8C6A34]"
            : "border-[#3A2F22]"
          }
        `}
      >
        <div
          className="
          absolute
          inset-2
          border
          border-[#2A2118]
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

        {hero ? (
          <div className="mt-4 text-center">
            <div
              className="text-[#D4AF6A]"
              style={{
                fontFamily: "Cinzel",
              }}
            >
              ✦
            </div>

            <div className="flex justify-center mb-3">
              <AtlasGlyph />
            </div>

            <p
              className="
              text-8xl
              text-[#D4AF6A]
              font-bold
              leading-none
              "
            >
              8.4
            </p>

            <p className="text-[#8C7F68] text-lg">
              / 10
            </p>
          </div>
        ) : (
          <p
            className="
            text-5xl
            text-[#C6B18A]
            font-bold
            mt-4
            "
          >
            {value}
          </p>
        )}
      </div>
    </AtlasFrame>
  );
}

export default StatCard;