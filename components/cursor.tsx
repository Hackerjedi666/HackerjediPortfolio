"use client";

import { useEffect, useRef } from "react";
import { getReducedMotion } from "@/lib/motion";

/**
 * Custom cursor — Lusion/Linear-style premium feel.
 *
 * Two layers:
 *   - DOT: small, follows the actual mouse position (1:1, no lag)
 *   - RING: bigger, follows with lerp (subtle "trailing" feel)
 *
 * On hover over [a, button, [role="button"], [data-cursor-grow]]: the ring
 * expands and fills with the ink color (light/dark token), the dot disappears.
 * Result: links "magnetize" the cursor — the trademark premium-portfolio cue.
 *
 * Visibility gates:
 *   - pointer:coarse (touch only) → never renders, returns null
 *   - prefers-reduced-motion → never renders (no smoothing, no point)
 *   - First mousemove → CSS class added to <html> that hides the OS cursor
 *     site-wide (only on pointer:fine). Before first move, OS cursor still
 *     shows; avoids the "no cursor at all" weirdness on initial paint.
 */
export function Cursor() {
  const ringRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Touch-only: skip entirely. No DOM, no listeners, no cost.
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    if (coarse) return;
    // Reduced-motion: the cursor itself is motion. Skip for those users.
    if (getReducedMotion()) return;

    const ring = ringRef.current;
    const dot = dotRef.current;
    if (!ring || !dot) return;

    let mx = window.innerWidth / 2;
    let my = window.innerHeight / 2;
    let rx = mx;
    let ry = my;
    let raf = 0;
    let active = false;
    let hoveringInteractive = false;

    const root = document.documentElement;

    const onMove = (e: PointerEvent) => {
      mx = e.clientX;
      my = e.clientY;
      if (!active) {
        active = true;
        root.classList.add("has-custom-cursor");
        ring.style.opacity = "1";
        dot.style.opacity = "1";
        // First move: snap ring to position instantly to avoid the cross-screen
        // diagonal lerp from the initial center position.
        rx = mx;
        ry = my;
      }
      // Detect interactive target for the magnetize state.
      const target = e.target as HTMLElement | null;
      const interactive =
        !!target?.closest(
          'a, button, [role="button"], [data-cursor-grow], input, textarea, select, summary'
        );
      if (interactive !== hoveringInteractive) {
        hoveringInteractive = interactive;
        ring.dataset.grow = interactive ? "true" : "false";
      }
    };

    const onLeave = () => {
      active = false;
      root.classList.remove("has-custom-cursor");
      ring.style.opacity = "0";
      dot.style.opacity = "0";
    };

    const onEnter = () => {
      // When the pointer re-enters the document, restore visibility.
      if (mx !== undefined) {
        active = true;
        root.classList.add("has-custom-cursor");
        ring.style.opacity = "1";
        dot.style.opacity = "1";
      }
    };

    const tick = () => {
      // Lerp the ring; the dot snaps to current.
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      ring.style.transform = `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%)`;
      dot.style.transform = `translate3d(${mx}px, ${my}px, 0) translate(-50%, -50%)`;
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    document.addEventListener("pointerenter", onEnter);
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("pointerenter", onEnter);
      cancelAnimationFrame(raf);
      root.classList.remove("has-custom-cursor");
    };
  }, []);

  return (
    <>
      <div
        ref={ringRef}
        aria-hidden="true"
        data-grow="false"
        className="cursor-ring pointer-events-none fixed left-0 top-0 z-[100] opacity-0"
      />
      <div
        ref={dotRef}
        aria-hidden="true"
        className="cursor-dot pointer-events-none fixed left-0 top-0 z-[100] opacity-0"
      />
    </>
  );
}
