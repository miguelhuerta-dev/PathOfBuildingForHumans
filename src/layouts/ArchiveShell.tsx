import { useEffect, type ReactNode } from "react";
import AtlasBackground from "../components/AtlasBackground";
import AtlasFrame from "../components/AtlasFrame";
import AtlasScene from "../components/AtlasScene";
import FloatingNav from "../components/FloatingNav";
import WindowFrame from "../components/WindowFrame";
import ScrollRail from "../components/ScrollRail";
import TopNav, { type Page } from "../components/TopNav";
import { GitHubIcon } from "../components/icons";
import { desktop, isDesktopApp } from "../lib/desktop";

const PROFILE_URL = "https://github.com/miguelhuerta-dev";

/** The author's GitHub profile. The desktop app opens it in the system browser. */
function ProfileLink() {
  return (
    <a
      href={PROFILE_URL}
      target="_blank"
      rel="noreferrer"
      onClick={(event) => {
        if (!isDesktopApp) return;
        event.preventDefault();
        void desktop.openProfile();
      }}
      className="nav-plate mx-auto mt-6 inline-flex items-center gap-3 border border-gold-dim/60 px-5 py-2.5 font-display text-[13px] tracking-[0.2em] text-parchment-dim transition hover:border-gold hover:text-gold"
    >
      <GitHubIcon className="h-5 w-5" />
      MIGUELHUERTA-DEV
    </a>
  );
}

function Motto({ lines, align }: { lines: string[]; align: "left" | "right" }) {
  return (
    <p
      className={`engraved hidden font-display text-[13px] font-medium leading-relaxed tracking-[0.22em] text-parchment-dim lg:block ${
        align === "right" ? "text-right" : ""
      }`}
    >
      {lines.map((line) => (
        <span key={line} className="block">
          {line}
        </span>
      ))}
    </p>
  );
}

interface ArchiveShellProps {
  page: Page;
  onNavigate: (page: Page) => void;
  children: ReactNode;
}

/**
 * Marks the page idle while its window is not focused, so endless decorative
 * animations stop costing CPU when the app sits behind the game.
 */
function useIdleWhenUnfocused() {
  useEffect(() => {
    const root = document.documentElement;
    const update = () => {
      if (document.hasFocus()) delete root.dataset.idle;
      else root.dataset.idle = "";
    };
    update();
    window.addEventListener("focus", update);
    window.addEventListener("blur", update);
    return () => {
      window.removeEventListener("focus", update);
      window.removeEventListener("blur", update);
      delete root.dataset.idle;
    };
  }, []);
}

/** The archive around every page: background, desk scene, outer frame and title bar. */
function ArchiveShell({ page, onNavigate, children }: ArchiveShellProps) {
  useIdleWhenUnfocused();
  return (
    <div className="archive-shell relative isolate min-h-screen overflow-hidden p-2">
      {/* In the desktop app the window is a cut-out: the backdrop lives inside the frame only. */}
      {!isDesktopApp && <AtlasBackground />}
      {!isDesktopApp && <div className="film-grain pointer-events-none absolute inset-0 z-30" aria-hidden="true" />}
      <AtlasScene cutout={isDesktopApp} />
      <FloatingNav page={page} onNavigate={onNavigate} />
      <WindowFrame />
      <ScrollRail />

      <div data-window-frame className="relative z-10 mx-auto min-[1540px]:max-w-[1320px]">
      {isDesktopApp && (
        <div className="frame-backdrop pointer-events-none absolute z-0 overflow-hidden" aria-hidden="true">
          <AtlasBackground />
          <div className="film-grain absolute inset-0" />
        </div>
      )}
      <AtlasFrame variant="outer" className="relative z-[1]">
        <TopNav page={page} onNavigate={onNavigate} />

        <div className="flex items-start justify-between pb-10 pt-5 md:min-h-[150px]">
          <Motto align="left" lines={["EXILES", "STUDY", "ADAPT", "CONQUER"]} />
          <Motto align="right" lines={["KNOWLEDGE", "BUILDS", "SURVIVAL"]} />
        </div>

        {/* Keyed by page so each page's panels rise in when it opens. */}
        <main key={page} className="reveal flex flex-col gap-4">
          {children}
        </main>

        <footer className="pb-4 pt-14 text-center md:pb-24">
          <p className="font-display text-[14px] leading-relaxed tracking-[0.24em] text-parchment-faint">
            SAME BUILDS.
            <br />
            A DEEPER UNDERSTANDING.
          </p>
          <p className="mx-auto mt-4 max-w-md text-[14px] text-parchment-faint">
            This product isn't affiliated with or endorsed by Grinding Gear Games in any way. Calculations by
            Path of Building Community.
          </p>
          <ProfileLink />
        </footer>
      </AtlasFrame>
      </div>
    </div>
  );
}

export default ArchiveShell;
