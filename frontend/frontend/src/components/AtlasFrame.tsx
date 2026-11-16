import AtlasCorner from "./AtlasCorner";

interface AtlasFrameProps {
  children: React.ReactNode;
}

function AtlasFrame({
  children,
}: AtlasFrameProps) {
  return (
    <div className="relative">

      <div className="absolute top-0 left-0 z-10">
        <AtlasCorner />
      </div>

      <div className="absolute top-0 right-0 z-10">
        <AtlasCorner flipX />
      </div>

      <div className="absolute bottom-0 left-0 z-10">
        <AtlasCorner flipY />
      </div>

      <div className="absolute bottom-0 right-0 z-10">
        <AtlasCorner flipX flipY />
      </div>

      {children}
    </div>
  );
}

export default AtlasFrame;