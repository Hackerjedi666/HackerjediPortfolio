"use client";

import { useEffect, useRef } from "react";
import { Renderer, Program, Mesh, Triangle } from "ogl";
import { getReducedMotion } from "@/lib/motion";

/**
 * Phase 3 — WebGL canvas behind the whole page (Lusion-style ambient ground).
 *
 * What it renders: a full-viewport fragment shader that generates a slow,
 * multi-octave noise field mixing --color-paper and --color-paper-deep.
 * The cursor pulls the field toward it and tints it with --color-accent —
 * the trademark "cursor magnetism on the background itself" Lusion move.
 *
 * Root-mode-aware: a MutationObserver on html.class re-reads the CSS
 * variables; shader uniforms lerp toward the new colors so the root-mode
 * flip (editorial ↔ matrix green/black) drifts under the change.
 *
 * Fallback: if `prefers-reduced-motion` is set or WebGL context creation
 * fails, the component returns null / cleans up. Body retains its
 * --color-paper background via globals.css, so the page stays readable.
 *
 * Performance: a single Triangle (covers viewport, 3 vertices, 1 draw call)
 * is cheaper than a Plane. DPR capped at 2 so retina renders aren't 4×.
 */

const vertex = /* glsl */ `
attribute vec2 uv;
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragment = /* glsl */ `
precision highp float;
uniform vec2  uResolution;
uniform vec2  uMouse;       // pixels, origin at bottom-left
uniform float uTime;
uniform vec3  uColor1;      // paper
uniform vec3  uColor2;      // paper-deep
uniform vec3  uColor3;      // accent
varying vec2  vUv;

// Hashed gradient noise (IQ-style)
vec2 hash(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)),
           dot(p, vec2(269.5, 183.3)));
  return -1.0 + 2.0 * fract(sin(p) * 43758.5453);
}
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(dot(hash(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0)),
        dot(hash(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
    mix(dot(hash(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)),
        dot(hash(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x),
    u.y
  );
}
// Fractal Brownian Motion — 3 octaves (was 4) of noise stacked.
// 3 octaves vs 4 is visually near-identical for slow ambient noise, but cuts
// ~25% of per-pixel shader work — meaningful at 1080p × 60fps.
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 3; i++) {
    v += a * noise(p);
    p *= 2.05;
    a *= 0.55;
  }
  return v;
}

void main() {
  vec2 uv = vUv;
  // Aspect-correct distance for mouse falloff (so the influence area is a
  // visual circle, not an ellipse).
  vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);
  vec2 mouseUv = uMouse / uResolution;
  float d = distance(uv * aspect, mouseUv * aspect);
  float mouseInfluence = exp(-d * 3.8);

  // Slowly evolving distortion field
  vec2 distort = vec2(
    fbm(uv * 1.8 + uTime * 0.03),
    fbm(uv * 1.8 + uTime * 0.03 + 99.0)
  ) * 0.12;
  // Mouse pulls the field toward itself
  vec2 toMouse = normalize(mouseUv - uv + 1e-6);
  distort += toMouse * mouseInfluence * 0.06;

  // Base gradient via noise → paper ↔ paper-deep
  float t = fbm((uv + distort) * 1.4 + uTime * 0.015);
  t = smoothstep(-0.55, 0.55, t);

  vec3 col = mix(uColor1, uColor2, t * 0.75);

  // Subtle accent halo near cursor (oxblood light / steel-cyan dark)
  col = mix(col, uColor3, mouseInfluence * 0.14);

  gl_FragColor = vec4(col, 1.0);
}
`;

function hexToRgb(hex: string): [number, number, number] {
  hex = hex.replace("#", "").trim();
  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((c) => c + c)
      .join("");
  }
  return [
    parseInt(hex.substring(0, 2), 16) / 255,
    parseInt(hex.substring(2, 4), 16) / 255,
    parseInt(hex.substring(4, 6), 16) / 255,
  ];
}

function readColors(): {
  c1: [number, number, number];
  c2: [number, number, number];
  c3: [number, number, number];
} {
  const cs = getComputedStyle(document.documentElement);
  return {
    c1: hexToRgb(cs.getPropertyValue("--color-paper").trim() || "#f4f2ee"),
    c2: hexToRgb(cs.getPropertyValue("--color-paper-deep").trim() || "#ece8e0"),
    c3: hexToRgb(cs.getPropertyValue("--color-accent").trim() || "#7b2a1f"),
  };
}

export function HeroCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (getReducedMotion()) return;
    const container = containerRef.current;
    if (!container) return;

    let renderer: Renderer;
    try {
      renderer = new Renderer({
        alpha: true,
        antialias: false,
        // DPR capped at 1 — the shader output is intentionally low-frequency
        // (smooth FBM noise), it doesn't benefit from retina pixel density,
        // and dropping from 2× to 1× cuts shader work by ~4× on retina
        // displays. The biggest single perf win available to this canvas.
        dpr: 1,
        // Hint the browser to schedule the GPU work at lower priority — the
        // canvas is ambient, not interactive-critical.
        powerPreference: "low-power",
      });
    } catch {
      // WebGL not supported / blocked. Body retains --color-paper bg from globals.
      return;
    }

    const gl = renderer.gl;
    container.appendChild(gl.canvas);

    const geometry = new Triangle(gl);
    const { c1, c2, c3 } = readColors();

    const program = new Program(gl, {
      vertex,
      fragment,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: [window.innerWidth, window.innerHeight] },
        uMouse: { value: [window.innerWidth / 2, window.innerHeight / 2] },
        uColor1: { value: [...c1] },
        uColor2: { value: [...c2] },
        uColor3: { value: [...c3] },
      },
    });
    const mesh = new Mesh(gl, { geometry, program });

    const resize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      (program.uniforms.uResolution.value as number[]) = [
        window.innerWidth,
        window.innerHeight,
      ];
    };
    resize();
    window.addEventListener("resize", resize);

    // Smoothed mouse position. Y flipped for shader coords (GL origin = bot-left).
    let mx = window.innerWidth / 2;
    let my = window.innerHeight / 2;
    let smx = mx;
    let smy = my;
    const onMove = (e: PointerEvent) => {
      mx = e.clientX;
      my = window.innerHeight - e.clientY;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    // Theme target colors — lerped toward over a few frames for continuous flip.
    const target = { c1: [...c1], c2: [...c2], c3: [...c3] };
    const observer = new MutationObserver(() => {
      const next = readColors();
      target.c1 = [...next.c1];
      target.c2 = [...next.c2];
      target.c3 = [...next.c3];
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    let raf = 0;
    const start = performance.now();
    let prevTs = start;
    let lastRender = 0;
    let visible = true;
    let scrolledPastHero = false;
    const onVis = () => {
      visible = !document.hidden;
    };
    // Additional gate: pause rendering once the reader has scrolled past the
    // first two pages of the book (≥ 2 viewports of scroll). At that point
    // the canvas has rotated out of view and rendering it is pure waste.
    const onScroll = () => {
      scrolledPastHero = window.scrollY > window.innerHeight * 2;
    };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("scroll", onScroll, { passive: true });

    // Target ~30fps for the canvas. The shader is slow ambient noise — 60fps
    // is imperceptible against 30fps for this kind of motion, and halving the
    // render rate halves GPU work and removes the contention that was making
    // the cursor RAF stutter. Mouse smoothing still runs every browser frame
    // (it just updates uniforms; render is gated).
    const TARGET_FRAME_MS = 1000 / 30;

    const tick = (ts: number) => {
      if (visible && !scrolledPastHero) {
        const dt = Math.min(0.05, (ts - prevTs) / 1000);
        prevTs = ts;
        // Mouse + time + color lerps update every frame so they stay smooth.
        smx += (mx - smx) * 0.08;
        smy += (my - smy) * 0.08;
        const lerp = 1 - Math.exp(-dt * 5);
        const u1 = program.uniforms.uColor1.value as number[];
        const u2 = program.uniforms.uColor2.value as number[];
        const u3 = program.uniforms.uColor3.value as number[];
        for (let i = 0; i < 3; i++) {
          u1[i] += (target.c1[i] - u1[i]) * lerp;
          u2[i] += (target.c2[i] - u2[i]) * lerp;
          u3[i] += (target.c3[i] - u3[i]) * lerp;
        }
        // Render gated to ~30fps.
        if (ts - lastRender >= TARGET_FRAME_MS) {
          (program.uniforms.uMouse.value as number[])[0] = smx;
          (program.uniforms.uMouse.value as number[])[1] = smy;
          program.uniforms.uTime.value = (ts - start) / 1000;
          renderer.render({ scene: mesh });
          lastRender = ts;
        }
      } else {
        prevTs = ts;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("scroll", onScroll);
      observer.disconnect();
      if (gl.canvas.parentElement === container) {
        container.removeChild(gl.canvas);
      }
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0"
    />
  );
}
