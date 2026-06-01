"use client";

import { useEffect, useRef } from "react";
import { getLenis, getReducedMotion } from "@/lib/motion";

/**
 * Thin progress bar pinned to the top of the viewport. Reads from Lenis when
 * available (synced with smooth scroll), falls back to window.scrollY when
 * Lenis is off (reduced-motion path). Uses transform: scaleX for GPU
 * compositing — never reflows.
 *
 * Color: --color-accent (oxblood light / steel-cyan dark). One marginal mark
 * of accent in resting state, justified because it's a navigation affordance,
 * not decoration.
 */
export function ScrollProgress() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const bar = ref.current;
    if (!bar) return;

    const updateNative = () => {
      const max =
        document.documentElement.scrollHeight - window.innerHeight || 1;
      const p = Math.min(1, Math.max(0, window.scrollY / max));
      bar.style.transform = `scaleX(${p})`;
    };

    // Try Lenis first. If absent (reduced-motion path), use native scroll.
    const lenis = getLenis();
    if (lenis && !getReducedMotion()) {
      const onScroll = ({ progress }: { progress: number }) => {
        bar.style.transform = `scaleX(${Math.min(1, Math.max(0, progress))})`;
      };
      lenis.on("scroll", onScroll);
      // Initial paint
      bar.style.transform = `scaleX(${lenis.progress ?? 0})`;
      return () => {
        lenis.off("scroll", onScroll);
      };
    }

    // Native fallback (also covers the brief window before MotionProvider mounts)
    updateNative();
    window.addEventListener("scroll", updateNative, { passive: true });
    window.addEventListener("resize", updateNative);
    return () => {
      window.removeEventListener("scroll", updateNative);
      window.removeEventListener("resize", updateNative);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-[90] h-px w-full origin-left"
    >
      <div
        ref={ref}
        className="h-full w-full origin-left bg-accent"
        style={{ transform: "scaleX(0)" }}
      />
    </div>
  );
}
