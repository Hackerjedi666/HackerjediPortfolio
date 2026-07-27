"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { subscribe } from "@/lib/stage/ticker";

/**
 * Velocity-reactive light pass for a card surface.
 *
 * The source pack ("webgl mouseover effects") rendered a page of images into
 * a three.js scene and ran a post-processing pass that warped the rendered
 * texture around the cursor, with the distortion scaled by pointer velocity.
 *
 * Two things made a literal port wrong here. These cards hold body copy and
 * CTAs — pushing them through WebGL costs their crispness, their text
 * selection and their accessibility tree, to distort text nobody wants
 * distorted. And the pack's headline effect is an RGB channel split, which
 * on a strictly two-colour site introduces red and blue fringing that
 * belongs to no part of this palette.
 *
 * So the *mechanic* is ported, not the pipeline: the pack's `circle()` disc
 * and `hash12()` grain, driven by the same smoothed pointer velocity, render
 * a procedural acid lens on a transparent overlay. The card stays DOM.
 */

const VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

const FRAGMENT = /* glsl */ `
  precision highp float;

  uniform vec2  uMouse;
  uniform vec2  uResolution;
  uniform float uVelo;
  uniform float uTime;
  uniform float uHover;
  uniform vec3  uAcid;

  varying vec2 vUv;

  // Verbatim from the pack: an aspect-corrected soft disc.
  float circle(vec2 uv, vec2 disc_center, float disc_radius, float border_size) {
    uv -= disc_center;
    uv *= uResolution;
    float dist = sqrt(dot(uv, uv));
    return smoothstep(disc_radius + border_size, disc_radius - border_size, dist);
  }

  // Verbatim from the pack.
  float hash12(vec2 p) {
    float h = dot(p, vec2(127.1, 311.7));
    return fract(sin(h) * 43758.5453123);
  }

  void main() {
    // Core lens. Both radius and brightness scale with pointer speed, so a
    // slow drift barely lifts the surface and a fast sweep flares it.
    float lens = circle(vUv, uMouse, 0.02, 0.30 + uVelo * 3.0);

    // Thin leading rim — the edge of the lens catching light. This is what
    // reads as glass rather than as a soft gradient.
    float rim = clamp(
      circle(vUv, uMouse, 0.13 + uVelo * 1.2, 0.012) -
      circle(vUv, uMouse, 0.11 + uVelo * 1.2, 0.012),
      0.0, 1.0
    );

    // Quantised grain. Without it the falloff is a flat blob indistinguishable
    // from a CSS radial-gradient — the dither is what makes it read as render.
    float g = hash12(floor(vUv * 260.0) + floor(uTime * 24.0));

    float body = lens * (0.16 + uVelo * 5.0) * (0.82 + g * 0.36);
    float alpha = clamp(body + rim * 0.55, 0.0, 1.0) * uHover;

    gl_FragColor = vec4(uAcid, alpha);
  }
`;

/** The pack clamps velocity here; past it the distortion stops reading. */
const MAX_VELO = 0.05;

export default function CardShaderCanvas({
  hostRef,
}: {
  hostRef: React.RefObject<HTMLElement | null>;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: false,
      // The shader emits straight alpha, not premultiplied.
      premultipliedAlpha: false,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3)
    );
    geometry.setAttribute(
      "uv",
      new THREE.BufferAttribute(new Float32Array([0, 0, 2, 0, 0, 2]), 2)
    );

    const acid = new THREE.Color(
      getComputedStyle(host).getPropertyValue("--color-acid").trim() || "#c2ff45"
    );

    const material = new THREE.ShaderMaterial({
      vertexShader: VERTEX,
      fragmentShader: FRAGMENT,
      transparent: true,
      depthWrite: false,
      uniforms: {
        uMouse: { value: new THREE.Vector2(0.5, 0.5) },
        uResolution: { value: new THREE.Vector2(1, 1) },
        uVelo: { value: 0 },
        uTime: { value: 0 },
        uHover: { value: 0 },
        uAcid: { value: new THREE.Vector3(acid.r, acid.g, acid.b) },
      },
    });

    const scene = new THREE.Scene();
    scene.add(new THREE.Mesh(geometry, material));

    const resize = () => {
      const r = host.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) return;
      renderer.setSize(r.width, r.height, false);
      material.uniforms.uResolution.value.set(r.width / r.height, 1);
    };
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);

    // Pointer state, following the pack: raw position, a lerped follower, and
    // a smoothed speed derived from frame-to-frame delta.
    const mouse = new THREE.Vector2(0.5, 0.5);
    const follow = new THREE.Vector2(0.5, 0.5);
    const prev = new THREE.Vector2(0.5, 0.5);
    let targetSpeed = 0;
    let inside = false;

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const r = host.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      inside = x >= 0 && x <= 1 && y >= 0 && y <= 1;
      if (!inside) return;
      mouse.set(x, 1 - y); // flip: UV origin is bottom-left
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    const unsubscribe = subscribe((dt, elapsed) => {
      const speed = Math.hypot(prev.x - mouse.x, prev.y - mouse.y);
      targetSpeed += (speed - targetSpeed) * 0.1;
      follow.x += (mouse.x - follow.x) * 0.1;
      follow.y += (mouse.y - follow.y) * 0.1;
      prev.copy(mouse);

      const u = material.uniforms;
      u.uMouse.value.copy(follow);
      u.uVelo.value = Math.min(targetSpeed, MAX_VELO);
      u.uTime.value = elapsed;
      // Ease the whole layer in and out so leaving the card doesn't snap the
      // light off mid-flare.
      u.uHover.value += ((inside ? 1 : 0) - u.uHover.value) * Math.min(dt * 8, 1);

      renderer.render(scene, camera);
    });

    return () => {
      unsubscribe();
      window.removeEventListener("pointermove", onMove);
      resizeObserver.disconnect();
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, [hostRef]);

  return <canvas ref={canvasRef} className="h-full w-full" />;
}
