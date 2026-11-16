import AtlasFrame from "../components/AtlasFrame";
import AtlasSectionHeader from "../components/AtlasSectionHeader";
import { AtlasStarIcon, QuillIcon } from "../components/icons";

export function AtlasPage() {
  return (
    <AtlasFrame>
      <AtlasSectionHeader title="The Atlas" icon={<AtlasStarIcon className="h-7 w-7" />} />
      <p className="text-[19px] text-parchment-dim">
        The league meta, popular builds and item prices will live here in a later version.
      </p>
    </AtlasFrame>
  );
}

export function AboutPage() {
  return (
    <AtlasFrame>
      <AtlasSectionHeader title="About the Archive" icon={<QuillIcon className="h-6 w-6" />} />
      <div className="flex max-w-3xl flex-col gap-4 text-[19px] leading-relaxed text-parchment/90">
        <p>
          Path of Building for Humans turns your character and the guide you follow into clear answers: how strong
          you are, what is holding you back, and what to upgrade next.
        </p>
        <p>
          All damage and defence numbers are calculated by{" "}
          <span className="text-gold">Path of Building Community</span>, used under its MIT licence. Character data
          comes from your public profile on pathofexile.com.
        </p>
        <p className="text-parchment-dim">
          This product isn't affiliated with or endorsed by Grinding Gear Games in any way. Path of Exile is a
          trademark of Grinding Gear Games. All artwork in this app is original.
        </p>
      </div>
    </AtlasFrame>
  );
}
