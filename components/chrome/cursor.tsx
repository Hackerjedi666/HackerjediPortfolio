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
/**
 * Surfaces the cursor has to invert over.
 *
 * The bone panels are the site's one light ground, and the accent on them
 * is lime: 1.1:1 against #efefea. The pointer did not dim there, it
 * disappeared — completely, and only inside those regions, which is the
 * worst version of the bug because everything else still worked.
 */
const LIGHT_SURFACES =
  ".bone-surface, .section-bone, .bento-tile-bone, .bento-sheet-bone .bento-sheet-body";

export function Cursor() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const tier = useTier();

  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const wrap = wrapRef.current;
    const dot = dotRef.current;
    const ring = ringRef.current;
    const glow = glowRef.current;
    if (!fine || reduced || !wrap || !dot || !ring || !glow) return;

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

      // Which ground is under the pointer. Written to the WRAPPER, not to
      // <html>: the note above about hydration applies to mutating the
      // document root from this component, and the wrapper is an ancestor
      // of all three layers, so CSS can key off it just as easily.
      // Guarded on change, so a pointer sweep writes an attribute once per
      // crossing rather than once per event.
      const light = target?.closest?.(LIGHT_SURFACES) ? "true" : "false";
      if (wrap.dataset.onLight !== light) wrap.dataset.onLight = light;
    };

    const onLeave = () => {
      dot.style.opacity = "0";
      ring.style.opacity = "0";
      glow.style.opacity = "0";
    };

    // Velocity-reactive ring, ported from MagicUI's smooth-cursor.
    //
    // That component was not installed: it pulls in `motion` for one effect,
    // and it calls `document.body.style.cursor = "none"` and renders its own
    // pointer — which, next to the cursor this site already has, would put
    // two cursors on screen fighting over the same state.
    //
    // Its three good ideas port cleanly onto the existing rAF loop. One is
    // adapted rather than copied: smooth-cursor ROTATES an arrow to face the
    // direction of travel, and rotation is invisible on a circle. The same
    // physical idea on a round cursor is squash-and-stretch — the ring
    // elongates along its direction of travel and recovers when it settles.
    let angle = 0;
    let stretch = 0;

    const loop = () => {
      const px = rx;
      const py = ry;
      rx += (mx - rx) * INERTIA;
      ry += (my - ry) * INERTIA;

      const dx = rx - px;
      const dy = ry - py;
      const speed = Math.hypot(dx, dy);

      // Below the threshold the angle is noise from sub-pixel drift, and
      // letting it update would make a resting cursor jitter.
      if (speed > 0.35) angle = (Math.atan2(dy, dx) * 180) / Math.PI;

      // Clamped hard: an unclamped stretch turns a fast flick into a line.
      const target = Math.min(speed / 26, 0.4);
      // Ease toward the target so the recovery is not a snap.
      stretch += (target - stretch) * 0.2;

      ring.style.transform =
        `translate(${rx.toFixed(2)}px, ${ry.toFixed(2)}px) ` +
        `rotate(${angle.toFixed(1)}deg) ` +
        `scale(${(1 + stretch).toFixed(3)}, ${(1 - stretch * 0.62).toFixed(3)})`;

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
    <div ref={wrapRef} aria-hidden="true" data-on-light="false">
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
        className="cursor-ring pointer-events-none fixed left-0 top-0 z-[249] -ml-5 -mt-5 h-10 w-10 rounded-full border border-acid/70 opacity-0 transition-[width,height,margin,background-color,border-color,opacity] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform data-[grow=true]:-ml-9 data-[grow=true]:-mt-9 data-[grow=true]:h-18 data-[grow=true]:w-18 data-[grow=true]:bg-acid/10"
      />
    </div>
  );
}
