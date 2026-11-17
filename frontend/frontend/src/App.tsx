import { useState } from "react";
import type { Page } from "./components/TopNav";
import ArchiveShell from "./layouts/ArchiveShell";
import Dashboard from "./pages/Dashboard";
import GuidePage from "./pages/GuidePage";
import AtlasPage from "./pages/AtlasPage";
import { AboutPage } from "./pages/InfoPages";
import { useArchive } from "./state/useArchive";

/** Atlas progress is kept per league; without a character it goes to Standard. */
const DEFAULT_LEAGUE = "Standard";

function App() {
  const archive = useArchive();
  const [page, setPage] = useState<Page>("character");
  const league =
    archive.result?.character?.character.league ??
    archive.characters.find((character) => character.name === archive.selected)?.league ??
    DEFAULT_LEAGUE;

  return (
    <ArchiveShell page={page} onNavigate={setPage}>
      {page === "character" && <Dashboard archive={archive} onNavigate={setPage} />}
      {page === "guide" && <GuidePage archive={archive} />}
      {page === "atlas" && <AtlasPage league={league} clientLog={archive.clientLog || null} />}
      {page === "about" && <AboutPage />}
    </ArchiveShell>
  );
}

export default App;
