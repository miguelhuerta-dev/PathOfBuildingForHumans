import { useT } from "../i18n";
import AtlasFrame from "../components/AtlasFrame";
import AtlasSectionHeader from "../components/AtlasSectionHeader";
import { QuillIcon } from "../components/icons";

export function AboutPage({ onTutorial }: { onTutorial: () => void }) {
  const t = useT();
  return (
    <AtlasFrame>
      <AtlasSectionHeader title="About the Archive" icon={<QuillIcon className="h-6 w-6" />} />
      <div className="flex max-w-3xl flex-col gap-4 text-[19px] leading-relaxed text-parchment/90">
        <p>
          {t("Path of Building for Humans turns your character and the guide you follow into clear answers: how strong you are, what is holding you back, and what to upgrade next.")}
        </p>
        <p>
          {t("All damage and defence numbers are calculated by")}{" "}
          <span className="text-gold">Path of Building Community</span>
          {t(", used under its MIT licence. Character data comes from your public profile on pathofexile.com.")}
        </p>
        <p className="text-parchment-dim">
          {t("This product isn't affiliated with or endorsed by Grinding Gear Games in any way. Path of Exile is a trademark of Grinding Gear Games. All artwork in this app is original.")}
        </p>
        <button
          type="button"
          onClick={onTutorial}
          className="self-start border border-gold-dim/60 px-4 py-2 font-display text-[13px] tracking-[0.18em] text-parchment-dim hover:text-gold"
        >
          {t("SEE THE TUTORIAL AGAIN")}
        </button>
      </div>
    </AtlasFrame>
  );
}
