"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  className?: string;
  /** Pixels per frame at 60fps. 0.35 is a slow, readable drift. */
  speed?: number;
};

/**
 * A column that scrolls itself, and that you can also scroll.
 *
 * THE FIRST VERSION OF THIS WAS WRONG. It drove a `transform: translateY`
 * from scroll progress, which moved the column about 13px across the whole
 * page — invisible — and left four of five cards permanently out of reach.
 * Content nobody can get to is not a design decision.
 *
 * This drives `scrollTop` instead of a transform, and that is the whole
 * trick: the element becomes a genuine scroll container, so the automatic
 * drift and a human's wheel, trackpad, touch drag or keyboard are the same
 * mechanism rather than two that fight. Transform-based marquees have to
 * choose one or the other.
 *
 * The children are rendered twice and the scroll position wraps at the
 * halfway mark, so the loop is seamless. The duplicate is `aria-hidden` and
 * untabbable, so a screen reader and the tab order each see the list once.
 *
 * Drift pauses on hover, on focus within, and while a pointer is down, so it
 * never slides out from under someone reading or dragging.
 *
 * NO SKEW. An earlier version leaned the column into the direction of travel
 * using the scroll velocity. It read as a defect rather than as momentum:
 * shearing a CARD shears its text, its avatar and its borders with it, so
 * every edge that should be square goes diagonal and the card looks broken
 * mid-scroll. Velocity lean works on a single line of display type. It does
 * not work on a stack of rectangles full of copy.
 */
export function AutoScrollColumn({
  children,
  className,
  speed = 0.35,
}: Props) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const paused = useRef(false);

  useEffect(() => {
    const view = viewportRef.current;
    const track = trackRef.current;
    if (!view || !track) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let raf = 0;
    /**
     * Float accumulator for the drift position.
     *
     * `scrollTop` cannot be relied on to hold a fraction — reading it back
     * can return a rounded value, so `scrollTop += 0.3` in a loop reads the
     * rounded number and adds to THAT, and the position stalls instead of
     * advancing. The drift is therefore kept as a float here and written to
     * the element, never read back from it.
     *
     * Re-synced whenever a human scrolls, so manual input is not fought.
     */
    let pos = view.scrollTop;

    const loop = () => {
      /**
       * Half of the SCROLLABLE content, measured on the viewport.
       *
       * This previously read `track.scrollHeight`. That is the wrong box:
       * the track is the skewed inner element, and `scrollTop` is measured
       * against the viewport's scroll extent, not the track's own. The two
       * disagree once the track is transformed, so the wrap point sat past
       * the reachable maximum and never fired — the column ran to the true
       * bottom and stopped dead.
       */
      const half = view.scrollHeight / 2;

      if (!paused.current && !reduced && half > 0) {
        pos += speed;
        view.scrollTop = pos;
      }

      // Wrapping happens EVERY frame, not only while drifting. If it only
      // ran during drift, a human could scroll manually past the halfway
      // mark to the real bottom — and the next drift frame would yank them
      // backwards by half the track. Wrapping unconditionally means manual
      // scrolling loops just as seamlessly as the automatic kind, in both
      // directions.
      if (half > 0) {
        if (view.scrollTop >= half) {
          view.scrollTop -= half;
          pos = view.scrollTop;
        } else if (view.scrollTop < 0) {
          view.scrollTop += half;
          pos = view.scrollTop;
        }
      }

      // A human scrolled: adopt their position instead of yanking them back
      // to where the drift had got to.
      if (Math.abs(view.scrollTop - pos) > 1.5) pos = view.scrollTop;

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);

    const hold = () => (paused.current = true);
    const release = () => (paused.current = false);
    const releaseIfAway = () => {
      // Do not un-pause on pointerup if the pointer is still over the column;
      // otherwise a click-drag inside it restarts the drift under the finger.
      if (!view.matches(":hover")) paused.current = false;
    };

    view.addEventListener("pointerenter", hold);
    view.addEventListener("pointerleave", release);
    view.addEventListener("pointerdown", hold);
    window.addEventListener("pointerup", releaseIfAway);
    view.addEventListener("focusin", hold);
    view.addEventListener("focusout", release);

    return () => {
      cancelAnimationFrame(raf);
      view.removeEventListener("pointerenter", hold);
      view.removeEventListener("pointerleave", release);
      view.removeEventListener("pointerdown", hold);
      window.removeEventListener("pointerup", releaseIfAway);
      view.removeEventListener("focusin", hold);
      view.removeEventListener("focusout", release);
    };
  }, [speed]);

  return (
    <div
      ref={viewportRef}
      // tabIndex so a keyboard user can scroll it too; without it the
      // container is unreachable and arrow keys do nothing.
      tabIndex={0}
      role="region"
      aria-label="Recent posts"
      className={cn("auto-scroll-view", className)}
      data-lenis-prevent
    >
      <div ref={trackRef}>
        <div className="grid gap-3">{children}</div>
        <div aria-hidden="true" className="mt-3 grid gap-3">
          {children}
        </div>
      </div>
    </div>
  );
}
