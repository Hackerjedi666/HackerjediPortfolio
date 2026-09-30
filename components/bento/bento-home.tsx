"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, ArrowUpRight, X } from "@phosphor-icons/react/dist/ssr";
import { gsap } from "@/lib/effects/gsap";
import { TILES, type TileId } from "@/lib/content/bento";
import { TilePattern } from "@/components/bento/tile-pattern";
import { cn } from "@/lib/utils";

type Props = {
  /** Server-rendered section content, keyed by the tile that reveals it. */
  panels: Partial<Record<TileId, React.ReactNode>>;
  /** Atmospheric layer BEHIND the copy: dimmed and masked on purpose. */
  media?: Partial<Record<TileId, React.ReactNode>>;
  /**
   * Real content layered over a tile at full strength.
   *
   * Distinct from `media` because that layer is deliberately knocked back to
   * 55% and masked toward the bottom so copy keeps its contrast. Anything a
   * visitor is meant to actually read or click — a tweet, a stat, a link —
   * has to sit outside it, or it inherits the dimming and the fade.
   */
  overlay?: Partial<Record<TileId, React.ReactNode>>;
  /** Content that needs its own space below the copy, rather than an overlay. */
  details?: Partial<Record<TileId, React.ReactNode>>;
};

/**
 * The bento grid, and the sheet a tile opens into.
 *
 * WHY A SHEET AND NOT A PAGE. Every section used to be stacked on one scroll,
 * which meant the landing view committed a visitor to reading everything or
 * nothing. A grid states the whole shape of the work in one screen and lets
 * them choose the way in. The content itself is unchanged — each sheet renders
 * the existing section component, passed down from the server page, so none of
 * it became client-side or got duplicated here.
 *
 * WHY NOT A TRUE FLIP. The obvious implementation scales the sheet up from the
 * tile's exact rectangle. That distorts every glyph inside it for the length of
 * the animation unless each child is counter-scaled, and counter-scaling text
 * is how you get shimmering, half-pixel type. Instead the sheet scales from
 * 0.96 with its `transform-origin` set to the CLICKED TILE'S CENTRE, so the
 * panel still visibly grows out of the thing you pressed — the spatial link
 * Apple's guidance asks for — with no geometry distortion at all.
 *
 * Open and close travel the same path, and close runs at ~60% of open's
 * duration, because an exit that takes as long as an entrance reads as lag.
 */
export function BentoHome({ panels, media = {}, overlay = {}, details = {} }: Props) {
  const [open, setOpen] = useState<TileId | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);
  /** The tile that opened the sheet — focus returns here on close. */
  const originRef = useRef<HTMLButtonElement | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  /**
   * Whether an entrance is allowed to run AT ALL.
   *
   * GSAP drives tweens off requestAnimationFrame, and rAF does not tick in a
   * backgrounded tab. `fromTo` writes its from-state (opacity 0) synchronously
   * and then relies on a frame to animate back — so in a hidden tab, or any
   * time the ticker is starved, the sheet would open permanently invisible.
   *
   * The rule this enforces: the CSS resting state is the VISIBLE state, and
   * motion is only ever added on top of it. The failure mode has to be "no
   * animation", never "no content".
   */
  const canAnimateSheet = () =>
    typeof window !== "undefined" &&
    document.visibilityState === "visible" &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const openTile = (id: TileId, el: HTMLButtonElement) => {
    originRef.current = el;
    setOpen(id);
  };

  // A plain function, not useCallback. The React Compiler memoizes this
  // automatically and reported that it could not preserve the manual
  // wrapper, which turns an optimisation into a de-optimisation.
  /** The latest `close`, so the Escape listener can stay bound. */
  const gridRef = useRef<HTMLDivElement>(null);
  const closeFnRef = useRef<() => void>(() => {});
  const close = () => {
    const sheet = sheetRef.current;
    const scrim = scrimRef.current;
    if (!sheet || !scrim || !canAnimateSheet()) {
      setOpen(null);
      originRef.current?.focus();
      return;
    }
    // Animate from wherever it currently IS — if the user closes mid-open,
    // this picks up the live value instead of jumping to 1 first.
    gsap.to(sheet, {
      opacity: 0,
      scale: 0.97,
      duration: 0.42,
      ease: "power3.in",
      overwrite: true,
    });
    gsap.to(scrim, {
      opacity: 0,
      duration: 0.42,
      ease: "power3.in",
      overwrite: true,
      onComplete: () => {
        setOpen(null);
        originRef.current?.focus();
      },
    });
  };

  // Animate in, anchored to the tile that was pressed.
  useEffect(() => {
    if (!open) return;
    const sheet = sheetRef.current;
    const scrim = scrimRef.current;
    if (!sheet || !scrim) return;

    closeRef.current?.focus();
    // CSS already has it visible; only decorate if a frame will actually run.
    if (!canAnimateSheet()) return;

    const tile = originRef.current?.getBoundingClientRect();
    const box = sheet.getBoundingClientRect();
    if (tile) {
      // Origin in the sheet's own coordinate space, so the growth reads as
      // coming out of the tile even though the sheet is nearly full-bleed.
      const ox = ((tile.left + tile.width / 2 - box.left) / box.width) * 100;
      const oy = ((tile.top + tile.height / 2 - box.top) / box.height) * 100;
      gsap.set(sheet, { transformOrigin: `${ox}% ${oy}%` });
    }

    gsap.fromTo(
      scrim,
      { opacity: 0 },
      { opacity: 1, duration: 0.5, ease: "power2.out", overwrite: true }
    );
    gsap.fromTo(
      sheet,
      { opacity: 0, scale: 0.96 },
      { opacity: 1, scale: 1, duration: 0.7, ease: "expo.out", overwrite: true }
    );
  }, [open]);

  // If the tab is backgrounded mid-tween the ticker stops and the sheet would
  // be frozen part-way through its fade. Snap it to the end state instead.
  useEffect(() => {
    if (!open) return;
    const onVis = () => {
      if (document.visibilityState === "visible") return;
      const sheet = sheetRef.current;
      const scrim = scrimRef.current;
      if (sheet) gsap.set(sheet, { clearProps: "opacity,transform" });
      if (scrim) gsap.set(scrim, { clearProps: "opacity" });
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [open]);

  // Escape closes; the page behind must not scroll while a sheet is up.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // Called through a ref so this listener binds once per open rather than
    // re-binding on every render, and still always calls the current `close`.
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeFnRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    closeFnRef.current = close;
  });

  /**
   * Cursor spotlight.
   *
   * ONE delegated listener on the grid rather than one per tile, and it
   * writes CSS custom properties straight to the element — no state, so a
   * pointer sweep across eight tiles costs zero React renders. The gradient
   * itself lives in CSS; this only supplies the coordinates.
   */
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    let frame = 0;
    let last: HTMLElement | null = null;

    const onMove = (e: PointerEvent) => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const tile = (e.target as HTMLElement)?.closest<HTMLElement>(".bento-tile");
        if (tile !== last) {
          last?.style.removeProperty("--spot");
          last = tile;
        }
        if (!tile) return;
        const r = tile.getBoundingClientRect();
        tile.style.setProperty("--mx", `${e.clientX - r.left}px`);
        tile.style.setProperty("--my", `${e.clientY - r.top}px`);
        tile.style.setProperty("--spot", "1");
      });
    };
    const onLeave = () => {
      last?.style.removeProperty("--spot");
      last = null;
    };

    grid.addEventListener("pointermove", onMove, { passive: true });
    grid.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(frame);
      grid.removeEventListener("pointermove", onMove);
      grid.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  const active = TILES.find((t) => t.id === open);

  return (
    <>
      <div ref={gridRef} className="bento-grid">
        {TILES.map((tile) => {
          const opens = tile.opens !== false && !tile.href && panels[tile.id];
          const Inner = (
            <>
              {tile.pattern ? <TilePattern name={tile.pattern} /> : null}

              {tile.media && media[tile.id] ? (
                <span aria-hidden="true" className="bento-media">
                  {media[tile.id]}
                </span>
              ) : null}

              {overlay[tile.id] ? (
                <span className="bento-overlay">{overlay[tile.id]}</span>
              ) : null}

              <span className="relative flex items-start justify-between gap-4">
                {/* The label names the tile. No section number: a number is
                    only earned when the sequence is information, and it was
                    decoration on every tile here. */}
                <span className="text-label text-ink-label">{tile.label}</span>
                {opens ? (
                  <span aria-hidden="true" className="bento-cue">
                    <span className="bento-cue-bar" />
                    <span className="bento-cue-bar" />
                  </span>
                ) : null}
                {tile.href ? (
                  <ArrowUpRight
                    size={16}
                    weight="bold"
                    aria-hidden="true"
                    className="flex-none text-acid transition-transform duration-400 ease-out-expo group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  />
                ) : null}
              </span>

              <span className="bento-copy relative mt-auto block pt-10">
                {/* No kicker above the heading: the heading carries its own
                    weight. */}
                <span
                  // Feeds the ::after overlay. Generated content cannot read
                  // the element's own text, so the string is handed to CSS.
                  data-shine={tile.id === "identity" ? tile.title : undefined}
                  className={cn(
                    "block whitespace-pre-line font-display font-bold",
                    tile.id === "identity" ? "text-h2 shine-sweep" : "text-card",
                    tile.accent ? "text-acid" : "text-ink"
                  )}
                >
                  {tile.title}
                </span>
                {tile.note ? (
                  <span
                    className={cn(
                      "mt-4 block text-body text-ink-body",
                      tile.id === "identity" ? "max-w-[46ch] lg:max-w-[44ch]" : "max-w-[44ch]"
                    )}
                  >
                    {tile.note}
                  </span>
                ) : null}
              </span>

              {details[tile.id] ? <span className="bento-detail">{details[tile.id]}</span> : null}

              {/* Rides up out of the bottom edge into the space the copy
                  vacates. The two move together on one curve, so it reads as
                  one gesture rather than two effects that happen to overlap. */}
              {opens || tile.href ? (
                <span aria-hidden="true" className="bento-cta">
                  {tile.href ? "Read the disclosure" : "Open"}
                  <ArrowRight size={14} weight="bold" aria-hidden="true" />
                </span>
              ) : null}
            </>
          );

          const cls = cn(
            "bento-tile group",
            details[tile.id] && "bento-tile-with-detail",
            tile.bone && "bento-tile-bone",
            tile.accent && "bento-tile-accent",
            (opens || tile.href) && "bento-tile-opens"
          );
          const style = {
            "--tile-span": tile.span,
            "--tile-rows": tile.rows ?? 1,
            "--tile-i": TILES.indexOf(tile),
          } as React.CSSProperties;

          if (tile.href) {
            return (
              <a
                key={tile.id}
                id={tile.id}
                href={tile.href}
                target="_blank"
                rel="noreferrer noopener"
                style={style}
                className={cls}
              >
                {Inner}
              </a>
            );
          }

          return opens ? (
            <button
              key={tile.id}
              id={tile.id}
              type="button"
              style={style}
              className={cls}
              aria-expanded={open === tile.id}
              aria-label={`Open ${tile.label}`}
              onClick={(e) => openTile(tile.id, e.currentTarget)}
            >
              {Inner}
            </button>
          ) : (
            <div key={tile.id} id={tile.id} style={style} className={cls}>
              {Inner}
            </div>
          );
        })}
      </div>

      {open && active ? (
        <div className="bento-sheet-layer" data-lenis-prevent>
          <div
            ref={scrimRef}
            className="bento-scrim"
            onClick={close}
            aria-hidden="true"
          />
          <div
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-label={active.label}
            className="bento-sheet"
          >
            <div className="bento-sheet-bar">
              <span className="text-label text-ink-label">
                {active.label}
              </span>
              <button
                ref={closeRef}
                type="button"
                onClick={close}
                aria-label="Close"
                className="bento-close"
              >
                <X size={18} weight="bold" aria-hidden="true" />
              </button>
            </div>
            <div className="bento-sheet-body">{panels[active.id]}</div>
          </div>
        </div>
      ) : null}
    </>
  );
}
