"use client";

import { useEffect, useRef } from "react";
import { useTier } from "@/lib/stage/use-stage";

/** Ring lerp factor — lower trails further behind the dot. */
const INERTIA = 0.14;

/**
 * Two-layer cursor: an acid dot pinned to the pointer, and a ring that
 * chases it with inertia and swells over anything interactive.
 *
 * Never renders for touch, mouseless, or reduced-motion users — they keep
 * the native cursor, which is the correct affordance. Positions are written
 * straight to `style.transform` (never React state) so pointer tracking
 * never triggers a re-render.
 *
 * Hiding the native cursor is done by a `:has()` rule keyed on these
 * elements existing, NOT by adding a class to <html>. React hydration is
 * concurrent, so an effect from an already-hydrated subtree can mutate
 * <html> before React reconciles that element's attributes — which surfaces
 * as a hydration mismatch on every single load. Rendering nothing is a
 * cleaner signal than mutating the document root.
 */
export function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const tier = useTier();

  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dot = dotRef.current;
    const ring = ringRef.current;
    const glow = glowRef.current;
    if (!fine || reduced || !dot || !ring || !glow) return;

    let mx = window.innerWidth / 2;
    let my = window.innerHeight / 2;
    let rx = mx;
    let ry = my;
    let raf = 0;

    const onMove = (e: PointerEvent) => {
      mx = e.clientX;
      my = e.clientY;
      dot.style.opacity = "1";
      ring.style.opacity = "1";
      glow.style.opacity = "1";
      dot.style.transform = `translate(${mx}px, ${my}px)`;
      glow.style.transform = `translate(${mx}px, ${my}px)`;

      const target = e.target as Element | null;
      const over = !!target?.closest?.(
        "a, button, input, [data-cursor-grow]"
      );
      ring.dataset.grow = over ? "true" : "false";
    };

    const onLeave = () => {
      dot.style.opacity = "0";
      ring.style.opacity = "0";
      glow.style.opacity = "0";
    };

    const loop = () => {
      rx += (mx - rx) * INERTIA;
      ry += (my - ry) * INERTIA;
      ring.style.transform = `translate(${rx.toFixed(2)}px, ${ry.toFixed(2)}px)`;
      raf = requestAnimationFrame(loop);
    };
    loop();

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, [tier]);

  // Touch, keyboard and reduced-motion users keep the native cursor.
  if (tier !== "full") return null;

  return (
    <div aria-hidden="true">
      {/* Soft acid halo. Without it the dot and ring end on a hard edge while
          the ink fluid behind them is a bright accent wash — the cursor read
          as a separate cut-out sitting on top rather than as the thing
          driving the fluid. This bridges the two. */}
      <div
        ref={glowRef}
        className="cursor-glow pointer-events-none fixed left-0 top-0 z-[248] opacity-0 will-change-transform"
      />
      <div
        ref={dotRef}
        className="cursor-dot pointer-events-none fixed left-0 top-0 z-[250] -ml-1 -mt-1 h-2 w-2 rounded-full bg-acid opacity-0 transition-opacity duration-300 will-change-transform"
      />
      <div
        ref={ringRef}
        data-grow="false"
        className="pointer-events-none fixed left-0 top-0 z-[249] -ml-5 -mt-5 h-10 w-10 rounded-full border border-acid/70 opacity-0 transition-[width,height,margin,background-color,opacity] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform data-[grow=true]:-ml-9 data-[grow=true]:-mt-9 data-[grow=true]:h-18 data-[grow=true]:w-18 data-[grow=true]:bg-acid/10"
      />
    </div>
  );
}
