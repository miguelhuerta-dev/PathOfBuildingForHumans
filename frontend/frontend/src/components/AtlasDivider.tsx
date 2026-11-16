import AtlasGlyph from "./AtlasGlyph";

function AtlasDivider() {
  return (
    <div className="flex items-center justify-center gap-2 py-2">
      <div className="h-px w-16 bg-[#6F5A35]" />

      <AtlasGlyph />

      <div className="h-px w-16 bg-[#6F5A35]" />
    </div>
  );
}

export default AtlasDivider;