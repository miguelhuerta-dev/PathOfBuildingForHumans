import { lazy, Suspense, useState } from "react";
import type { Page } from "./components/TopNav";
import ArchiveShell from "./layouts/ArchiveShell";
import Dashboard from "./pages/Dashboard";

// The dashboard opens first; the other pages load the first time they are visited.
const GuidePage = lazy(() => import("./pages/GuidePage"));
const AtlasPage = lazy(() => import("./pages/AtlasPage"));
const GlossaryPage = lazy(() => import("./pages/GlossaryPage"));
const AboutPage = lazy(() => import("./pages/InfoPages").then((module) => ({ default: module.AboutPage })));
import { useArchive } from "./state/useArchive";
import { GameLocation } from "./state/useItemArt";
import { CurrentLeague } from "./state/currentLeague";
import { useLanguage } from "./i18n";
import LanguagePicker from "./components/LanguagePicker";
import Tutorial, { tutorialSeen } from "./components/Tutorial";

/** Atlas progress is kept per league; without a character it goes to Standard. */
const DEFAULT_LEAGUE = "Standard";

function App() {
  const archive = useArchive();
  const { language } = useLanguage();
  const [page, setPage] = useState<Page>("character");
  // The tour opens once, right after the language is chosen, and again from About.
  const [touring, setTouring] = useState(() => !tutorialSeen());
  const open = language !== null && !touring;
  const league =
    archive.result?.character?.character.league ??
    archive.characters.find((character) => character.name === archive.selected)?.league ??
    DEFAULT_LEAGUE;

  return (
    // Item icons read the game's art from where the player's game is.
    <GameLocation.Provider value={archive.clientLog || null}>
      <CurrentLeague.Provider value={league}>
      <ArchiveShell page={page} onNavigate={setPage}>
        {/* First launch: the language comes before anything else. */}
        {language === null && <LanguagePicker />}
        {language !== null && touring && (
          <Tutorial
            onClose={() => {
              setTouring(false);
              setPage("character");
            }}
          />
        )}
        {open && page === "character" && <Dashboard archive={archive} onNavigate={setPage} />}
        {open && (
        <Suspense fallback={<p className="text-center text-[17px] text-parchment-faint">Opening the archive…</p>}>
          {page === "guide" && <GuidePage archive={archive} />}
          {page === "atlas" && <AtlasPage league={league} clientLog={archive.clientLog || null} />}
          {page === "glossary" && <GlossaryPage />}
          {page === "about" && <AboutPage onTutorial={() => setTouring(true)} />}
        </Suspense>
        )}
      </ArchiveShell>
      </CurrentLeague.Provider>
    </GameLocation.Provider>
  );
}

export default App;
