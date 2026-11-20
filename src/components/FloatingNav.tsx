import { useEffect, useState, type CSSProperties } from "react";
import { isDesktopApp } from "../lib/desktop";
import TopNav, { type Page } from "./TopNav";

/** Scroll distance past which the main navigation bar is out of sight. */
const SHOW_AFTER = 90;

/** How far inside the outer frame its iron border ends (the backdrop's inset too). */
const FRAME_INSET = 22;

/**
 * The inside of the window's iron frame, left edge and width: in the cut-out
 * window the area around the frame is see-through, so the bar must stay inside it.
 */
function useFrameBounds(): CSSProperties | undefined {
  const [bounds, setBounds] = useState<CSSProperties>();
  useEffect(() => {
    const frame = document.querySelector<HTMLElement>("[data-window-frame]");
    if (!frame) return;
    const measure = () => {
      const rect = frame.getBoundingClientRect();
      setBounds({ left: rect.left + FRAME_INSET, width: Math.max(0, rect.width - FRAME_INSET * 2) });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(frame);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);
  return bounds;
}

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
  const bounds = useFrameBounds();

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
      className={`floating-nav fixed top-0 z-50 ${bounds ? "" : "inset-x-0"} ${shown ? "floating-nav--shown" : ""}`}
      style={bounds}
    >
      <TopNav page={page} onNavigate={onNavigate} floating />
    </div>
  );
}

export default FloatingNav;
