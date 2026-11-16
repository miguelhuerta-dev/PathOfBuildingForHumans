import AtlasGlyph from "./AtlasGlyph";

interface AtlasSectionHeaderProps {
  title: string;
}

function AtlasSectionHeader({
  title,
}: AtlasSectionHeaderProps) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <AtlasGlyph />

      <h2
        className="
        text-2xl
        text-[#D4AF6A]
        tracking-wide
        "
        style={{
          fontFamily: "Cinzel",
        }}
      >
        {title}
      </h2>

      <div className="flex-1 h-px bg-[#A8864B]" />
    </div>
  );
}

export default AtlasSectionHeader;