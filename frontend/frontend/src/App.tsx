import { useState } from "react";
import type { Page } from "./components/TopNav";
import ArchiveShell from "./layouts/ArchiveShell";
import Dashboard from "./pages/Dashboard";
import GuidePage from "./pages/GuidePage";
import { AboutPage, AtlasPage } from "./pages/InfoPages";
import { useArchive } from "./state/useArchive";

function App() {
  const archive = useArchive();
  const [page, setPage] = useState<Page>("character");

  return (
    <ArchiveShell page={page} onNavigate={setPage}>
      {page === "character" && <Dashboard archive={archive} onNavigate={setPage} />}
      {page === "guide" && <GuidePage archive={archive} />}
      {page === "atlas" && <AtlasPage />}
      {page === "about" && <AboutPage />}
    </ArchiveShell>
  );
}

export default App;
