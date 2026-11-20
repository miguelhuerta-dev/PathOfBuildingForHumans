import { atlasArt } from "../assets/atlas";
import { useLanguage, type Language } from "../i18n";
import AtlasFrame from "./AtlasFrame";

const CHOICES: { language: Language; name: string; line: string }[] = [
  { language: "en", name: "English", line: "Read the archive in English" },
  { language: "es", name: "Español", line: "Leer el archivo en español" },
];

/**
 * The first thing a new exile sees: the archive's emblem and a choice of
 * language, written in both, kept for every launch after.
 */
function LanguagePicker() {
  const { setLanguage } = useLanguage();
  return (
    <AtlasFrame className="reveal">
      <div className="flex flex-col items-center gap-6 py-10 text-center">
        <img src={atlasArt.emblem} alt="" className="h-40 w-auto drop-shadow-[0_8px_18px_rgba(160,30,20,0.45)]" />
        <div>
          <h1 className="title-text font-display text-[34px] leading-tight tracking-[0.04em]">Path of Building for Humans</h1>
          <p className="mt-2 font-display text-[14px] tracking-[0.3em] text-gold-dim">CHOOSE YOUR LANGUAGE · ELIGE TU IDIOMA</p>
        </div>
        <div className="grid w-full max-w-2xl gap-4 sm:grid-cols-2">
          {CHOICES.map((choice) => (
            <button
              key={choice.language}
              type="button"
              onClick={() => setLanguage(choice.language)}
              className="iron-card group flex flex-col items-center gap-2 px-6 py-6 transition hover:brightness-125 focus-visible:outline focus-visible:outline-1 focus-visible:outline-gold"
            >
              <span className="font-display text-[26px] tracking-[0.08em] text-parchment group-hover:text-gold">{choice.name}</span>
              <span className="text-[16px] italic text-parchment-dim">{choice.line}</span>
            </button>
          ))}
        </div>
        <p className="text-[14px] text-parchment-faint">
          You can change it later in the menu · Puedes cambiarlo después desde el menú
        </p>
      </div>
    </AtlasFrame>
  );
}

export default LanguagePicker;
