import { atlasArt } from "../assets/atlas";

function CandleGlow({ className }: { className: string }) {
  return (
    <div
      className={`candle-flicker absolute rounded-full bg-[radial-gradient(circle,rgba(255,180,90,0.38),rgba(255,140,60,0.1)_45%,transparent_70%)] ${className}`}
    />
  );
}

/**
 * Desk props framing the page edges. Decorative only; hidden on small screens.
 * Back layer sits behind the outer frame, front layer overlaps its lower edge.
 */
function AtlasScene() {
  return (
    <>
      <div className="pointer-events-none absolute inset-0 z-0 hidden lg:block" aria-hidden="true">
        <img
          src={atlasArt.scenePillar}
          alt=""
          className="absolute -left-48 top-0 h-full w-auto max-w-none brightness-[0.6] xl:-left-44"
        />
        <img
          src={atlasArt.scenePillar}
          alt=""
          className="absolute -right-48 top-0 h-full w-auto max-w-none -scale-x-100 brightness-[0.6] xl:-right-44"
        />
        <CandleGlow className="-right-24 top-20 h-96 w-96" />
        <img src={atlasArt.sceneCandles} alt="" className="absolute -right-6 top-44 h-64" />

        <CandleGlow className="-left-28 top-[46%] h-96 w-96" />
        <img src={atlasArt.sceneCandles} alt="" className="absolute -left-10 top-[52%] h-60 opacity-80" />
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 hidden h-[34rem] lg:block" aria-hidden="true">
        <CandleGlow className="-left-20 bottom-24 h-[30rem] w-[30rem]" />
        <img src={atlasArt.sceneBooks} alt="" className="absolute -left-24 -bottom-6 w-[30rem]" />
        <img src={atlasArt.sceneCandles} alt="" className="absolute bottom-[19rem] left-6 h-56" />
        <img src={atlasArt.sceneCoins} alt="" className="absolute bottom-0 left-[22rem] w-52" />

        <CandleGlow className="-right-20 bottom-10 h-80 w-80" />
        <img
          src={atlasArt.sceneParchmentMap}
          alt=""
          className="absolute -bottom-20 -right-16 w-[36rem] rotate-[-8deg]"
        />
        <img src={atlasArt.sceneAstrolabe} alt="" className="absolute -right-20 bottom-10 w-72" />
      </div>
    </>
  );
}

export default AtlasScene;
