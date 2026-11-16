import { useEffect, useRef, useState } from "react";
import Medallion from "./Medallion";
import WindowControls from "./WindowControls";
import { AtlasStarIcon } from "./icons";

const navLinks = ["Builds", "Analyze", "Atlas", "Guides", "About"];

const linkClass =
  "engraved font-display text-[15px] font-semibold tracking-[0.18em] text-[#dccca6] transition-colors hover:text-gold focus-visible:text-gold";

/** Collapsed navigation for narrow windows, styled as a framed parchment list. */
function NavMenu() {
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
              <li key={link}>
                <a href="#" className={`${linkClass} block px-2 py-2`} onClick={() => setOpen(false)}>
                  {link.toUpperCase()}
                </a>
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
function TopNav() {
  return (
    <header data-tauri-drag-region className="nav-plate relative z-20 -mx-4 -mt-2 select-none px-5 py-2.5">
      <div data-tauri-drag-region className="flex items-center justify-between gap-6">
        <a href="#" className="title-text whitespace-nowrap font-display text-[19px] font-semibold tracking-[0.05em] xl:text-[21px]">
          Path of Building for Humans
        </a>

        <div data-tauri-drag-region className="flex items-center gap-6">
          <nav aria-label="Main" data-tauri-drag-region className="hidden items-center gap-x-9 xl:flex">
            {navLinks.map((link) => (
              <a key={link} href="#" className={linkClass}>
                {link.toUpperCase()}
              </a>
            ))}
          </nav>
          <NavMenu />
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
