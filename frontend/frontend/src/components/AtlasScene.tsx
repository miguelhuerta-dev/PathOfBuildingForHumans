import { atlasArt } from "../assets/atlas";

function CandleGlow({ className }: { className: string }) {
  return (
    <div
      className={`candle-flicker absolute rounded-full bg-[radial-gradient(circle,rgba(255,180,90,0.35),rgba(255,140,60,0.08)_45%,transparent_70%)] ${className}`}
    />
  );
}

/** Desk props framing the page edges. Decorative only; hidden on small screens. */
function AtlasScene() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 hidden overflow-hidden lg:block"
      aria-hidden="true"
    >
      {/* upper right candle */}
      <CandleGlow className="-right-24 top-24 h-80 w-80" />
      <img
        src={atlasArt.sceneCandles}
        alt=""
        className="absolute -right-10 top-28 h-56 opacity-90"
      />

      {/* lower left: books, candles, coins */}
      <CandleGlow className="-left-28 bottom-40 h-[28rem] w-[28rem]" />
      <img
        src={atlasArt.sceneBooks}
        alt=""
        className="absolute -left-16 bottom-0 w-[22rem]"
      />
      <img
        src={atlasArt.sceneCandles}
        alt=""
        className="absolute -left-6 bottom-44 h-72"
      />
      <img
        src={atlasArt.sceneCoins}
        alt=""
        className="absolute bottom-0 left-64 w-48 opacity-90"
      />

      {/* lower right: parchment map and astrolabe */}
      <img
        src={atlasArt.sceneParchmentMap}
        alt=""
        className="absolute -bottom-10 -right-20 w-[30rem] rotate-[-6deg] opacity-90"
      />
      <img
        src={atlasArt.sceneAstrolabe}
        alt=""
        className="absolute -right-12 bottom-24 w-56"
      />
    </div>
  );
}

export default AtlasScene;
