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
        text-[#A8864B]
        tracking-wide
        "
        style={{
          fontFamily: "Cinzel",
        }}
      >
        {title}
      </h2>

      <div className="flex-1 h-px bg-[#6F5A35]" />
    </div>
  );
}

export default AtlasSectionHeader;