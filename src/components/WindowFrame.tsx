import { useEffect } from "react";
import { desktop, isDesktopApp } from "../lib/desktop";

/**
 * The window is only the archive itself: the iron frame and the pillars beside
 * it. The window is transparent, so the frame's own art (its corner ornaments
 * and gems) draws the silhouette like a cut-out picture, and Windows is given
 * the same pieces so clicks outside them reach the desktop.
 */

/** How far the frame's corner ornaments reach past its box, in CSS pixels. */
const ORNAMENT = 18;

type Piece = [number, number][];

function rectPiece(left: number, top: number, right: number, bottom: number, scale: number): Piece {
  const [l, t, r, b] = [left, top, right, bottom].map((v) => Math.round(v * scale));
  return [
    [l, t],
    [r, t],
    [r, b],
    [l, b],
  ];
}

/** The parts of the window that hold something: the frame's band and each visible pillar. */
function windowPieces(): Piece[] {
  const scale = window.devicePixelRatio || 1;
  const height = window.innerHeight;
  const pieces: Piece[] = [];
  const frame = document.querySelector<HTMLElement>("[data-window-frame]");
  if (frame) {
    const box = frame.getBoundingClientRect();
    pieces.push(rectPiece(Math.max(0, box.left - ORNAMENT), 0, Math.min(window.innerWidth, box.right + ORNAMENT), height, scale));
  }
  for (const pillar of document.querySelectorAll<HTMLElement>(".pillar-margin")) {
    const box = pillar.getBoundingClientRect();
    if (box.width > 4 && getComputedStyle(pillar).display !== "none") {
      pieces.push(rectPiece(box.left, 0, box.right, height, scale));
    }
  }
  return pieces;
}

function WindowFrame() {
  useEffect(() => {
    if (!isDesktopApp) return;
    document.documentElement.classList.add("cutout-window");
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => void desktop.shapeWindow(windowPieces()).catch(() => undefined));
    };
    update();
    window.addEventListener("resize", update);
    // The frame's width settles as the page loads its fonts and panels.
    const observer = new ResizeObserver(update);
    const target = document.querySelector("[data-window-frame]");
    if (target) observer.observe(target);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", update);
      observer.disconnect();
      document.documentElement.classList.remove("cutout-window");
      void desktop.shapeWindow([]).catch(() => undefined);
    };
  }, []);
  return null;
}

export default WindowFrame;
