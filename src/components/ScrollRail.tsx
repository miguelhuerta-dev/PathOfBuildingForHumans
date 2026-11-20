import { useEffect, useRef, useState, type PointerEvent } from "react";

/**
 * The page's scroll bar, inside the iron frame: a thin rail with a blood-red
 * thumb that follows the page and can be dragged. The native bar would sit
 * outside the shaped window's edge, so it is hidden.
 */

const TOP = 72;
const BOTTOM = 28;

interface Metrics {
  /** Visible share of the page, 0..1. */
  share: number;
  /** How far down the page is scrolled, 0..1. */
  at: number;
}

function measure(): Metrics {
  const total = document.documentElement.scrollHeight;
  const view = window.innerHeight;
  const room = Math.max(1, total - view);
  return { share: Math.min(1, view / Math.max(1, total)), at: Math.min(1, window.scrollY / room) };
}

function ScrollRail() {
  const [metrics, setMetrics] = useState<Metrics>(measure);
  const drag = useRef<{ startY: number; startScroll: number } | null>(null);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setMetrics(measure()));
    };
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    // Pages grow as results arrive: follow the document's height too.
    const observer = new ResizeObserver(update);
    observer.observe(document.body);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      observer.disconnect();
    };
  }, []);

  if (metrics.share >= 1) return null;

  const rail = window.innerHeight - TOP - BOTTOM;
  // Just inside the outer frame's right edge, so it stays part of the window.
  const frame = document.querySelector("[data-window-frame]")?.getBoundingClientRect();
  const right = frame ? Math.max(13, window.innerWidth - frame.right + 30) : 13;
  const thumb = Math.max(36, rail * metrics.share);
  const offset = (rail - thumb) * metrics.at;

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { startY: event.clientY, startScroll: window.scrollY };
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    const room = document.documentElement.scrollHeight - window.innerHeight;
    const moved = ((event.clientY - drag.current.startY) / Math.max(1, rail - thumb)) * room;
    window.scrollTo(0, drag.current.startScroll + moved);
  };
  const onPointerUp = () => {
    drag.current = null;
  };

  return (
    <div className="scroll-rail fixed z-[85] w-[7px]" style={{ top: TOP, bottom: BOTTOM, right }} aria-hidden="true">
      <div
        className="scroll-rail__thumb absolute inset-x-0 cursor-grab active:cursor-grabbing"
        style={{ top: offset, height: thumb }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      />
    </div>
  );
}

export default ScrollRail;
