"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { getReducedMotion } from "@/lib/motion";

/**
 * A small wireframe geometric "satellite" that lives in a section's margin.
 * Extends the hero icosahedron motif across the page — each section gets
 * its own shape rotating slowly, reacting to cursor proximity. Reads as
 * "this whole site lives in one continuous 3D space".
 *
 * Performance:
 *   - Single LineSegments + single Points per instance, 1 draw call each
 *   - 30fps render gate
 *   - IntersectionObserver pauses rendering when off-screen
 *   - DPR capped at 1.5
 *   - Theme-reactive (root-mode toggle re-tints via MutationObserver)
 */

type ShapeType = "cube" | "torus" | "octahedron" | "dodecahedron" | "icosahedron";

type Props = {
  shape: ShapeType;
  size?: number;
  className?: string;
};

const SHAPE_BUILDERS: Record<ShapeType, () => THREE.BufferGeometry> = {
  cube: () => new THREE.BoxGeometry(2.2, 2.2, 2.2),
  torus: () => new THREE.TorusGeometry(1.4, 0.4, 16, 60),
  octahedron: () => new THREE.OctahedronGeometry(1.6, 0),
  dodecahedron: () => new THREE.DodecahedronGeometry(1.5, 0),
  icosahedron: () => new THREE.IcosahedronGeometry(1.5, 0),
};

const readThemeColor = (varName: string) => {
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
  return new THREE.Color(`#${full}`);
};

export function MarginObject({ shape, size = 200, className = "" }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (getReducedMotion()) return;
    const container = containerRef.current;
    if (!container) return;

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
    camera.position.z = 5;

    const geo = SHAPE_BUILDERS[shape]();
    const wireGeo = new THREE.EdgesGeometry(geo);
    const lineMat = new THREE.LineBasicMaterial({
      color: readThemeColor("--color-ink-soft"),
      transparent: true,
      opacity: 0.65,
    });
    const lines = new THREE.LineSegments(wireGeo, lineMat);
    scene.add(lines);

    // Vertex points as accent dots.
    const positions = geo.attributes.position.array as Float32Array;
    const seen = new Set<string>();
    const pts: number[] = [];
    for (let i = 0; i < positions.length; i += 3) {
      const k = `${positions[i].toFixed(3)},${positions[i + 1].toFixed(3)},${positions[i + 2].toFixed(3)}`;
      if (seen.has(k)) continue;
      seen.add(k);
      pts.push(positions[i], positions[i + 1], positions[i + 2]);
    }
    const pointsGeo = new THREE.BufferGeometry();
    pointsGeo.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(pts), 3)
    );
    const pointsMat = new THREE.PointsMaterial({
      color: readThemeColor("--color-accent"),
      size: 0.085,
      transparent: true,
      opacity: 0.95,
    });
    const points = new THREE.Points(pointsGeo, pointsMat);
    scene.add(points);

    // Cursor influence — tilt toward cursor when within 420px.
    let mx = 0;
    let my = 0;
    let cx = 0;
    let cy = 0;
    const onMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const dx = e.clientX - (rect.left + rect.width / 2);
      const dy = e.clientY - (rect.top + rect.height / 2);
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < 420) {
        mx = dx / 420;
        my = dy / 420;
      } else {
        mx = 0;
        my = 0;
      }
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    // Theme observer
    const themeObserver = new MutationObserver(() => {
      lineMat.color.set(readThemeColor("--color-ink-soft"));
      pointsMat.color.set(readThemeColor("--color-accent"));
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    // IntersectionObserver — pause when off-screen.
    let visible = false;
    const intersection = new IntersectionObserver(
      (entries) => {
        visible = entries[0]?.isIntersecting ?? false;
      },
      { rootMargin: "100px" }
    );
    intersection.observe(container);

    let raf = 0;
    let lastRender = 0;
    const start = performance.now();
    const TARGET_MS = 1000 / 30;

    const tick = (ts: number) => {
      if (visible) {
        const t = (ts - start) / 1000;
        cx += (mx - cx) * 0.07;
        cy += (my - cy) * 0.07;
        lines.rotation.y = t * 0.22 + cx * 0.55;
        lines.rotation.x = -cy * 0.55 + Math.sin(t * 0.18) * 0.18;
        points.rotation.copy(lines.rotation);
        if (ts - lastRender >= TARGET_MS) {
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
      themeObserver.disconnect();
      intersection.disconnect();
      lineMat.dispose();
      pointsMat.dispose();
      geo.dispose();
      wireGeo.dispose();
      pointsGeo.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [shape, size]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={`pointer-events-none hidden md:block ${className}`.trim()}
      style={{ width: size, height: size }}
    />
  );
}
