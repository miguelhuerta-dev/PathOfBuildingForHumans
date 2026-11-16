import { atlasArt } from "../assets/atlas";

/** Page backdrop: stone wall, painted star atlas, candle warmth and vignette. */
function AtlasBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
      <div className="stone-wall absolute inset-0" />

      <img
        src={atlasArt.starAtlas}
        alt=""
        className="absolute left-1/2 top-0 w-[min(1800px,140vw)] max-w-none -translate-x-1/2 opacity-80 [mask-image:linear-gradient(to_bottom,black_35%,transparent_95%)]"
      />

      <div className="absolute inset-x-0 bottom-0 h-[45vh] bg-[radial-gradient(ellipse_60%_80%_at_15%_100%,rgba(230,140,50,0.16),transparent_70%)]" />
      <div className="absolute inset-x-0 bottom-0 h-[45vh] bg-[radial-gradient(ellipse_50%_70%_at_88%_100%,rgba(230,140,50,0.1),transparent_70%)]" />

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_120%_90%_at_50%_40%,transparent_45%,rgba(0,0,0,0.85)_100%)]" />
    </div>
  );
}

export default AtlasBackground;
