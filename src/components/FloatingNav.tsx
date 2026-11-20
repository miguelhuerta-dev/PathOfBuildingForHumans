import { useEffect, useState } from "react";
import { isDesktopApp } from "../lib/desktop";
import TopNav, { type Page } from "./TopNav";

/** Scroll distance past which the main navigation bar is out of sight. */
const SHOW_AFTER = 90;

interface FloatingNavProps {
  page: Page;
  onNavigate: (page: Page) => void;
}

/**
 * The same navigation bar, pinned to the top once the page scrolls past it:
 * the pages, the window drag area and minimise, maximise and close stay at
 * hand, in the corner as in any desktop app.
 */
function FloatingNav({ page, onNavigate }: FloatingNavProps) {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setShown(window.scrollY > SHOW_AFTER));
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", update);
    };
  }, []);

  if (!isDesktopApp) return null;

  return (
    <div
      aria-hidden={!shown}
      inert={!shown}
      className={`floating-nav fixed inset-x-0 top-0 z-50 mx-auto min-[1540px]:max-w-[1320px] ${shown ? "floating-nav--shown" : ""}`}
    >
      <TopNav page={page} onNavigate={onNavigate} floating />
    </div>
  );
}

export default FloatingNav;
