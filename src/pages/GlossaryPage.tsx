import { useMemo, useState, type ReactNode } from "react";
import AtlasFrame from "../components/AtlasFrame";
import AtlasSectionHeader from "../components/AtlasSectionHeader";
import { AtlasStarIcon, QuillIcon, ShieldIcon, SigilIcon, SkullIcon, SwordIcon, WarningIcon } from "../components/icons";
import { ChipGroup } from "../components/ui";
import { GLOSSARY, GLOSSARY_CATEGORIES, type GlossaryCategory } from "../data/glossary";

/** Each category's sigil and colour, so the cards read at a glance. */
const CATEGORY_LOOK: Record<GlossaryCategory, { icon: ReactNode; tone: string }> = {
  Attributes: { icon: <SigilIcon className="h-5 w-5" />, tone: "text-[#d9cfc1]" },
  Defence: { icon: <ShieldIcon className="h-5 w-5" />, tone: "text-[#9fb6d8]" },
  Offence: { icon: <SwordIcon className="h-5 w-5" />, tone: "text-ember" },
  Ailments: { icon: <WarningIcon className="h-5 w-5" />, tone: "text-[#c9645a]" },
  "Passive Tree": { icon: <AtlasStarIcon className="h-5 w-5" />, tone: "text-verdigris" },
  "Items & Gems": { icon: <SkullIcon className="h-5 w-5" />, tone: "text-gold" },
  "Campaign & Endgame": { icon: <AtlasStarIcon className="h-5 w-5" />, tone: "text-arcane" },
  "This Archive": { icon: <QuillIcon className="h-5 w-5" />, tone: "text-gold" },
};

type Filter = GlossaryCategory | "All";

/** The words of Path of Exile and of this archive, explained plainly and searchable. */
export default function GlossaryPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Filter>("All");

  const entries = useMemo(() => {
    const words = query.trim().toLowerCase();
    return GLOSSARY.filter(
      (entry) =>
        (category === "All" || entry.category === category) &&
        (!words || entry.term.toLowerCase().includes(words) || entry.text.toLowerCase().includes(words)),
    );
  }, [query, category]);

  return (
    <AtlasFrame>
      <AtlasSectionHeader title="The Glossary" icon={<QuillIcon className="h-6 w-6" />} />
      <p className="text-[17px] text-parchment-dim">
        The words of Path of Exile, and of this archive, in plain language.
      </p>

      <div className="mt-5 flex flex-col gap-3">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search a word: armour, keystone, ignite…"
          aria-label="Search the glossary"
          className="border border-gold-dim/60 bg-black/50 px-3 py-2 text-[17px] text-parchment placeholder:text-parchment-faint focus:border-gold focus:outline-none"
        />
        <ChipGroup<Filter>
          label="Glossary category"
          options={[{ value: "All", label: "All" }, ...GLOSSARY_CATEGORIES.map((value) => ({ value, label: value }))]}
          selected={category}
          onSelect={setCategory}
        />
      </div>

      {entries.length === 0 ? (
        <p className="mt-6 text-[17px] text-parchment-faint">No word matches “{query}”.</p>
      ) : (
        <dl className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {entries.map((entry) => {
            const look = CATEGORY_LOOK[entry.category];
            return (
              <div key={entry.term} className="iron-card flex gap-3 px-4 py-3">
                <span className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[#3a332e] bg-black/60 ${look.tone}`} aria-hidden="true">
                  {look.icon}
                </span>
                <div className="min-w-0">
                  <dt className="font-display text-[17px] text-parchment">{entry.term}</dt>
                  <dd className="text-[11px] tracking-[0.16em] text-parchment-faint">{entry.category.toUpperCase()}</dd>
                  <dd className="mt-1 text-[15px] leading-snug text-parchment-dim">{entry.text}</dd>
                </div>
              </div>
            );
          })}
        </dl>
      )}
    </AtlasFrame>
  );
}
