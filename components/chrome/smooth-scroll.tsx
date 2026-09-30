"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger, useGsap } from "@/lib/effects/gsap";

/** Short wheel easing; touch, nested panels and reduced motion stay native. */
export function SmoothScroll() {
  useGsap();
  useEffect(() => {
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    let cleanup: (() => void) | undefined;
    const setup = () => {
      cleanup?.();
      cleanup = undefined;
      if (motion.matches) return;
      const lenis = new Lenis({
        lerp: .22,
        smoothWheel: true,
        syncTouch: false,
        anchors: true,
        virtualScroll: ({ event }) => !event.ctrlKey && !event.shiftKey,
      });
      const frames: number[] = [];
      let previous = 0;
      const tick = (seconds: number) => {
        lenis.raf(seconds * 1000);
        if (process.env.NODE_ENV !== "development") return;
        const now = performance.now();
        if (lenis.isScrolling) {
          if (previous) frames.push(now - previous);
          if (frames.length > 240) frames.shift();
          previous = now;
        } else if (previous) {
          previous = 0;
          const sorted = [...frames].sort((a, b) => a - b);
          if (sorted.length) document.documentElement.dataset.scrollTiming = JSON.stringify({ samples: sorted.length, medianMs: sorted[Math.floor(sorted.length / 2)], p95Ms: sorted[Math.floor(sorted.length * .95)] });
        }
      };
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add(tick);
      // Opening a sheet locks body scrolling; stop any in-flight momentum too.
      const lock = () => {
        if (document.body.style.overflow === "hidden") lenis.stop();
        else lenis.start();
      };
      const observer = new MutationObserver(lock);
      observer.observe(document.body, { attributes: true, attributeFilter: ["style"] });
      lock();
      cleanup = () => {
        observer.disconnect();
        gsap.ticker.remove(tick);
        lenis.destroy();
        delete document.documentElement.dataset.scrollTiming;
      };
    };
    setup();
    motion.addEventListener("change", setup);
    return () => { motion.removeEventListener("change", setup); cleanup?.(); };
  }, []);
  return null;
}
