import { useState } from "react";
import { portraitFor } from "../assets/atlas";
import type { Archive } from "../state/useArchive";
import AtlasFrame from "./AtlasFrame";
import AtlasSectionHeader from "./AtlasSectionHeader";
import { AtlasStarIcon } from "./icons";
import { ChipGroup, ErrorNote } from "./ui";

interface ConnectPanelProps {
  archive: Archive;
}

/** Account form and character picker, styled after the in-game character select. */
function ConnectPanel({ archive }: ConnectPanelProps) {
  const [accountInput, setAccountInput] = useState(archive.account);
  const [leagueFilter, setLeagueFilter] = useState("All");

  const leagues = ["All", ...Array.from(new Set(archive.characters.map((c) => c.league)))];
  const visible = archive.characters.filter((c) => leagueFilter === "All" || c.league === leagueFilter);

  return (
    <AtlasFrame>
      <AtlasSectionHeader title="Choose Your Exile" icon={<AtlasStarIcon className="h-7 w-7" />} />

      <form
        className="flex flex-wrap items-end gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          void archive.loadCharacters(accountInput);
        }}
      >
        <label className="flex min-w-64 flex-1 flex-col gap-1">
          <span className="font-display text-[13px] tracking-[0.18em] text-parchment-dim">ACCOUNT NAME</span>
          <input
            value={accountInput}
            onChange={(event) => setAccountInput(event.target.value)}
            placeholder="Exile#1234"
            autoComplete="off"
            spellCheck={false}
            className="border border-gold-dim/60 bg-black/50 px-3 py-2 text-[18px] text-parchment placeholder:text-parchment-faint focus:border-gold focus:outline-none"
          />
        </label>
        <button
          type="submit"
          disabled={archive.listState === "loading" || !accountInput.trim()}
          className="ui-button h-12 min-w-48 font-display text-[14px] tracking-[0.2em] text-parchment transition hover:brightness-125 disabled:opacity-50"
        >
          {archive.listState === "loading" ? "SEARCHING…" : "FIND CHARACTERS"}
        </button>
      </form>

      <p className="mt-2 text-[15px] text-parchment-faint">
        Your profile's Characters tab must be public on pathofexile.com. Include the #1234 at the end of the
        account name.
      </p>

      {archive.listError && <ErrorNote className="mt-3">{archive.listError}</ErrorNote>}

      {archive.characters.length > 0 && (
        <>
          <div className="mt-6">
            <ChipGroup
              label="Filter by league"
              options={leagues.map((league) => ({ value: league, label: league.toUpperCase() }))}
              selected={leagueFilter}
              onSelect={setLeagueFilter}
            />
          </div>

          <ul className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {visible.map((character) => {
              const active = archive.selected === character.name && archive.result?.character;
              return (
                <li key={character.name}>
                  <button
                    type="button"
                    onClick={() => void archive.loadCharacter(character.name)}
                    aria-current={active ? "true" : undefined}
                    className={`group flex w-full items-stretch overflow-hidden rounded-md border text-left shadow-[0_6px_14px_rgba(0,0,0,0.7)] transition ${
                      active ? "border-gold" : "border-[#3a2e20] hover:border-gold-dim"
                    }`}
                  >
                    <img
                      src={portraitFor(character.class)}
                      alt=""
                      className="h-[76px] w-[76px] shrink-0 object-cover object-top"
                    />
                    <span className="flex flex-1 flex-col justify-center bg-[linear-gradient(180deg,#3a2414,#1a100a)] px-4 py-2">
                      <span className="engraved font-display text-[17px] font-semibold text-[#f2dfb4]">
                        {character.name}
                      </span>
                      <span className="text-[15px] text-parchment">
                        Level {character.level} {character.class}
                      </span>
                      <span className="text-[14px] text-[#9fb6d8]">{character.league} League</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </AtlasFrame>
  );
}

export default ConnectPanel;
