"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { setLenis, setReducedMotion } from "@/lib/motion";

/**
 * Phase 1 of the premium-motion rebuild. Owns:
 *   - Lenis (virtualized smooth scroll, the "Podium silk" feel)
 *   - GSAP + ScrollTrigger registration (foundation for Phase 2 choreography)
 *   - The Lenis ↔ GSAP RAF bridge (one driver: gsap.ticker → lenis.raf →
 *     ScrollTrigger.update; never two competing rAF loops)
 *
 * Reduced-motion path: do NOT initialize Lenis at all. Native scroll is fine,
 * scroll-behavior:smooth is already removed from globals.css (the previous
 * value would have fought with Lenis). Anchor clicks fall through to native
 * browser behavior.
 *
 * Touch path: Lenis runs for wheel/trackpad/keyboard but smoothTouch is false
 * — native momentum scroll on iOS/Android is better than re-implementing it.
 *
 * Mounted once in app/layout.tsx. Returns null (no DOM).
 */
export function MotionProvider() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setReducedMotion(reduced);

    if (reduced) {
      // No Lenis, no GSAP ticker. Native scroll handles everything. Components
      // that consult getLenis() will see null and fall back to native paths.
      return;
    }

    // Register the plugin once. Re-registering is a no-op but cheap.
    gsap.registerPlugin(ScrollTrigger);

    const lenis = new Lenis({
      duration: 1.15,
      // Expo-out — matches the editorial decelerate ease used everywhere else
      // (theme reveal, View Transitions). The single ease character of the site.
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      // Native touch momentum > library momentum on mobile. Skip touch smoothing.
      syncTouch: false,
      // Lenis 1.3+ intercepts <a href="#id"> clicks and routes them through
      // its own smooth scrollTo. Falls back to native if Lenis isn't present.
      anchors: true,
    });

    setLenis(lenis);

    // Tell ScrollTrigger to update on every Lenis scroll event (Phase 2 hook).
    lenis.on("scroll", ScrollTrigger.update);

    // ONE driver: GSAP ticker pumps Lenis. Avoids two competing rAF loops.
    // gsap.ticker passes time in seconds; Lenis wants ms.
    const tickerFn = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tickerFn);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tickerFn);
      lenis.destroy();
      setLenis(null);
    };
  }, []);

  return null;
}
