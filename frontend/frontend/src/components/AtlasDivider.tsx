import AtlasGlyph from "./AtlasGlyph";
function AtlasDivider() {
  return (
    <div className="flex items-center justify-center gap-2 py-2">
      <div className="h-px w-16 bg-[#A8864B]" />

      <AtlasGlyph />

      <div className="h-px w-16 bg-[#A8864B]" />
    </div>
  );
}

export default AtlasDivider;