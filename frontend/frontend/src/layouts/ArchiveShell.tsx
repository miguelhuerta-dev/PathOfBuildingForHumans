import type { ReactNode } from "react";
import AtlasBackground from "../components/AtlasBackground";
import AtlasFrame from "../components/AtlasFrame";
import AtlasScene from "../components/AtlasScene";
import TopNav, { type Page } from "../components/TopNav";

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

/** The archive around every page: background, desk scene, outer frame and title bar. */
function ArchiveShell({ page, onNavigate, children }: ArchiveShellProps) {
  return (
    <div className="relative isolate min-h-screen overflow-hidden px-2 py-3 sm:px-4">
      <AtlasBackground />
      <div className="film-grain pointer-events-none absolute inset-0 z-30" aria-hidden="true" />
      <AtlasScene />

      <AtlasFrame variant="outer" className="relative z-10 mx-auto max-w-[1320px]">
        <TopNav page={page} onNavigate={onNavigate} />

        <div className="flex items-start justify-between pb-10 pt-5 md:min-h-[150px]">
          <Motto align="left" lines={["EXILES", "STUDY", "ADAPT", "CONQUER"]} />
          <Motto align="right" lines={["KNOWLEDGE", "BUILDS", "SURVIVAL"]} />
        </div>

        <main className="flex flex-col gap-4">{children}</main>

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
        </footer>
      </AtlasFrame>
    </div>
  );
}

export default ArchiveShell;
