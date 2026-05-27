"use client";

import { useEffect, useState } from "react";

// Section list — drives both the rail's marks and the IntersectionObserver
// scroll-spy. Order matches page.tsx top-to-bottom. IDs must match the
// section elements' `id` attributes (all six section components already
// declare these; `top` was added to the hero <article> in page.tsx).
const SECTIONS: ReadonlyArray<{ id: string; label: string }> = [
  { id: "top", label: "Top" },
  { id: "selected-work", label: "Selected Work" },
  { id: "open-source", label: "Open Source" },
  { id: "capabilities", label: "Capabilities" },
  { id: "ventures", label: "Ventures" },
  { id: "articles", label: "Articles" },
  { id: "contact", label: "Contact" },
];

// Fixed left-edge section rail. Coexists with the top-right theme toggle —
// opposite corner band, zero overlap at any viewport. Hidden below md
// (768 px): hover labels don't work on touch and a fixed left column eats
// narrow widths; the page is fully scrollable without it on mobile.
//
// Navigation: real <a href="#id"> anchors — keyboard, browser back/forward,
// and "open in new tab" all work for free. The native CSS scroll-behavior
// in globals.css handles the smooth glide (no Lenis, no GSAP ScrollTo).
//
// Scroll-spy: IntersectionObserver with rootMargin shrunk to a ~10% band
// in the upper-middle of the viewport — naturally one section "in view"
// at a time, no scroll-event listener, no per-frame getBoundingClientRect.
export function SectionRail() {
  const [activeId, setActiveId] = useState<string>(SECTIONS[0].id);

  useEffect(() => {
    const order = SECTIONS.map((s) => s.id);
    const elements = SECTIONS.map((s) => document.getElementById(s.id)).filter(
      (el): el is HTMLElement => el !== null
    );
    if (elements.length === 0) return;

    // Track which sections are currently in the activation band. When the
    // band has multiple sections (transitions, or page bottomed out with a
    // short last section), pick the LATEST one in page order — that's the
    // section the reader has most recently entered.
    const intersecting = new Set<string>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) intersecting.add(entry.target.id);
          else intersecting.delete(entry.target.id);
        }
        for (let i = order.length - 1; i >= 0; i--) {
          if (intersecting.has(order[i])) {
            setActiveId(order[i]);
            return;
          }
        }
      },
      {
        // Active band: viewport y=30% to y=70% (a 40% reading zone).
        // Width chosen so that even when the page bottoms out and a short
        // final section (Contact ≈ 450 px on desktop) sits below mid-
        // viewport, it still intersects. During section transitions
        // multiple sections may share the band; the reverse-order pick
        // above resolves cleanly to "the later section that just entered."
        rootMargin: "-30% 0px -30% 0px",
        threshold: 0,
      }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <nav
      aria-label="Section navigation"
      className="fixed left-3u top-1/2 z-40 hidden -translate-y-1/2 md:block"
    >
      <ol className="m-0 flex list-none flex-col gap-y-3u p-0">
        {SECTIONS.map((s) => {
          const isActive = activeId === s.id;
          return (
            <li key={s.id} className="m-0 p-0">
              <a
                href={`#${s.id}`}
                aria-label={`Jump to ${s.label}`}
                aria-current={isActive ? "true" : undefined}
                className="group relative flex h-3u items-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                {/* Tick mark — horizontal hairline. Active = longer + accent;
                    inactive = short + rule, brightening to ink on hover. */}
                <span
                  aria-hidden="true"
                  className={
                    "block h-px transition-all duration-200 " +
                    (isActive
                      ? "w-5u bg-accent"
                      : "w-2u bg-rule group-hover:bg-ink group-focus-visible:bg-ink")
                  }
                />
                {/* Hover label — mono caption to the right of the mark.
                    Hidden at rest; fades + slides in on hover or focus-visible.
                    pointer-events-none so it doesn't trap clicks. */}
                <span className="pointer-events-none ml-3u -translate-x-1u whitespace-nowrap font-mono text-caption uppercase text-ink-mute opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100">
                  {s.label}
                </span>
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
