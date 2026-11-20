import { useEffect, useRef, useState } from "react";
import Medallion from "./Medallion";
import WindowControls from "./WindowControls";
import { AtlasStarIcon } from "./icons";

export type Page = "character" | "guide" | "atlas" | "glossary" | "about";

const navLinks: { page: Page; label: string }[] = [
  { page: "character", label: "Character" },
  { page: "guide", label: "Guide" },
  { page: "atlas", label: "Atlas" },
  { page: "glossary", label: "Glossary" },
  { page: "about", label: "About" },
];

interface NavProps {
  page: Page;
  onNavigate: (page: Page) => void;
}

const linkClass =
  "engraved font-display text-[15px] font-semibold tracking-[0.18em] text-[#cfc6b8] transition-colors hover:text-gold focus-visible:text-gold";

/** Collapsed navigation for narrow windows, styled as a framed parchment list. */
function NavMenu({ page, onNavigate }: NavProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative xl:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="nav-menu"
        onClick={() => setOpen((value) => !value)}
        className={`${linkClass} flex items-center gap-2 border border-gold-dim/50 px-4 py-1.5`}
      >
        MENU
        <svg viewBox="0 0 24 24" className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          id="nav-menu"
          className="atlas-frame atlas-frame--card absolute right-0 top-full z-40 mt-3 w-56"
        >
          <div className="atlas-frame__surface" aria-hidden="true" />
          <div className="atlas-frame__border" aria-hidden="true" />
          <ul className="relative flex flex-col gap-1">
            {navLinks.map((link) => (
              <li key={link.page}>
                <button
                  type="button"
                  aria-current={page === link.page ? "page" : undefined}
                  className={`${linkClass} block w-full px-2 py-2 text-left ${page === link.page ? "text-gold" : ""}`}
                  onClick={() => {
                    onNavigate(link.page);
                    setOpen(false);
                  }}
                >
                  {link.label.toUpperCase()}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * Top bar. In the desktop app it is also the window title bar:
 * empty areas drag the window and double-click maximizes.
 */
function TopNav({ page, onNavigate, floating = false }: NavProps & { floating?: boolean }) {
  return (
    <header
      data-tauri-drag-region
      className={`nav-plate relative z-20 select-none px-5 py-2.5 ${
        // Set into the outer frame: flush with its inner edge, not floating a few pixels inside it.
        floating ? "" : "-mx-[13px] -mt-[10px]"
      }`}
    >
      <div data-tauri-drag-region className="flex items-center justify-between gap-6">
        <button
          type="button"
          onClick={() => onNavigate("character")}
          className="title-text whitespace-nowrap font-display text-[19px] font-semibold tracking-[0.05em] xl:text-[21px]"
        >
          Path of Building for Humans
        </button>

        <div data-tauri-drag-region className="flex items-center gap-6">
          <nav aria-label="Main" data-tauri-drag-region className="hidden items-center gap-x-9 xl:flex">
            {navLinks.map((link) => (
              <button
                key={link.page}
                type="button"
                aria-current={page === link.page ? "page" : undefined}
                onClick={() => onNavigate(link.page)}
                className={`${linkClass} border-b-2 pb-0.5 ${page === link.page ? "border-[#8a2219] text-gold" : "border-transparent"}`}
              >
                {link.label.toUpperCase()}
              </button>
            ))}
          </nav>
          <NavMenu page={page} onNavigate={onNavigate} />
          <Medallion size={44}>
            <AtlasStarIcon className="h-5 w-5" />
          </Medallion>
          <WindowControls />
        </div>
      </div>
    </header>
  );
}

export default TopNav;
