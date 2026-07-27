"use client";

import { useEffect, useRef } from "react";
import { FlipFluid } from "@/lib/effects/flip-fluid";
import { subscribe } from "@/lib/stage/ticker";
import { useStage } from "@/lib/stage/use-stage";

/**
 * ASCII FLIP fluid — the hero's living background.
 *
 * A real particle-in-cell fluid simulation, rendered not to pixels but to a
 * grid of monospace glyphs. Density picks the character: empty cells are
 * spaces, dense cells are letters. The pointer is a solid obstacle the fluid
 * has to flow around.
 *
 * Aesthetic retune from the source demo:
 *   - The demo spelled F/L/U/I/D in its dense cells. Ours spells BREACH.
 *   - The glyph ramp is drawn from the punctuation this site already uses
 *     (· - : ~), so at low density it reads as the page's own texture.
 *   - Gravity is softened well below 9.81 so the fluid sloshes rather than
 *     slamming to the floor — slower motion reads as more expensive.
 *   - Colour is a single acid tint at low alpha, masked away from the top
 *     where the headline sits. It is texture, never a competing subject.
 */

/**
 * Density ramp, ordered SPARSE → DENSE, because the lookup is
 * `RAMP[floor(density * RAMP.length)]` — index 0 is empty air.
 *
 * The source pack cycled a different dictionary per diagonal so that its
 * densest cells spelled out a word. That does not survive contact with a
 * settled fluid: an incompressible liquid sits at uniform rest density
 * throughout its body, so every interior cell lands in the top slot and the
 * word tiles into wallpaper across the whole pool. A single monotonic ramp
 * is both more honest to the physics and the thing that actually reads as
 * liquid — the variation lives at the surface, which is where the eye goes.
 *
 * Two leading spaces keep air genuinely empty rather than speckled.
 */
const RAMP = [" ", " ", "·", "-", ":", "+", "=", "#"];

/** Cell size in px. Bigger = coarser fluid and far less CPU. */
const CELL = 13;
/** Rows/columns trimmed off each edge so the tank walls never show. */
const CROP_X = 1;
const CROP_Y = 2;

const SIM_HEIGHT = 2.0;
/** Softer than earth gravity — this is a slow, heavy, expensive-looking liquid. */
const GRAVITY = -4.2;
const DT = 1 / 60 / 3;
const FLIP_RATIO = 0.9;
const PRESSURE_ITERS = 24;
const PARTICLE_ITERS = 2;
const OVER_RELAXATION = 1.9;
/** Pointer obstacle radius, in simulation units (tank is 2.0 tall). */
const OBSTACLE_RADIUS = 0.28;

export function AsciiFluid({ className }: { className?: string } = {}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const active = useStage(hostRef, { margin: "10% 0px 10% 0px" });

  useEffect(() => {
    if (!active) return;
    const host = hostRef.current;
    const pre = preRef.current;
    if (!host || !pre) return;

    const rect = host.getBoundingClientRect();
    const cols = Math.max(Math.floor(rect.width / CELL), 24);
    const rows = Math.max(Math.floor(rect.height / CELL), 24);

    // Simulation space: height is fixed at SIM_HEIGHT, width follows the
    // host's aspect ratio so cells stay square.
    const tankHeight = SIM_HEIGHT;
    const tankWidth = (cols / rows) * SIM_HEIGHT;
    const h = tankHeight / rows;

    // Particle packing — hexagonal, filling the lower 62% of the tank.
    const r = 0.3 * h;
    const dx = 2 * r;
    const dy = (Math.sqrt(3) / 2) * dx;
    const numX = Math.floor((tankWidth - 2 * h - 2 * r) / dx);
    const numY = Math.floor((0.62 * tankHeight - 2 * h - 2 * r) / dy);
    if (numX <= 0 || numY <= 0) return;

    const fluid = new FlipFluid(1000, tankWidth, tankHeight, h, r, numX * numY);
    fluid.gravityY = GRAVITY;
    fluid.numParticles = numX * numY;

    let p = 0;
    const xOffset = (tankWidth - numX * dx) / 2;
    for (let i = 0; i < numX; i++) {
      for (let j = 0; j < numY; j++) {
        fluid.particlePos[p++] = h + r + dx * i + (j % 2 === 0 ? 0 : r) + xOffset;
        fluid.particlePos[p++] = h + r + dy * j;
      }
    }

    // Tank walls: solid on the sides and floor, open at the top.
    const n = fluid.fNumY;
    for (let i = 0; i < fluid.fNumX; i++) {
      for (let j = 0; j < fluid.fNumY; j++) {
        fluid.s[i * n + j] = i === 0 || i === fluid.fNumX - 1 || j === 0 ? 0 : 1;
      }
    }

    // Pointer obstacle. Parked off-tank until the pointer actually enters,
    // so the fluid starts as an undisturbed pool.
    let obstacleX = -10;
    let obstacleY = -10;
    let targetX = -10;
    let targetY = -10;

    const onMove = (e: PointerEvent) => {
      const b = host.getBoundingClientRect();
      targetX = ((e.clientX - b.left) / b.width) * tankWidth;
      targetY = (1 - (e.clientY - b.top) / b.height) * tankHeight;
    };
    const onLeave = () => {
      targetX = -10;
      targetY = -10;
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);

    /**
     * Carve the obstacle into the solid field. Its velocity is imparted to
     * the fluid, which is what makes a fast swipe throw the liquid rather
     * than just displacing it.
     */
    const setObstacle = (x: number, y: number, vx: number, vy: number) => {
      const rad = OBSTACLE_RADIUS;
      for (let i = 1; i < fluid.fNumX - 2; i++) {
        for (let j = 1; j < fluid.fNumY - 2; j++) {
          const idx = i * n + j;
          fluid.s[idx] = 1;
          // Keep the walls solid — the loop above would otherwise reopen them.
          const cx = (i + 0.5) * fluid.h - x;
          const cy = (j + 0.5) * fluid.h - y;
          if (cx * cx + cy * cy < rad * rad) {
            fluid.s[idx] = 0;
            fluid.u[idx] = vx;
            fluid.u[(i + 1) * n + j] = vx;
            fluid.v[idx] = vy;
            fluid.v[idx + 1] = vy;
          }
        }
      }
      for (let i = 0; i < fluid.fNumX; i++) {
        for (let j = 0; j < fluid.fNumY; j++) {
          if (i === 0 || i === fluid.fNumX - 1 || j === 0) fluid.s[i * n + j] = 0;
        }
      }
    };

    // Reused across frames — building the string with an array join beats
    // repeated string concatenation at ~9000 cells/frame.
    const out: string[] = [];

    const unsubscribe = subscribe(() => {
      // Ease the obstacle toward the pointer so a fast flick drags the
      // fluid instead of teleporting through it.
      const prevX = obstacleX;
      const prevY = obstacleY;
      obstacleX += (targetX - obstacleX) * 0.25;
      obstacleY += (targetY - obstacleY) * 0.25;
      setObstacle(obstacleX, obstacleY, (obstacleX - prevX) / DT, (obstacleY - prevY) / DT);

      fluid.simulate(
        DT,
        GRAVITY,
        FLIP_RATIO,
        PRESSURE_ITERS,
        PARTICLE_ITERS,
        OVER_RELAXATION,
        true,
        true,
        obstacleX,
        obstacleY,
        OBSTACLE_RADIUS
      );

      // Render from the density field directly, NOT from `cellColor`. The
      // solver's cellColor is a scientific blue→red colour map, and its red
      // channel only climbs at the extreme end — using it leaves ~4% of the
      // pool visible. particleDensity/restDensity is the true fill fraction,
      // which is exactly what a glyph ramp wants.
      const rest = fluid.particleRestDensity || 1;
      out.length = 0;
      for (let i = fluid.fNumY - CROP_Y; i > CROP_Y; i--) {
        let row = "";
        for (let j = CROP_X; j < fluid.fNumX - CROP_X; j++) {
          let density = fluid.particleDensity[j * fluid.fNumY + i] / rest;
          if (density < 0) density = 0;
          else if (density > 1) density = 1;
          // clamp the index too: density touching 1.0 would run past the end.
          row += RAMP[Math.min(Math.floor(density * RAMP.length), RAMP.length - 1)];
        }
        out.push(row);
      }
      pre.textContent = out.join("\n");
    });

    return () => {
      unsubscribe();
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      pre.textContent = "";
    };
  }, [active]);

  return (
    <div
      ref={hostRef}
      aria-hidden="true"
      className={className ?? "pointer-events-none absolute inset-0 overflow-hidden"}
    >
      <pre
        ref={preRef}
        className="ascii-fluid absolute inset-0 m-0 select-none whitespace-pre font-mono text-acid"
      />
    </div>
  );
}
