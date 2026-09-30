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
 * ellipse. Projecting through cached SVG bounds and positioning a plain
 * div keeps the node round without measuring layout during scroll.
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

    const svg = path.ownerSVGElement!;
    let bounds = svg.getBoundingClientRect();
    let documentTop = bounds.top + window.scrollY;
    const measure = () => {
      bounds = svg.getBoundingClientRect();
      documentTop = bounds.top + window.scrollY;
    };
    const observer = new ResizeObserver(measure);
    observer.observe(svg);

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
        // The viewBox stretches without preserving aspect ratio. Cache its
        // projection on resize instead of forcing layout after every write.
        const x = bounds.left + point.x * bounds.width / 100;
        const y = documentTop + point.y * bounds.height / 1000 - window.scrollY;
        head.style.transform = `translate3d(${x}px, ${y}px, 0)`;

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
    const onResize = () => { measure(); ScrollTrigger.refresh(); };
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      observer.disconnect();
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

      {/* Head node. Fixed, so the cached projection subtracts page scroll. */}
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
