"use client";

import { useEffect } from "react";
import { getReducedMotion } from "@/lib/motion";

/**
 * Cursor-magnet — Lusion-style big-type attractor.
 *
 * Any element marked with `data-cursor-magnet` is translated toward the
 * cursor as the pointer approaches it. Falloff is quadratic so the pull
 * feels organic (gentle at the edges, dramatic near the element). Each
 * element's translate is lerped per-frame toward its current target so
 * motion is silky, not snappy.
 *
 * Architecture:
 *   - One global `pointermove` listener (passive) keeps cursor coords in
 *     a closure-scoped variable.
 *   - One RAF loop iterates the cached element list, computes per-element
 *     target translate from the cursor distance, and lerps the visual
 *     transform toward that target.
 *   - Touch / reduced-motion: skipped entirely (no DOM mutations, no rAF).
 *
 * Tuning constants below — INFLUENCE_RADIUS controls "when does the
 * element start to feel the pull"; MAX_PULL is the cap on displacement.
 */

const INFLUENCE_RADIUS = 380; // px from element center where pull starts
const MAX_PULL = 18; // px max displacement at zero distance
const LERP = 0.12; // 0–1, larger = snappier follow

export function CursorMagnet() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(pointer: coarse)").matches) return;
    if (getReducedMotion()) return;

    let mx = -9999;
    let my = -9999;
    const onMove = (e: PointerEvent) => {
      mx = e.clientX;
      my = e.clientY;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    // Refresh the element list on layout-affecting events. Cheap: queried
    // once at mount + on resize/scroll-throttled refresh, then iterated
    // each frame without re-querying.
    let elements: HTMLElement[] = [];
    const refreshElements = () => {
      elements = Array.from(
        document.querySelectorAll<HTMLElement>("[data-cursor-magnet]")
      );
    };
    refreshElements();

    // MutationObserver catches sections that mount later (Redacted reveals,
    // hydration etc.) so the element list stays current without polling.
    const mo = new MutationObserver(() => {
      // Debounced via rAF — multiple mutations in one tick → one refresh.
      requestAnimationFrame(refreshElements);
    });
    mo.observe(document.body, { childList: true, subtree: true });

    // Per-element state for the current displayed translate. Reuse object
    // refs across frames so we don't allocate.
    const state = new WeakMap<HTMLElement, { x: number; y: number }>();
    const ensure = (el: HTMLElement) => {
      let s = state.get(el);
      if (!s) {
        s = { x: 0, y: 0 };
        state.set(el, s);
      }
      return s;
    };

    let raf = 0;
    const tick = () => {
      for (let i = 0; i < elements.length; i++) {
        const el = elements[i];
        if (!el.isConnected) continue;
        const rect = el.getBoundingClientRect();
        // Skip elements outside the viewport (no force, but still lerp
        // back to 0 if we have a residual offset).
        const offscreen =
          rect.bottom < -100 ||
          rect.top > window.innerHeight + 100 ||
          rect.right < -100 ||
          rect.left > window.innerWidth + 100;

        let targetX = 0;
        let targetY = 0;
        if (!offscreen) {
          const cx = rect.left + rect.width / 2;
          const cy = rect.top + rect.height / 2;
          const dx = mx - cx;
          const dy = my - cy;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < INFLUENCE_RADIUS && dist > 0.001) {
            const t = 1 - dist / INFLUENCE_RADIUS;
            const force = t * t * MAX_PULL; // quadratic falloff
            targetX = (dx / dist) * force;
            targetY = (dy / dist) * force;
          }
        }

        const s = ensure(el);
        s.x += (targetX - s.x) * LERP;
        s.y += (targetY - s.y) * LERP;
        // Skip the style write if the change is sub-pixel and we're
        // already at rest — avoids layout thrash on idle frames.
        if (Math.abs(s.x) < 0.05 && Math.abs(s.y) < 0.05) {
          if (el.style.transform) el.style.transform = "";
        } else {
          el.style.transform = `translate3d(${s.x.toFixed(2)}px, ${s.y.toFixed(2)}px, 0)`;
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      mo.disconnect();
      elements.forEach((el) => {
        el.style.transform = "";
      });
    };
  }, []);

  return null;
}
