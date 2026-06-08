"use client";

import { useEffect, useRef } from "react";
import { Renderer, Camera, Geometry, Program, Mesh, Texture } from "ogl";
import { getReducedMotion } from "@/lib/motion";

/**
 * Cursor-reactive hex-character particle field for the contact section.
 *
 * Architecture:
 *   1. A texture atlas (4×4 grid of 64×64 cells) is pre-rendered with the
 *      hex characters 0–9 A–F using canvas2D. Each particle holds a fixed
 *      atlas index in [0, 15] and the fragment shader samples its assigned
 *      cell using gl_PointCoord.
 *   2. ~2500 OGL Points (rendered as gl.POINTS) hold position + char-index
 *      attributes. Targets are a stratified random distribution in NDC space.
 *   3. CPU physics per frame:
 *        - Cursor repulsion (radial falloff over REPEL_RADIUS),
 *        - Spring force pulling each particle back toward its target,
 *        - Damping so the field settles after the cursor leaves.
 *      Position buffer is uploaded to the GPU each frame (~30 KB; trivial).
 *   4. Fragment shader colors:
 *        - Default: warm bone (--color-ink at rest),
 *        - Within glow radius of the cursor: lerps to steel-cyan accent.
 *
 * Skipped on reduced-motion and <768px. The mailto link stays clickable
 * because the canvas wrapper is pointer-events: none.
 */

// Lusion-style physics — each particle has a HOME in a pile-shaped
// distribution in the bottom half. Strong cursor force throws particles
// dramatically. Weak spring + strong damping let them fly far before
// returning, so it feels fluid, not restrictive.
const PARTICLE_COUNT = 5500;
// Cursor — punchy. Bigger radius, much stronger push.
const REPEL_RADIUS = 0.55;
const REPEL_STRENGTH = 0.3;
// Spring back to home — INTENTIONALLY WEAK. Particles can fly far before
// the spring catches them; it only matters for the final return arc.
const SPRING_K = 0.018;
// Damping — strong enough that the field eventually settles, but loose
// enough that particles drift naturally in flight.
const DAMPING = 0.87;
// Inter-particle collision — soft, just for ball-bumping texture.
const PARTICLE_MIN_DIST = 0.034;
const PARTICLE_REPEL = 0.006;
// Soft canvas bounds — cursor can push particles past them briefly; spring
// recalls them. Wide so particles can fly off canvas momentarily.
const WALL_X_MARGIN = 1.1;
const WALL_Y_MARGIN = 1.1;
// Spatial-hash cell size (must be >= 2 × PARTICLE_MIN_DIST so a particle's
// neighbor query in 3×3 cells covers its full interaction radius).
const GRID_CELL = 0.085;

const VERTEX = /* glsl */ `
  attribute vec3 position;
  attribute float charIndex;
  varying float vCharIndex;
  varying vec2 vPos;
  uniform mat4 projectionMatrix;
  uniform mat4 viewMatrix;
  void main() {
    vCharIndex = charIndex;
    vPos = position.xy;
    gl_PointSize = 26.0;
    gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.0);
  }
`;

const FRAGMENT = /* glsl */ `
  precision highp float;
  uniform sampler2D atlas;
  uniform vec2 cursor;
  uniform vec3 baseColor;
  uniform vec3 glowColor;
  varying float vCharIndex;
  varying vec2 vPos;
  void main() {
    float idx = floor(vCharIndex + 0.5);
    float col = mod(idx, 4.0);
    float row = floor(idx / 4.0);
    vec2 cellUV = vec2(col / 4.0, row / 4.0);
    vec2 sampleUV = cellUV + gl_PointCoord * 0.25;
    sampleUV.y = 1.0 - sampleUV.y;
    vec4 c = texture2D(atlas, sampleUV);

    float d = length(vPos - cursor);
    float glow = 1.0 - smoothstep(0.0, 0.4, d);
    // Colors are uniforms — re-read from CSS custom properties (--color-ink
    // and --color-accent) when the document theme changes (root-mode toggle).
    vec3 color = mix(baseColor, glowColor, glow);

    float alpha = c.a * (0.95 + glow * 0.05);
    if (alpha < 0.02) discard;
    gl_FragColor = vec4(color, alpha);
  }
`;

export function ContactPlayable() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (getReducedMotion()) return;
    if (window.innerWidth < 768) return;

    const container = containerRef.current;
    if (!container) return;

    const w = container.clientWidth || 1;
    const h = container.clientHeight || 1;

    const renderer = new Renderer({
      alpha: true,
      antialias: true,
      dpr: Math.min(1.5, window.devicePixelRatio || 1),
      width: w,
      height: h,
    });
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);
    container.appendChild(gl.canvas);
    gl.canvas.style.width = "100%";
    gl.canvas.style.height = "100%";
    gl.canvas.style.display = "block";

    // ---- Hex-char texture atlas ---------------------------------------
    const atlasCanvas = document.createElement("canvas");
    atlasCanvas.width = 256;
    atlasCanvas.height = 256;
    const ctx2d = atlasCanvas.getContext("2d");
    if (!ctx2d) return;
    ctx2d.clearRect(0, 0, 256, 256);
    ctx2d.fillStyle = "white";
    ctx2d.font = "bold 44px ui-monospace, JetBrains Mono, monospace";
    ctx2d.textAlign = "center";
    ctx2d.textBaseline = "middle";
    const HEX = "0123456789ABCDEF";
    for (let i = 0; i < 16; i++) {
      const col = i % 4;
      const row = Math.floor(i / 4);
      ctx2d.fillText(HEX[i], col * 64 + 32, row * 64 + 32);
    }
    const atlasTex = new Texture(gl, {
      image: atlasCanvas,
      generateMipmaps: false,
      minFilter: gl.LINEAR,
      magFilter: gl.LINEAR,
    });

    // ---- Particle data -------------------------------------------------
    let aspect = w / h;
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const targets = new Float32Array(PARTICLE_COUNT * 2);
    const velocities = new Float32Array(PARTICLE_COUNT * 3);
    const charIndices = new Float32Array(PARTICLE_COUNT);

    // Home positions = pile shape in the BOTTOM HALF only (so the text
    // area at the top stays clear and readable). pow(random, 2) biases
    // toward 0, which after the affine map ends up at the FLOOR — dense
    // at the floor, thinning rapidly upward, stops well below the text.
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const tx = (Math.random() * 2 - 1) * aspect * 0.97;
      // pow(rand, 2) → biased toward 0 → ty biased toward -0.95 (floor).
      // Range capped at -0.05 so the top of the pile is at canvas mid-
      // height, never reaching the text.
      const yRand = Math.pow(Math.random(), 2);
      const ty = -0.95 + yRand * 0.9; // [-0.95, -0.05]
      targets[i * 2] = tx;
      targets[i * 2 + 1] = ty;
      positions[i * 3] = tx;
      positions[i * 3 + 1] = ty;
      charIndices[i] = Math.floor(Math.random() * 16);
    }

    const geometry = new Geometry(gl, {
      position: { size: 3, data: positions, usage: gl.DYNAMIC_DRAW },
      charIndex: { size: 1, data: charIndices },
    });

    // Read --color-ink and --color-accent into [r,g,b] floats so the shader
    // matches the live theme. Re-read on root-mode toggle via MutationObserver
    // below.
    const readThemeColor = (varName: string): [number, number, number] => {
      const raw = getComputedStyle(document.documentElement)
        .getPropertyValue(varName)
        .trim();
      const hex = raw.replace("#", "");
      const full =
        hex.length === 3
          ? hex
              .split("")
              .map((c) => c + c)
              .join("")
          : hex.padEnd(6, "0");
      const n = parseInt(full, 16) || 0;
      return [((n >> 16) & 0xff) / 255, ((n >> 8) & 0xff) / 255, (n & 0xff) / 255];
    };

    const program = new Program(gl, {
      vertex: VERTEX,
      fragment: FRAGMENT,
      uniforms: {
        atlas: { value: atlasTex },
        cursor: { value: [10, 10] },
        baseColor: { value: readThemeColor("--color-ink") },
        glowColor: { value: readThemeColor("--color-accent") },
      },
      transparent: true,
      depthTest: false,
    });

    // Re-read theme colors when the html class changes (root-mode toggle).
    const themeObserver = new MutationObserver(() => {
      (program.uniforms.baseColor.value as number[]).splice(
        0,
        3,
        ...readThemeColor("--color-ink")
      );
      (program.uniforms.glowColor.value as number[]).splice(
        0,
        3,
        ...readThemeColor("--color-accent")
      );
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    const mesh = new Mesh(gl, { geometry, program, mode: gl.POINTS });

    const camera = new Camera(gl, {
      left: -aspect,
      right: aspect,
      top: 1,
      bottom: -1,
      near: 0,
      far: 10,
    });
    camera.position.z = 1;

    // ---- Cursor tracking (window-level so canvas can stay pointer-none) -
    let cursorX = 10;
    let cursorY = 10;
    const onMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      // If pointer is outside the container, push the cursor far away so
      // the field settles back to targets.
      if (
        e.clientX < rect.left ||
        e.clientX > rect.right ||
        e.clientY < rect.top ||
        e.clientY > rect.bottom
      ) {
        cursorX = 10;
        cursorY = 10;
        return;
      }
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      cursorX = nx * aspect;
      cursorY = ny;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    const onResize = () => {
      const nw = container.clientWidth;
      const nh = container.clientHeight;
      if (nw === 0 || nh === 0) return;
      renderer.setSize(nw, nh);
      aspect = nw / nh;
      camera.left = -aspect;
      camera.right = aspect;
      camera.updateMatrixWorld();
    };
    window.addEventListener("resize", onResize);

    // ---- Animation loop ------------------------------------------------
    let raf = 0;
    let visible = true;
    const onVis = () => {
      visible = !document.hidden;
    };
    document.addEventListener("visibilitychange", onVis);

    // Spatial-hash grid reused across frames. Map<cellId, particleIndices[]>.
    // Reusing a single Map and clearing it each frame keeps GC pressure low.
    const grid = new Map<number, number[]>();
    // Cell IDs are packed as cy * GRID_STRIDE + cx with a bias so negative
    // cells map to positive ints. Stride must exceed plausible width/cell.
    const GRID_STRIDE = 1024;
    const GRID_BIAS = 512;

    const tick = () => {
      if (visible) {
        // ---- Build spatial grid (for inter-particle collisions) -------
        grid.clear();
        for (let i = 0; i < PARTICLE_COUNT; i++) {
          const ix = i * 3;
          const cx = Math.floor(positions[ix] / GRID_CELL) + GRID_BIAS;
          const cy = Math.floor(positions[ix + 1] / GRID_CELL) + GRID_BIAS;
          const key = cy * GRID_STRIDE + cx;
          const bucket = grid.get(key);
          if (bucket) bucket.push(i);
          else grid.set(key, [i]);
        }

        // ---- Inter-particle collision (soft repulsion) ----------------
        const MIN_D2 = PARTICLE_MIN_DIST * PARTICLE_MIN_DIST;
        for (let i = 0; i < PARTICLE_COUNT; i++) {
          const ix = i * 3;
          const px = positions[ix];
          const py = positions[ix + 1];
          const cx = Math.floor(px / GRID_CELL) + GRID_BIAS;
          const cy = Math.floor(py / GRID_CELL) + GRID_BIAS;
          for (let dcx = -1; dcx <= 1; dcx++) {
            for (let dcy = -1; dcy <= 1; dcy++) {
              const key = (cy + dcy) * GRID_STRIDE + (cx + dcx);
              const bucket = grid.get(key);
              if (!bucket) continue;
              for (let k = 0; k < bucket.length; k++) {
                const j = bucket[k];
                if (j <= i) continue;
                const jx = j * 3;
                const ddx = positions[jx] - px;
                const ddy = positions[jx + 1] - py;
                const d2 = ddx * ddx + ddy * ddy;
                if (d2 < MIN_D2 && d2 > 0.000001) {
                  const d = Math.sqrt(d2);
                  const f = ((1 - d / PARTICLE_MIN_DIST) * PARTICLE_REPEL) / d;
                  const fx = ddx * f;
                  const fy = ddy * f;
                  velocities[ix] -= fx;
                  velocities[ix + 1] -= fy;
                  velocities[jx] += fx;
                  velocities[jx + 1] += fy;
                }
              }
            }
          }
        }

        // ---- Per-particle: cursor + spring-home + damping + soft clamp --
        // Strong cursor force throws particles; spring pulls them home;
        // damping smooths motion. No gravity, no wall-sticking. The "balls
        // flying" feeling comes from REPEL_STRENGTH being large relative
        // to SPRING_K — cursor briefly dominates, then spring takes over.
        const cursorR2 = REPEL_RADIUS * REPEL_RADIUS;
        const leftWall = -aspect * WALL_X_MARGIN;
        const rightWall = aspect * WALL_X_MARGIN;
        const topWall = WALL_Y_MARGIN;
        const bottomWall = -WALL_Y_MARGIN;
        for (let i = 0; i < PARTICLE_COUNT; i++) {
          const ix = i * 3;
          const iy = ix + 1;
          const ti = i * 2;
          // Cursor radial push
          const dx = positions[ix] - cursorX;
          const dy = positions[iy] - cursorY;
          const dist2 = dx * dx + dy * dy;
          if (dist2 < cursorR2 && dist2 > 0.0001) {
            const dist = Math.sqrt(dist2);
            const force = (1 - dist / REPEL_RADIUS) * REPEL_STRENGTH;
            velocities[ix] += (dx / dist) * force;
            velocities[iy] += (dy / dist) * force;
          }
          // Spring force toward home position
          velocities[ix] += (targets[ti] - positions[ix]) * SPRING_K;
          velocities[iy] += (targets[ti + 1] - positions[iy]) * SPRING_K;
          // Damping (the dominant motion-killer)
          velocities[ix] *= DAMPING;
          velocities[iy] *= DAMPING;
          // Integrate
          positions[ix] += velocities[ix];
          positions[iy] += velocities[iy];
          // Soft canvas-edge clamp — just safety, particles rarely reach
          // these because spring pulls them back well before.
          if (positions[ix] < leftWall) {
            positions[ix] = leftWall;
            if (velocities[ix] < 0) velocities[ix] = 0;
          } else if (positions[ix] > rightWall) {
            positions[ix] = rightWall;
            if (velocities[ix] > 0) velocities[ix] = 0;
          }
          if (positions[iy] < bottomWall) {
            positions[iy] = bottomWall;
            if (velocities[iy] < 0) velocities[iy] = 0;
          } else if (positions[iy] > topWall) {
            positions[iy] = topWall;
            if (velocities[iy] > 0) velocities[iy] = 0;
          }
        }

        geometry.attributes.position.needsUpdate = true;
        (program.uniforms.cursor.value as number[])[0] = cursorX;
        (program.uniforms.cursor.value as number[])[1] = cursorY;
        renderer.render({ scene: mesh, camera });
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVis);
      themeObserver.disconnect();
      if (gl.canvas.parentNode === container) {
        container.removeChild(gl.canvas);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0"
      style={{ minHeight: "60vh" }}
    />
  );
}
