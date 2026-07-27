"use client";

import { useEffect, useRef } from "react";
import { subscribe } from "@/lib/stage/ticker";
import { useStage, useTier } from "@/lib/stage/use-stage";

/**
 * Text rendered as a live ASCII cell grid that scatters away from the cursor.
 *
 * Ported from the "modulo hover effect" pack (artefakt interactive ascii
 * logo). The mechanic is unchanged: a dot grid, a source rasterised into
 * lit cells, a random glyph per lit cell reshuffled on an interval, and
 * per-cell spring physics that push cells out of the cursor's radius and
 * pull them home.
 *
 * Two substantive changes:
 *
 *   1. The source is TEXT rasterised at runtime, not a PNG. The original
 *      sampled a logo image; sampling live text means it inherits the site's
 *      display font, stays sharp at any DPR, and needs no asset — and the
 *      string stays in the DOM for screen readers.
 *   2. The pack ran a permanent `setInterval` for the scramble plus its own
 *      unbounded `requestAnimationFrame`. Both now run off the shared
 *      ticker, with the scramble on a time accumulator, so this costs
 *      nothing while it's off-screen.
 *
 * Colour comes from the live computed values of --color-ink / --color-acid,
 * so root mode (konami) re-themes the glyphs for free.
 */

/**
 * Deliberately DENSE only. The source set ran ".:+*#%@0369" and picked from
 * it uniformly at random, so a lit cell was as likely to draw "." as "@" —
 * which punches holes through the letterforms and turns a 32-character
 * address into mush. Every glyph here has heavy coverage, so the strokes
 * stay solid while still churning.
 */
const GLYPHS = "#%@8&0*$";
/** Brightness above which a sampled cell counts as part of a letterform. */
const THRESHOLD = 0.5;
/** Cursor influence radius, in cells. */
const PUSH_RADIUS = 5;
const PUSH_FORCE = 30;
const SPRING = 0.025;
const DAMPING = 0.5;
/** Glyph reshuffle interval. */
const SCRAMBLE_MS = 50;

type Cell = {
  col: number;
  row: number;
  char: string;
  offsetX: number;
  offsetY: number;
  velX: number;
  velY: number;
};

type Props = {
  text: string;
  className?: string;
  /** Rendered text size in px. The grid resolves from this. */
  fontSize?: number;
};

export function ModuloText({ text, className, fontSize = 68 }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tier = useTier();
  const active = useStage(hostRef, { margin: "25% 0px 25% 0px", require: "lite" });

  useEffect(() => {
    if (!active) return;
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const styles = getComputedStyle(host);
    const inkColor = styles.getPropertyValue("--color-ink").trim() || "#f2f2f2";
    const acidColor = styles.getPropertyValue("--color-acid").trim() || "#c2ff45";
    // Custom properties resolve to concrete font stacks at computed-value
    // time, so these are safe to hand to `ctx.font` — a raw `var()` in a
    // canvas font string is invalid and silently keeps the previous font.
    const fontFamily = styles.getPropertyValue("--font-display").trim() || "sans-serif";
    const monoFamily = styles.getPropertyValue("--font-mono").trim() || "monospace";

    let cells: Cell[] = [];
    let cols = 0;
    let rows = 0;
    let cellSize = 4;
    let gap = 1;
    let step = 5;
    let dpr = 1;

    /** Rasterise the string, then read it back as a grid of lit/unlit cells. */
    const build = () => {
      const width = host.clientWidth;
      if (width < 8) return;

      // Finer grid on small screens so the letterforms stay legible when the
      // type itself is smaller.
      const small = window.innerWidth < 768;
      cellSize = small ? 2 : 3;
      gap = 1;
      step = cellSize + gap;

      // Mirrors the type ramp this line used before it became a canvas:
      // clamp(22px, 5.2vw, 68px). Without it the grid would be 68px tall on
      // a 375px phone and the address would run off the screen.
      const effective = Math.max(22, Math.min(window.innerWidth * 0.052, fontSize));

      // Measure the string so the canvas is only as tall as the text needs.
      ctx.font = `700 ${effective}px ${fontFamily}`;
      const metrics = ctx.measureText(text);
      const height = Math.ceil(effective * 1.02);
      cols = Math.floor(width / step);
      rows = Math.floor(height / step);

      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Rasterise at cell resolution: one source pixel per cell, so reading
      // brightness back is a direct lookup with no downsampling loop.
      const sample = document.createElement("canvas");
      sample.width = cols;
      sample.height = rows;
      const sctx = sample.getContext("2d", { willReadFrequently: true });
      if (!sctx) return;

      sctx.fillStyle = "#000";
      sctx.fillRect(0, 0, cols, rows);
      sctx.fillStyle = "#fff";
      // Scale the glyphs into the cell grid, shrinking to fit if the string
      // is wider than the column.
      const fit = Math.min(1, width / Math.max(metrics.width, 1));
      sctx.font = `700 ${(effective / step) * fit}px ${fontFamily}`;
      sctx.textBaseline = "middle";
      sctx.textAlign = "left";
      sctx.fillText(text, 0, rows / 2);

      const { data } = sctx.getImageData(0, 0, cols, rows);

      cells = [];
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const i = (row * cols + col) * 4;
          const brightness =
            (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) / 255;
          if (brightness <= THRESHOLD) continue; // unlit cells are never stored
          cells.push({
            col,
            row,
            char: GLYPHS[Math.min(GLYPHS.length - 1, Math.floor(brightness * GLYPHS.length))],
            offsetX: 0,
            offsetY: 0,
            velX: 0,
            velY: 0,
          });
        }
      }
    };

    build();

    const mouse = { col: -999, row: -999, active: false };
    let idle: ReturnType<typeof setTimeout>;

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const r = canvas.getBoundingClientRect();
      mouse.col = (e.clientX - r.left) / step;
      mouse.row = (e.clientY - r.top) / step;
      mouse.active = true;
      clearTimeout(idle);
      idle = setTimeout(() => {
        mouse.active = false;
      }, 60);
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    const resizeObserver = new ResizeObserver(() => build());
    resizeObserver.observe(host);

    let scrambleAcc = 0;

    const unsubscribe = subscribe((dt) => {
      // ---- scramble -------------------------------------------------
      scrambleAcc += dt * 1000;
      if (scrambleAcc >= SCRAMBLE_MS) {
        scrambleAcc = 0;
        for (const cell of cells) {
          cell.char = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        }
      }

      // ---- physics --------------------------------------------------
      for (const cell of cells) {
        if (mouse.active) {
          const dx = cell.col + cell.offsetX - mouse.col;
          const dy = cell.row + cell.offsetY - mouse.row;
          const dist = Math.hypot(dx, dy);
          if (dist < PUSH_RADIUS && dist > 0) {
            const force = (1 - dist / PUSH_RADIUS) ** 2 * PUSH_FORCE;
            cell.velX += (dx / dist) * force;
            cell.velY += (dy / dist) * force;
          }
        }
        cell.velX += -cell.offsetX * SPRING;
        cell.velY += -cell.offsetY * SPRING;
        cell.velX *= DAMPING;
        cell.velY *= DAMPING;
        cell.offsetX += cell.velX;
        cell.offsetY += cell.velY;
        if (Math.abs(cell.offsetX) < 0.01 && Math.abs(cell.velX) < 0.01) {
          cell.offsetX = cell.velX = 0;
        }
        if (Math.abs(cell.offsetY) < 0.01 && Math.abs(cell.velY) < 0.01) {
          cell.offsetY = cell.velY = 0;
        }
      }

      // ---- draw -----------------------------------------------------
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;
      ctx.clearRect(0, 0, w, h);

      // No dot-matrix backing. The source pack drew the full grid behind the
      // logo, but at this cell size it reads as a hatched band across the
      // address and the letterforms disappear into it. Lit cells only.
      ctx.font = `700 ${step + 2}px ${monoFamily}`;
      ctx.textBaseline = "top";
      ctx.textAlign = "center";

      for (const cell of cells) {
        // Displaced cells glow acid — the disturbance reads as energy rather
        // than as the text simply falling apart.
        const moved = Math.abs(cell.offsetX) + Math.abs(cell.offsetY);
        ctx.fillStyle = moved > 0.35 ? acidColor : inkColor;
        const x = (cell.col + cell.offsetX) * step;
        const y = (cell.row + cell.offsetY) * step;
        ctx.fillText(cell.char, x + cellSize / 2, y);
      }
    });

    return () => {
      unsubscribe();
      clearTimeout(idle);
      resizeObserver.disconnect();
      window.removeEventListener("pointermove", onMove);
    };
  }, [active, text, fontSize]);

  // Plain type on anything that isn't a full-tier pointer device.
  //
  // Two separate reasons, both decisive:
  //   - "static" (reduced motion): the canvas would never be built, leaving a
  //     blank block whose only copy of the address is an sr-only span.
  //   - "lite" (touch): this is a *pointer* effect. With no cursor to scatter
  //     the cells it does nothing at all, while the type ramp squeezes the
  //     address into ~7 cell rows at phone widths — unreadable, in exchange
  //     for an interaction that device cannot perform.
  if (tier !== "full") {
    return (
      <div className={className}>
        <span
          className="block break-words font-display font-bold leading-[1.02] tracking-[-0.03em] text-ink"
          style={{ fontSize: `clamp(22px, 5.2vw, ${fontSize}px)` }}
        >
          {text}
        </span>
      </div>
    );
  }

  return (
    <div ref={hostRef} className={className}>
      {/* The address stays in the accessibility tree and in the page source —
          the canvas is purely a rendering of it. */}
      <span className="sr-only">{text}</span>
      {/* Explicit height reserves the right box before the grid is built, so
          the footer doesn't reflow when the effect initialises — and an
          unbuilt 300x150 canvas can't stretch to an absurd height. */}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="block w-full"
        style={{ height: `clamp(22px, 5.2vw, ${fontSize}px)` }}
      />
    </div>
  );
}
