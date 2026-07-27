"use client";

import { useEffect, useRef } from "react";
import { gsap, useGsap } from "@/lib/effects/gsap";
import { canAnimate } from "@/lib/stage/capability";
import { NAV_PREVIEWS, type NavPreview } from "@/lib/content/nav-previews";

/**
 * Full-bleed preview grid behind the nav.
 *
 * The HoverGrid pack revealed a scattered grid of photographs when you
 * hovered a nav link. This site has no photographs and shouldn't pretend to
 * — so the tiles are built from its own content instead: the section number,
 * the hardest number in that section, the client type, the year. Hovering
 * OPS shows you what's in the ops section rather than a stock image.
 *
 * Mechanic is unchanged: a 10×10 grid, three tiles per layout at asymmetric
 * grid-areas, each wiping in from its own direction with a clip-path and a
 * brightness flash, plus a scale-down on the inner element so the content
 * settles rather than arriving static.
 *
 * Everything here is decorative and `aria-hidden` — the nav links remain
 * plain anchors, and a keyboard or screen-reader user gets the nav with none
 * of this in their way.
 */

const CLIP: Record<string, string> = {
  right: "polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)",
  left: "polygon(100% 0%, 100% 0%, 100% 100%, 100% 100%)",
  top: "polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)",
  bottom: "polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)",
};
const OPEN = "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)";

export function NavPreview({ activeId }: { activeId: string | null }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const timelines = useRef<Map<string, gsap.core.Timeline>>(new Map());
  useGsap();

  useEffect(() => {
    const root = rootRef.current;
    if (!root || !canAnimate()) return;

    const show = (id: string) => {
      const panel = root.querySelector<HTMLElement>(`[data-preview="${id}"]`);
      if (!panel) return;

      timelines.current.get(id)?.kill();
      gsap.set(panel, { zIndex: 1 });
      panel.classList.add("is-current");

      const tiles = panel.querySelectorAll<HTMLElement>("[data-tile]");
      const inners = panel.querySelectorAll<HTMLElement>("[data-tile-inner]");
      const title = panel.querySelector<HTMLElement>("[data-preview-title]");

      const tl = gsap
        .timeline({ defaults: { duration: 0.95, ease: "power4" } })
        .fromTo(title, { opacity: 0, scale: 0.94 }, { opacity: 1, scale: 1 }, 0)
        .fromTo(
          tiles,
          {
            xPercent: () => gsap.utils.random(-8, 8),
            yPercent: () => gsap.utils.random(-8, 8),
            filter: "brightness(320%)",
            clipPath: (_i: number, t: HTMLElement) => CLIP[t.dataset.dir ?? ""] ?? OPEN,
          },
          {
            xPercent: 0,
            yPercent: 0,
            filter: "brightness(100%)",
            clipPath: OPEN,
          },
          0
        )
        .fromTo(inners, { scale: 1.35 }, { scale: 1 }, 0);

      timelines.current.set(id, tl);
    };

    const hide = (id: string) => {
      const panel = root.querySelector<HTMLElement>(`[data-preview="${id}"]`);
      if (!panel) return;

      timelines.current.get(id)?.kill();
      gsap.set(panel, { zIndex: 0 });

      const tiles = panel.querySelectorAll<HTMLElement>("[data-tile]");
      const inners = panel.querySelectorAll<HTMLElement>("[data-tile-inner]");
      const title = panel.querySelector<HTMLElement>("[data-preview-title]");

      const tl = gsap
        .timeline({
          defaults: { duration: 0.75, ease: "power4" },
          onComplete: () => panel.classList.remove("is-current"),
        })
        .to(title, { opacity: 0 }, 0)
        .to(tiles, { clipPath: (_i: number, t: HTMLElement) => CLIP[t.dataset.dir ?? ""] ?? OPEN }, 0)
        .to(inners, { scale: 1.35 }, 0);

      timelines.current.set(id, tl);
    };

    // Hide whatever isn't current, show what is. Driven by the nav's state
    // rather than by listeners here, so the nav owns hover/focus semantics.
    for (const preview of NAV_PREVIEWS) {
      if (preview.id === activeId) show(preview.id);
      else hide(preview.id);
    }
  }, [activeId]);

  // Snapshot the map for cleanup — the ref's contents can change before the
  // unmount effect runs, and killing a stale set is a no-op either way.
  useEffect(() => {
    const map = timelines.current;
    return () => {
      for (const tl of map.values()) tl.kill();
      map.clear();
    };
  }, []);

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[70] hidden lg:block"
    >
      {/* Dim wash so the page behind recedes while a preview is open. */}
      <div
        className="absolute inset-0 bg-void transition-opacity duration-500"
        style={{ opacity: activeId ? 0.82 : 0 }}
      />
      {NAV_PREVIEWS.map((preview) => (
        <PreviewPanel key={preview.id} preview={preview} />
      ))}
    </div>
  );
}

function PreviewPanel({ preview }: { preview: NavPreview }) {
  return (
    <div
      data-preview={preview.id}
      className="nav-preview absolute inset-0 grid grid-cols-10 grid-rows-10 gap-2 px-gutter pb-16 pt-24"
    >
      <p
        data-preview-title
        className="pointer-events-none col-start-2 col-end-10 row-start-1 row-end-11 grid place-content-center text-center font-display text-[clamp(3rem,9vw,8rem)] font-bold uppercase leading-none text-ink opacity-0"
      >
        {preview.title}
      </p>

      {preview.tiles.map((tile, i) => (
        <div
          key={i}
          data-tile
          data-dir={tile.dir}
          style={{ gridArea: tile.area }}
          className="relative z-10 overflow-hidden border border-line-hi bg-panel/90 backdrop-blur-sm"
        >
          <div
            data-tile-inner
            className="flex h-full w-full flex-col justify-between p-4"
          >
            <span className="text-micro text-acid">{tile.eyebrow}</span>
            <span className="font-display text-[clamp(1rem,2vw,1.75rem)] font-bold leading-tight text-ink">
              {tile.value}
            </span>
            <span className="text-micro text-ink-label">{tile.note}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
