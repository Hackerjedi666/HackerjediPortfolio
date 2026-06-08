"use client";

import { useEffect, useState } from "react";

// Section list — drives both the rail's marks and the scroll-spy. The
// `page` field is each section's index in the BookStack (set in app/page.tsx),
// used both for anchor-click scroll targeting and for active-state tracking.
// Interlude pages (Scope at index 2, Stance at index 5) intentionally have
// no rail entry — the preceding section's rail mark stays active while the
// reader is on its interlude.
const SECTIONS: ReadonlyArray<{ id: string; label: string; page: number }> = [
  // Page 0 is the whoami intro — "Top" returns the reader to that opening.
  // Page 1 is the hero. Top covers both 0 and 1 because no rail entry sits
  // between them.
  { id: "top", label: "Top", page: 0 },
  { id: "selected-work", label: "Selected Work", page: 2 },
  // Scope interlude lives at page 3 (no rail entry; covered by Selected Work).
  { id: "open-source", label: "Open Source", page: 4 },
  { id: "capabilities", label: "Capabilities", page: 5 },
  // Stance interlude at page 6 (covered by Capabilities).
  { id: "ventures", label: "Ventures", page: 7 },
  { id: "articles", label: "Articles", page: 8 },
  { id: "contact", label: "Contact", page: 9 },
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
    // Natural-scroll mode: IntersectionObserver across section elements with
    // a narrow activation band (the upper-middle reading zone). Pick the
    // latest intersecting section in document order so transitions resolve
    // cleanly to "the section just entered."
    const order = SECTIONS.map((s) => s.id);
    const elements = SECTIONS.map((s) => document.getElementById(s.id)).filter(
      (el): el is HTMLElement => el !== null
    );
    if (elements.length === 0) return;

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
      { rootMargin: "-30% 0px -30% 0px", threshold: 0 }
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Anchor click → let Lenis handle it via anchors:true. Falls through to
  // native browser behavior in non-Lenis paths. No JS handler needed here.

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
