"use client";

import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger, useGsap } from "@/lib/effects/gsap";
import { canAnimate } from "@/lib/stage/capability";

/**
 * A single acid line that draws itself down the entire page as you scroll,
 * with a lit node riding its head.
 *
 * Ported from the "pointer going around while scrolling" pack, whose whole
 * mechanic is two lines: set `strokeDasharray` and `strokeDashoffset` to the
 * path's own length, then scrub the offset to zero. The line appears to be
 * drawn rather than revealed.
 *
 * Adapted here from a section-scoped decoration into the site's continuous
 * spine: it spans the whole document, so the same unbroken trace threads
 * every section — which for this portfolio reads as a route being walked
 * through a network rather than as a decorative squiggle.
 *
 * The head node is a fixed-position DOM element rather than an SVG circle.
 * The path is drawn with `preserveAspectRatio="none"` so the serpentine
 * stretches to any document height, and anything drawn inside that viewBox
 * inherits the same distortion — a circle would render as a squashed
 * ellipse. Projecting the path point out to screen space with `getScreenCTM`
 * and positioning a plain div keeps the node perfectly round.
 */

/** Serpentine down a normalised 100 × 1000 viewBox. */
function buildPath(waves = 9): string {
  const height = 1000;
  const segment = height / waves;
  const parts = [`M 50 0`];
  for (let i = 0; i < waves; i++) {
    const y0 = i * segment;
    // Alternate which side each wave bulges toward.
    const bulge = i % 2 === 0 ? 90 : 10;
    parts.push(
      `C ${bulge} ${y0 + segment * 0.3}, ${bulge} ${y0 + segment * 0.7}, 50 ${y0 + segment}`
    );
  }
  return parts.join(" ");
}

const PATH = buildPath();

/** Arc length of the bright segment trailing the head, in user units. */
const HOT_SEGMENT = 26;

export function TraceLine() {
  const pathRef = useRef<SVGPathElement>(null);
  const hotRef = useRef<SVGPathElement>(null);
  const headRef = useRef<HTMLDivElement>(null);
  useGsap();

  useEffect(() => {
    const path = pathRef.current;
    const hot = hotRef.current;
    const head = headRef.current;
    if (!path || !hot || !head || !canAnimate()) return;

    const ctx = gsap.context(() => {
      const length = path.getTotalLength();
      gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
      // One dash of HOT_SEGMENT followed by a gap longer than the path, so
      // exactly one bright segment exists anywhere on the line.
      hot.style.strokeDasharray = `${HOT_SEGMENT} ${length}`;

      const moveHead = (progress: number) => {
        const drawn = length * progress;

        // Park the hot segment so it ENDS at the head: the first dash starts
        // at arc position -offset, and we want that to be (drawn - segment).
        // A negative offset is legal and is what keeps the two in lockstep.
        hot.style.strokeDashoffset = String(HOT_SEGMENT - drawn);

        const point = path.getPointAtLength(drawn);
        const matrix = path.getScreenCTM();
        if (!matrix) return;
        const screen = point.matrixTransform(matrix);
        head.style.transform = `translate(${screen.x}px, ${screen.y}px)`;

        // Hide at both ends — a reticle pinned to the very top of the page
        // before you've scrolled reads as a bug, not as a feature.
        const visible = progress > 0.004 && progress < 0.997;
        head.style.opacity = visible ? "1" : "0";
        hot.style.opacity = visible ? "0.9" : "0";
      };

      gsap.to(path, {
        strokeDashoffset: 0,
        ease: "none",
        scrollTrigger: {
          trigger: document.documentElement,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.4,
          onUpdate: (self) => moveHead(self.progress),
        },
      });

      moveHead(0);
    });

    // The path's length depends on the document height, which changes as
    // fonts land and sections reflow.
    const onResize = () => ScrollTrigger.refresh();
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      ctx.revert();
    };
  }, []);

  return (
    <>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <svg
          className="h-full w-full"
          viewBox="0 0 100 1000"
          preserveAspectRatio="none"
          fill="none"
        >
          {/* Ghost of the full route, so the line reads as a path being
              followed rather than one being invented. */}
          <path
            d={PATH}
            stroke="var(--color-hairline)"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
          <path
            ref={pathRef}
            d={PATH}
            stroke="var(--color-acid)"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.42"
            vectorEffect="non-scaling-stroke"
          />
          {/* Bright leading segment. Without it the node looks like it's
              floating over the line rather than drawing it. */}
          <path
            ref={hotRef}
            d={PATH}
            stroke="var(--color-acid)"
            strokeWidth="2.5"
            strokeLinecap="round"
            opacity="0"
            vectorEffect="non-scaling-stroke"
            style={{
              filter: "drop-shadow(0 0 6px color-mix(in srgb, var(--color-acid) 60%, transparent))",
            }}
          />
        </svg>
      </div>

      {/* Head node. Fixed, so `getScreenCTM` screen coordinates apply
          directly with no further conversion. */}
      <div
        ref={headRef}
        aria-hidden="true"
        className="trace-head pointer-events-none left-0 top-0 z-0 opacity-0"
      >
        <span className="trace-head-aura" />
        <span className="trace-head-ping" />
        <span className="trace-head-ping" />
        <span className="trace-head-reticle" />
        <span className="trace-head-core" />
      </div>
    </>
  );
}
