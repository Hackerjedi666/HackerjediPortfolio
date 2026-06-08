"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CryptoObject } from "@/components/crypto-object";
import { getReducedMotion } from "@/lib/motion";

/**
 * Scale-takeover stage for the wireframe icosahedron.
 * The icosahedron lives FIXED in the viewport (right band of the hero on
 * mount). As the reader scrolls from hero into Selected Work:
 *   1. The element pins in place (no scroll movement),
 *   2. Scrubs scale 1 → 4 so it grows to dominate the viewport,
 *   3. Translates from right band to viewport center,
 *   4. Spins through ~half a rotation for cinematic feel,
 *   5. Fades out at the end so Selected Work content takes over cleanly.
 *
 * Scroll-tied (scrub:1) — the reader controls the grow speed by scrolling.
 * Reverses naturally on scroll-up. Skipped on reduced-motion and mobile.
 */
export function IcosahedronTakeover() {
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (getReducedMotion()) return;
    if (window.innerWidth < 768) return;

    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      const heroEl = document.getElementById("top");
      const swEl = document.getElementById("selected-work");
      if (!heroEl || !swEl) return;

      // Single fromTo tween scrubbed across the boundary. Before start, the
      // icosahedron sits at rest in the hero right band (CSS initial state).
      // During the trigger range, it scales 1→4, drifts toward viewport
      // center, and rotates half a turn. opacity holds at 1 until the last
      // 25% of the range, then fades so Selected Work content surfaces.
      gsap.fromTo(
        wrapper,
        {
          scale: 1,
          rotation: 0,
          x: 0,
          opacity: 1,
        },
        {
          scale: 4,
          rotation: 180,
          // Move-to-center: right band sits 96px (right-12u) from right
          // edge, wrapper is 360px wide so center-of-wrapper is 96+180 = 276
          // from right edge. We translate LEFT by (viewportCenter - 276).
          x: () => -(window.innerWidth / 2 - (96 + 180)),
          opacity: 0,
          ease: "power2.inOut",
          immediateRender: false,
          scrollTrigger: {
            trigger: heroEl,
            // Trigger starts when hero is mostly scrolled — bottom of hero
            // is at 60% down the viewport, so the reader has already seen
            // the masthead/lede/signature.
            start: "bottom 60%",
            endTrigger: swEl,
            // Ends when Selected Work's top is at 25% down — the moment
            // Selected Work content is fully readable.
            end: "top 25%",
            scrub: 1,
            invalidateOnRefresh: true,
          },
        }
      );
    }, wrapper);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={wrapperRef}
      aria-hidden="true"
      className="pointer-events-none fixed right-12u top-1/2 z-10 hidden -translate-y-1/2 md:block"
      style={{
        // will-change hint so the browser pre-promotes the transform layer.
        willChange: "transform, opacity",
      }}
    >
      <CryptoObject />
    </div>
  );
}
