"use client";

import { useEffect, useRef } from "react";
import type { Material, Object3D, Texture } from "three";

/** Opaque sculpted geometry, independently articulated at the neck and eyes. */
export function Hoodie3D() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let disposed = false;
    let booting = false;
    let visible = false;
    let cleanup: (() => void) | undefined;
    let wake: (() => void) | undefined;
    let halt: (() => void) | undefined;

    const boot = async () => {
      if (booting || cleanup || reduced.matches || disposed || !visible) return;
      booting = true;
      const release: (() => void)[] = [];
      const free = () => { release.splice(0).reverse().forEach((fn) => fn()); };
      try {
        const [THREE, { GLTFLoader }] = await Promise.all([
          import("three/webgpu"),
          import("three/examples/jsm/loaders/GLTFLoader.js"),
        ]);
        if (disposed || reduced.matches) return;
        const gltf = await new GLTFLoader().loadAsync("/brand/hoodie-character.glb");
        const model = gltf.scene;
        release.push(() => {
          const materials = new Set<Material>();
          const textures = new Set<Texture>();
          model.traverse((node) => {
            if (!(node instanceof THREE.Mesh)) return;
            node.geometry.dispose();
            for (const material of Array.isArray(node.material) ? node.material : [node.material]) materials.add(material);
          });
          materials.forEach((material) => {
            for (const value of Object.values(material)) if (value instanceof THREE.Texture) textures.add(value);
            material.dispose();
          });
          textures.forEach((texture) => { texture.dispose(); if (texture.image instanceof ImageBitmap) texture.image.close(); });
        });
        if (disposed || reduced.matches) { free(); return; }
        const required = (name: string): Object3D => {
          const node = model.getObjectByName(name);
          if (!node) throw new Error(`Character rig is missing ${name}`);
          return node;
        };
        const head = required("HeadRig");
        const body = required("BodyRig");
        const eyes = [required("EyeLeft"), required("EyeRight")];
        const eyeRest = eyes.map((eye) => eye.position.clone());
        const headRest = head.rotation.clone();
        const bodyRest = body.rotation.clone();
        const scene = new THREE.Scene();
        scene.add(model);
        scene.add(new THREE.HemisphereLight(0xe5eaff, 0x77716a, 2.0));
        const key = new THREE.DirectionalLight(0xffead5, 3.0);
        key.position.set(-3, 5, 5);
        const fill = new THREE.DirectionalLight(0xdce8ff, 1.0);
        fill.position.set(3, 2, 3);
        scene.add(key, fill);

        // Model-authored framing, rather than reframing from each head pose.
        const height = 2.91;
        const centreY = 1.37;
        const camera = new THREE.OrthographicCamera(-1, 1, height / 2, -height / 2, .1, 20);
        camera.position.set(0, centreY, 7);
        camera.lookAt(0, centreY, 0);
        const renderer = new THREE.WebGPURenderer({ alpha: true, antialias: true });
        release.push(() => renderer.dispose());
        await renderer.init();
        if (disposed || reduced.matches) { free(); return; }
        renderer.setClearColor(0x000000, 0);
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.NoToneMapping;
        const canvas = renderer.domElement;
        canvas.className = "hoodie-3d-canvas";
        host.appendChild(canvas);
        release.push(() => canvas.remove());

        let rect = host.getBoundingClientRect();
        let dirty = true;
        let pointer: { x: number; y: number } | null = null;
        let tx = 0, ty = 0;
        let hx = 0, hy = 0, ex = 0, ey = 0, bx = 0;
        let frame = 0, previous = 0;
        let initialized = false;
        const frameTimes: number[] = [];
        const resize = () => {
          rect = host.getBoundingClientRect();
          if (!rect.width || !rect.height) return;
          renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
          renderer.setSize(rect.width, rect.height, false);
          const aspect = rect.width / rect.height;
          camera.left = -height * aspect / 2;
          camera.right = height * aspect / 2;
          camera.updateProjectionMatrix();
          dirty = false;
        };
        const applyPose = () => {
          // Eyes arrive first. Head follows through the neck; shoulders only
          // contribute a small amount. No image changes or pose thresholds.
          head.rotation.set(headRest.x + hy * .16, headRest.y + hx * .42, headRest.z - hx * .025);
          body.rotation.y = bodyRest.y + bx * .035;
          eyes.forEach((eye, index) => {
            eye.position.copy(eyeRest[index]);
            eye.position.x += ex * .025;
            eye.position.y -= ey * .006;
          });
        };
        const tick = (now: number) => {
          frame = 0;
          if (!initialized || !visible || document.hidden || reduced.matches || disposed) return;
          if (dirty) resize();
          if (pointer) {
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height * .36;
            const dx = pointer.x - cx, dy = pointer.y - cy;
            tx = Math.max(-1, Math.min(1, dx / Math.max(1, dx < 0 ? cx : innerWidth - cx)));
            ty = Math.max(-1, Math.min(1, dy / Math.max(1, dy < 0 ? cy : innerHeight - cy)));
          }
          const dt = previous ? Math.min(64, now - previous) : 1000 / 60;
          if (process.env.NODE_ENV === "development" && previous) {
            frameTimes.push(now - previous);
            if (frameTimes.length > 180) frameTimes.shift();
          }
          previous = now;
          const headEase = 1 - Math.exp(-dt / 22);
          const eyeEase = 1 - Math.exp(-dt / 8);
          hx += (tx - hx) * headEase;
          hy += (ty - hy) * headEase;
          ex += (tx - ex) * eyeEase;
          ey += (ty - ey) * eyeEase;
          bx += (tx - bx) * (1 - Math.exp(-dt / 90));
          const settled = Math.abs(tx - hx) + Math.abs(ty - hy) + Math.abs(tx - ex) + Math.abs(ty - ey) + Math.abs(tx - bx) < .0002;
          if (settled) { hx = ex = bx = tx; hy = ey = ty; }
          applyPose();
          renderer.render(scene, camera);
          if (!settled) frame = requestAnimationFrame(tick);
          else {
            previous = 0;
            if (process.env.NODE_ENV === "development" && frameTimes.length) {
              const sorted = [...frameTimes].sort((a, b) => a - b);
              host.dataset.frameTiming = JSON.stringify({ samples: sorted.length, medianMs: sorted[Math.floor(sorted.length / 2)], p95Ms: sorted[Math.floor(sorted.length * .95)] });
            }
          }
        };
        wake = () => {
          if (!frame && visible && !document.hidden && !reduced.matches && !disposed) frame = requestAnimationFrame(tick);
        };
        halt = () => { cancelAnimationFrame(frame); frame = 0; previous = 0; };
        release.push(() => { halt?.(); wake = undefined; halt = undefined; });
        const move = (event: PointerEvent) => {
          if (event.pointerType === "touch") return;
          pointer = { x: event.clientX, y: event.clientY };
          wake?.();
        };
        const reset = () => { pointer = null; tx = ty = 0; wake?.(); };
        const measure = () => { dirty = true; wake?.(); };
        const observer = new ResizeObserver(measure);
        observer.observe(host);
        window.addEventListener("pointermove", move, { passive: true });
        window.addEventListener("scroll", measure, { passive: true });
        window.addEventListener("resize", measure, { passive: true });
        window.addEventListener("blur", reset);
        document.documentElement.addEventListener("pointerleave", reset);
        release.push(() => {
          observer.disconnect();
          window.removeEventListener("pointermove", move);
          window.removeEventListener("scroll", measure);
          window.removeEventListener("resize", measure);
          window.removeEventListener("blur", reset);
          document.documentElement.removeEventListener("pointerleave", reset);
        });
        resize();
        applyPose();
        // The poster remains until the GPU has actually completed a draw.
        await renderer.compileAsync(scene, camera);
        if (disposed || reduced.matches) { free(); return; }
        renderer.render(scene, camera);
        initialized = true;
        host.dataset.ready = "true";
        cleanup = () => { host.dataset.ready = "false"; free(); };
        wake();
      } catch (error) {
        free();
        host.dataset.ready = "false";
        if (process.env.NODE_ENV === "development") console.warn("Character 3D renderer unavailable", error);
      } finally {
        booting = false;
      }
    };

    const onVisibility = () => {
      if (document.hidden) halt?.();
      else { void boot(); wake?.(); }
    };
    const onMotion = () => {
      if (reduced.matches) { cleanup?.(); cleanup = undefined; }
      else void boot();
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = !!entry?.isIntersecting;
      if (visible) { void boot(); wake?.(); }
      else halt?.();
    });
    observer.observe(host);
    document.addEventListener("visibilitychange", onVisibility);
    reduced.addEventListener("change", onMotion);
    return () => {
      disposed = true;
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      reduced.removeEventListener("change", onMotion);
      cleanup?.();
    };
  }, []);

  return <div ref={hostRef} className="hoodie-3d" aria-hidden="true" data-ready="false" />;
}
