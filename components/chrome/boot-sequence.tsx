"use client";

import { useEffect, useRef, useState } from "react";

const DURATION = 1500;
/** Hard ceiling: whatever happens above, the page reveals itself. */
const FAILSAFE = 4200;

/**
 * The 0→100 boot curtain.
 *
 * Runs once per browser session. Repeat views are handled *before paint* by
 * the inline script in `layout.tsx` (which adds `html.boot-seen`), so the
 * curtain never flashes on an internal navigation — this component just
 * agrees with that decision and skips straight to the lifted state.
 */
export function BootSequence() {
  const [count, setCount] = useState(0);
  const [lifted, setLifted] = useState(false);
  const [gone, setGone] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem("hj_boot") === "1";
    } catch {
      /* private mode — treat as first visit */
    }
    // Already booted this session: the inline script in layout.tsx has
    // already put `boot-seen` on <html> and CSS has hidden the curtain.
    // Nothing to animate, and no state to set.
    if (seen) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      try {
        sessionStorage.setItem("hj_boot", "1");
      } catch {
        /* ignore */
      }
      // Same hide path as a repeat visit — a curtain that can't animate is
      // just a black rectangle in the way.
      document.documentElement.classList.add("boot-seen");
      return;
    }

    let raf = 0;
    const start = performance.now();

    const step = () => {
      const p = Math.min(1, (performance.now() - start) / DURATION);
      // ease-out cubic so the counter sprints then settles
      const n = Math.round((1 - Math.pow(1 - p, 3)) * 100);
      setCount(n);
      if (barRef.current) {
        barRef.current.style.transform = `scaleX(${(n / 100).toFixed(3)})`;
      }
      if (p < 1) {
        raf = requestAnimationFrame(step);
      } else {
        try {
          sessionStorage.setItem("hj_boot", "1");
        } catch {
          /* ignore */
        }
        setTimeout(() => setLifted(true), 260);
      }
    };
    raf = requestAnimationFrame(step);

    const failsafe = setTimeout(() => setLifted(true), FAILSAFE);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(failsafe);
    };
  }, []);

  // Unmount only after the wipe finishes, so the transition can play out.
  useEffect(() => {
    if (!lifted) return;
    const t = setTimeout(() => setGone(true), 1200);
    return () => clearTimeout(t);
  }, [lifted]);

  if (gone) return null;

  return (
    <div
      aria-hidden="true"
      data-state={lifted ? "lifted" : "sealed"}
      className="boot fixed inset-0 z-[300] flex items-end justify-between gap-5 bg-void px-[34px] py-10 pointer-events-none"
    >
      <span className="text-label text-ink-label">INITIALISING SESSION</span>
      <span className="font-display text-[clamp(60px,16vw,200px)] font-bold leading-[0.8] tracking-[-0.04em] text-ink tabular-nums">
        {count}
      </span>
      {/* Initial scale is inline, not a Tailwind `scale-x-0` class: the rAF
          loop writes `style.transform` directly, and an inline transform
          replaces the utility's wholesale rather than composing with it. */}
      <div
        ref={barRef}
        style={{ transform: "scaleX(0)" }}
        className="absolute inset-x-[34px] bottom-[26px] h-px origin-left bg-acid"
      />
    </div>
  );
}
