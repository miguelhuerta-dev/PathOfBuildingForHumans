import AtlasGlyph from "./AtlasGlyph";
interface AtlasSealProps {
  label: string;
}

function AtlasSeal({ label }: AtlasSealProps) {
  return (
    <div
      className="
      w-24
      h-24
      border-2
      border-[#A8864B]
      bg-[#16120E]
      relative
      flex
      flex-col
      items-center
      justify-center
      text-[#D4AF6A]
      "
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
      <AtlasGlyph />

      

      <div
        className="
        text-xs
        mt-1
        tracking-[0.25em]
        "
      >
        {label}
      </div>
    </div>
  );
}

export default AtlasSeal;