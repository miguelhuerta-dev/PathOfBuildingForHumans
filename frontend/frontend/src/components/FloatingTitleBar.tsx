import { useEffect, useState } from "react";
import { isDesktopApp } from "../lib/desktop";
import WindowControls from "./WindowControls";

/** Scroll distance past which the main title bar is out of sight. */
const SHOW_AFTER = 90;

/**
 * A slim title bar pinned to the top of the window once the main one scrolls
 * away: the window can still be dragged, and minimise, maximise and close stay
 * in the corner, as in any desktop app.
 */
function FloatingTitleBar() {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (!isDesktopApp) return;
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
      data-tauri-drag-region
      aria-hidden={!shown}
      inert={!shown}
      className={`floating-titlebar fixed inset-x-0 top-0 z-50 flex h-11 select-none items-center justify-between pl-5 pr-1 ${
        shown ? "floating-titlebar--shown" : ""
      }`}
    >
      <span data-tauri-drag-region className="title-text font-display text-[15px] font-semibold tracking-[0.06em]">
        Path of Building for Humans
      </span>
      <WindowControls />
    </div>
  );
}

export default FloatingTitleBar;
