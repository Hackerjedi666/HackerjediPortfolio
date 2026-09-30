"use client";

import { useEffect, useRef, useState } from "react";

/**
 * What is on the kid's screen: falling binary, rendered on the GPU.
 *
 * This is the one part of the illustration that should never be a static
 * image, so it is the one part that gets a shader. Built with the
 * `webgpu-threejs-tsl` skill: a WebGPU renderer, one full-screen plane,
 * and a `MeshBasicNodeMaterial` whose entire appearance is a TSL graph.
 * No GLSL strings anywhere — the grid, the per-column speeds, the glyph
 * choice and the falling highlight are all node expressions.
 *
 * COST, AND WHY IT IS NOT PAID UP FRONT. `three/webgpu` is 638 KB
 * minified, which is more than the rest of this page put together, and
 * the page has been profiled as heavy once already. So:
 *
 *   - the import is dynamic, inside an effect, after an IntersectionObserver
 *     says the screen is actually on screen;
 *   - it is skipped entirely for reduced-motion and for any device
 *     reporting fewer than 4 cores, which is the cheap proxy for "this
 *     will not enjoy a GPU pipeline";
 *   - the render loop stops the moment it scrolls out of view or the tab
 *     goes to the background.
 *
 * Nothing above the fold waits on it, and a visitor who never sees the
 * hero never downloads it.
 *
 * THE FALLBACK IS THE DEFAULT. A CSS glyph field renders immediately and
 * server-side; the canvas fades in over it only once the GPU path is
 * genuinely running. If WebGPU is missing, the import fails, or the
 * device is thin, the screen still looks like a screen — it never blanks.
 */

const COLS = 42;
const ROWS = 11;

export function BinaryRain() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [gpu, setGpu] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if ((navigator.hardwareConcurrency ?? 8) < 4) return;

    let disposed = false;
    let stop: (() => void) | null = null;

    const boot = async () => {
      try {
        const [THREE, TSL] = await Promise.all([
          import("three/webgpu"),
          import("three/tsl"),
        ]);
        if (disposed) return;

        const { vec2, vec3, vec4, uv, time, texture, float, mix } = TSL;

        /* ---- glyph atlas: "0" and "1", drawn once into a canvas ----
           A shader can generate a grid for free but it cannot generate a
           typeface, so the two digits come from a 2D canvas and become a
           texture the node graph samples. Two cells side by side, so the
           glyph is chosen by shifting u by a half. */
        const atlasCanvas = document.createElement("canvas");
        atlasCanvas.width = 128;
        atlasCanvas.height = 64;
        const ctx = atlasCanvas.getContext("2d");
        if (!ctx) return;
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, 128, 64);
        ctx.fillStyle = "#ffffff";
        ctx.font = "700 46px ui-monospace, SFMono-Regular, monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("0", 32, 33);
        ctx.fillText("1", 96, 33);

        const atlas = new THREE.CanvasTexture(atlasCanvas);
        atlas.colorSpace = THREE.SRGBColorSpace;
        atlas.flipY = false;

        /* ---- the node graph ----
           Written INLINE rather than through `Fn()`. The skill's examples
           use `Fn(([a, b]) => ...)`, and the typings shipped with this
           version of three declare the callback as receiving a NodeBuilder,
           not a destructurable array — so every call came back as
           "Expected 0 arguments, but got 1". Nothing here is reused inside
           the graph, so the wrapper bought nothing anyway; the value-noise
           hash is simply spelled out at each of its three uses. */
        const st = uv().mul(vec2(COLS, ROWS));
        const col = st.x.floor();
        const row = st.y.floor();

        const NOISE = vec2(127.1, 311.7);

        // Each column falls at its own rate, or the whole field moves as
        // one slab and reads as a texture rather than as rain.
        const speed = vec2(col, float(1.0))
          .dot(NOISE).sin().mul(43758.5453).fract()
          .mul(0.5).add(0.18);

        // Cells flip between 0 and 1 on their own clock, so the screen
        // churns instead of scrolling a fixed pattern.
        const seed = vec2(col, row).dot(NOISE).sin().mul(43758.5453).fract();
        const tick = time.mul(seed.mul(3.0).add(1.2)).floor();
        const pick = vec2(col.add(tick), row.add(tick.mul(1.7)))
          .dot(NOISE).sin().mul(43758.5453).fract()
          .add(0.5).floor().clamp(0.0, 1.0);

        // Sample the atlas: u picks the digit, v is the cell's own space.
        const glyph = texture(
          atlas,
          vec2(st.x.fract().mul(0.5).add(pick.mul(0.5)), st.y.fract())
        ).r;

        // A bright head travelling down each column, with a trail above it.
        const phase = st.y.div(float(ROWS)).sub(time.mul(speed)).fract();
        const head = phase.pow(float(5.0));

        // Resting glyphs stay faintly lit, so the screen reads as full of
        // text rather than as a few streaks on black.
        const lit = glyph.mul(head.mul(1.5).add(0.055));

        // The head of each stream blows out toward white, which is what
        // makes it look like light rather than like green paint.
        // `mix` is a free function here, not a method on the node —
        // vec3 has no `.mix()` in these typings.
        const tint = mix(
          vec3(0.78, 0.949, 0.227),
          vec3(1.0, 1.0, 1.0),
          head.mul(0.85).clamp(0.0, 1.0)
        );

        const screenNode = vec4(tint.mul(lit), float(1.0));

        const renderer = new THREE.WebGPURenderer({ antialias: false });
        renderer.setClearColor(0x04060a, 1);
        await renderer.init();
        if (disposed) {
          renderer.dispose();
          return;
        }

        const scene = new THREE.Scene();
        const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        const material = new THREE.MeshBasicNodeMaterial();
        material.colorNode = screenNode;
        scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));

        const canvas = renderer.domElement;
        canvas.className = "binary-rain-canvas";
        host.appendChild(canvas);

        const size = () => {
          const r = host.getBoundingClientRect();
          if (!r.width || !r.height) return;
          // Capped at 1.5: this is a ~300px strip inside an illustration,
          // and a retina-resolution pipeline for it is pure waste.
          renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
          renderer.setSize(r.width, r.height, false);
        };
        size();
        const ro = new ResizeObserver(size);
        ro.observe(host);

        let running = false;
        const start = () => {
          if (running) return;
          running = true;
          renderer.setAnimationLoop(() => renderer.render(scene, camera));
        };
        const halt = () => {
          if (!running) return;
          running = false;
          renderer.setAnimationLoop(null);
        };

        const io = new IntersectionObserver(([e]) =>
          e?.isIntersecting && !document.hidden ? start() : halt()
        );
        io.observe(host);
        const onVis = () => (document.hidden ? halt() : undefined);
        document.addEventListener("visibilitychange", onVis);

        setGpu(true);

        stop = () => {
          halt();
          io.disconnect();
          ro.disconnect();
          document.removeEventListener("visibilitychange", onVis);
          canvas.remove();
          atlas.dispose();
          material.dispose();
          renderer.dispose();
        };
      } catch {
        // No WebGPU, no WebGL2 fallback, or the chunk failed. The CSS
        // field underneath is already on screen, so there is nothing to
        // do and nothing to report to the visitor.
      }
    };

    // Only fetch the chunk once the screen is genuinely in view.
    const gate = new IntersectionObserver(([e]) => {
      if (!e?.isIntersecting) return;
      gate.disconnect();
      void boot();
    });
    gate.observe(host);

    return () => {
      disposed = true;
      gate.disconnect();
      stop?.();
    };
  }, []);

  return (
    <div ref={hostRef} className="binary-rain" data-gpu={gpu ? "true" : "false"}>
      {/* The fallback, and the first frame everyone sees. Server-rendered,
          so the screen is never blank — not on first paint, not on a
          device without WebGPU, not if the chunk 404s. */}
      <div aria-hidden="true" className="binary-rain-css">
        {Array.from({ length: 5 }, (_, r) => (
          <span key={r} style={{ animationDelay: `${r * -1.7}s` }}>
            {Array.from({ length: 34 }, (_, c) => ((r * 31 + c * 17) % 3 ? "1" : "0")).join("")}
          </span>
        ))}
      </div>
    </div>
  );
}
