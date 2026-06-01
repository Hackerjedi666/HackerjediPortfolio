"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { getReducedMotion } from "@/lib/motion";

/**
 * Wireframe icosahedron — sits in the hero's empty right band, rotates slowly,
 * tilts toward the cursor. Reads as a "cryptographic seal" / "secure enclave"
 * — Apple uses similar imagery for the Secure Element. On-brand for an
 * offensive security portfolio without being literal.
 *
 * Material: thin lines, theme-aware (--color-ink). The vertices have small
 * accent-colored points so the corners read as "key nodes" of the structure.
 *
 * Performance:
 *   - DPR capped at 1.5 (was 2 — same logic as the OGL ambient canvas)
 *   - Static geometry (no per-frame buffer rewrites)
 *   - Single LineSegments draw call + a Points draw call
 *   - Render gated to ~30 fps to leave headroom for the rest of the page
 *
 * Reduced-motion / touch / WebGL-fail → returns null, container empty.
 */
export function CryptoObject() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (getReducedMotion()) return;
    const container = containerRef.current;
    if (!container) return;

    const size = 360;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: "low-power",
      });
    } catch {
      return;
    }
    renderer.setPixelRatio(Math.min(1.5, window.devicePixelRatio || 1));
    renderer.setSize(size, size);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.z = 3.2;

    // Wireframe icosahedron — 12 vertices, 20 triangular faces
    const geo = new THREE.IcosahedronGeometry(1, 0);
    const edges = new THREE.EdgesGeometry(geo);

    const readColors = () => {
      const cs = getComputedStyle(document.documentElement);
      return {
        ink: cs.getPropertyValue("--color-ink").trim() || "#131211",
        accent: cs.getPropertyValue("--color-accent").trim() || "#7b2a1f",
      };
    };
    const { ink, accent } = readColors();

    const lineMat = new THREE.LineBasicMaterial({
      color: new THREE.Color(ink),
      transparent: true,
      opacity: 0.75,
    });
    const lines = new THREE.LineSegments(edges, lineMat);
    scene.add(lines);

    // Vertex "key nodes" — small accent-colored points at each of the 12 vertices.
    const pointsGeo = new THREE.BufferGeometry();
    pointsGeo.setAttribute("position", geo.attributes.position);
    const pointsMat = new THREE.PointsMaterial({
      color: new THREE.Color(accent),
      size: 5,
      sizeAttenuation: false,
      transparent: true,
      opacity: 0.9,
    });
    const points = new THREE.Points(pointsGeo, pointsMat);
    scene.add(points);

    // Root-mode observer — re-read CSS vars on root-mode flip, snap to new colors.
    const themeObserver = new MutationObserver(() => {
      const next = readColors();
      lineMat.color.set(next.ink);
      pointsMat.color.set(next.accent);
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    // Cursor influence — tilt the icosahedron toward the pointer.
    let mx = 0;
    let my = 0;
    let smx = 0;
    let smy = 0;
    const onMove = (e: PointerEvent) => {
      mx = (e.clientX / window.innerWidth) * 2 - 1;
      my = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    // Visibility throttle (pause when tab hidden)
    let visible = true;
    const onVis = () => {
      visible = !document.hidden;
    };
    document.addEventListener("visibilitychange", onVis);

    let raf = 0;
    const start = performance.now();
    let lastRender = 0;
    const TARGET_FRAME_MS = 1000 / 30;

    const tick = (ts: number) => {
      if (visible) {
        // Smooth mouse follow every frame
        smx += (mx - smx) * 0.08;
        smy += (my - smy) * 0.08;

        if (ts - lastRender >= TARGET_FRAME_MS) {
          const t = (ts - start) / 1000;
          // Base autonomous rotation on 3 axes at different rates → never
          // repeats the same angle pair (looks organic, not metronomic).
          lines.rotation.x = t * 0.18 + smy * 0.4;
          lines.rotation.y = t * 0.24 + smx * 0.4;
          lines.rotation.z = t * 0.06;
          points.rotation.copy(lines.rotation);
          renderer.render(scene, camera);
          lastRender = ts;
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("visibilitychange", onVis);
      themeObserver.disconnect();
      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      geo.dispose();
      edges.dispose();
      pointsGeo.dispose();
      lineMat.dispose();
      pointsMat.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="pointer-events-none"
      style={{ width: 360, height: 360 }}
    />
  );
}
