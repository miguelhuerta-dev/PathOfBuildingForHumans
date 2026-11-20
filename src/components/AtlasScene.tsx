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
function AtlasScene({ cutout = false }: { cutout?: boolean }) {
  return (
    <>
      <div className="pointer-events-none absolute inset-0 z-0 hidden lg:block" aria-hidden="true">
        {/* Each pillar fills the margin beside the outer frame, whole and scaled down to fit
            it (never up, so it stays sharp); fixed to the window while the page scrolls. With
            no margin (a narrow window) there is no pillar, and the frame fills the window. */}
        <div className="pillar-margin fixed left-0 top-0 h-screen">
          <img src={atlasArt.scenePillar} alt="" className="h-full w-full object-contain object-right brightness-[0.75]" />
        </div>
        <div className="pillar-margin fixed right-0 top-0 h-screen">
          <img src={atlasArt.scenePillar} alt="" className="h-full w-full -scale-x-100 object-contain object-right brightness-[0.75]" />
        </div>
        {/* A cut-out window shows only the pillars: props around them would float on the desktop. */}
        {!cutout && (
          <>
        <CandleGlow className="-right-24 top-20 h-96 w-96" />
        <img src={atlasArt.sceneCandles} alt="" className="absolute -right-6 top-44 h-64" />

        <CandleGlow className="-left-28 top-[46%] h-96 w-96" />
        <img src={atlasArt.sceneCandles} alt="" className="absolute -left-10 top-[52%] h-60 opacity-80" />
          </>
        )}
      </div>

      {/* The desk props sink into the dark: muted so the black iron stays the main material. */}
      {!cutout && <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 hidden h-[34rem] brightness-[0.55] saturate-[0.6] lg:block" aria-hidden="true">
        <CandleGlow className="-left-20 bottom-24 h-[30rem] w-[30rem]" />
        <img src={atlasArt.sceneBooks} alt="" loading="lazy" decoding="async" className="absolute -left-24 -bottom-6 w-[30rem]" />
        <img src={atlasArt.sceneCandles} alt="" className="absolute bottom-[19rem] left-6 h-56" />
        <img src={atlasArt.sceneCoins} alt="" loading="lazy" decoding="async" className="absolute bottom-0 left-[22rem] w-52" />

        <CandleGlow className="-right-20 bottom-10 h-80 w-80" />
        <img
          src={atlasArt.sceneParchmentMap}
          loading="lazy"
          decoding="async"
          alt=""
          className="absolute -bottom-20 -right-16 w-[36rem] rotate-[-8deg]"
        />
        <img src={atlasArt.sceneAstrolabe} alt="" loading="lazy" decoding="async" className="absolute -right-20 bottom-10 w-72" />
      </div>}
    </>
  );
}

export default AtlasScene;
