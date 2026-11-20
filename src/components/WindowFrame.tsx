import { useEffect } from "react";
import { isDesktopApp } from "../lib/desktop";

/**
 * The window is only the archive itself: the iron frame and what it holds. The
 * window is transparent, so the frame's own art (its corner ornaments and gems)
 * draws the silhouette like a cut-out picture, with the desktop showing around
 * it. Maximised, the frame stretches to fill the whole screen.
 *
 * No window region is set: clipping the window makes Windows fall back to its
 * classic white title bar and border around it.
 */

/** Maximised: the window covers the screen's whole working area. (Asking the
 * window itself answers "no" for this transparent, frameless window.) */
function fillsScreen(): boolean {
  return window.innerWidth >= window.screen.availWidth - 2 && window.innerHeight >= window.screen.availHeight - 2;
}

function WindowFrame() {
  useEffect(() => {
    if (!isDesktopApp) return;
    const root = document.documentElement;
    root.classList.add("cutout-window");
    const follow = () => root.classList.toggle("window-maximized", fillsScreen());
    follow();
    window.addEventListener("resize", follow);
    return () => {
      window.removeEventListener("resize", follow);
      root.classList.remove("cutout-window", "window-maximized");
    };
  }, []);
  return null;
}

export default WindowFrame;
