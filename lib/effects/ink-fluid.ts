import * as THREE from "three";

/**
 * Navier–Stokes ink — a hard-edged fluid confined to one element.
 *
 * Ported from the "cappen fluid simulation" pack. The solver maths (splat →
 * curl → vorticity → divergence → Jacobi pressure → gradient subtract →
 * advect) is unchanged; everything around it was rewritten, because the
 * original was built to be the only thing on a page:
 *
 *   1. It sized itself to `innerWidth/innerHeight` and never resized its
 *      render targets. Now everything derives from a host element, and a
 *      ResizeObserver rebuilds the targets so the fluid never stretches.
 *   2. It started a `requestAnimationFrame` in its constructor that could
 *      not be cancelled, and attached three anonymous window listeners it
 *      could not remove. Now there is `step(dt)` and a real `dispose()` —
 *      mandatory, since this mounts and unmounts on scroll.
 *   3. Its `touchmove` handler called `preventDefault()` on a non-passive
 *      window listener, which kills page scrolling on touch devices. Gone.
 *   4. `pressureIterations` dropped 40 → 20. The Jacobi loop is ~80% of the
 *      frame cost and the difference is not visible at this size.
 *
 * Rendering is unchanged in spirit: alpha comes from dye density and
 * `threshold`/`edgeSoftness` decide how hard the edge is. With
 * edgeSoftness 0 you get a binary alpha — a crisp liquid-metal silhouette,
 * not smoke. That hard edge is why it suits this site.
 */

const V = `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position,1.); }`;
const P = `precision highp float;`;
const S = `precision mediump sampler2D;`;

const SHADERS = {
  splat: [
    V,
    `${P} ${S}
    uniform sampler2D uTarget; uniform float aspectRatio,radius; uniform vec3 color; uniform vec2 point; varying vec2 vUv;
    void main(){ vec2 p=vUv-point; p.x*=aspectRatio; gl_FragColor=vec4(texture2D(uTarget,vUv).xyz+exp(-dot(p,p)/radius)*color,1.); }`,
  ],
  advection: [
    V,
    `${P} ${S}
    uniform sampler2D uVelocity,uSource; uniform vec2 texelSize; uniform float dt,dissipation; varying vec2 vUv;
    void main(){ gl_FragColor=vec4(dissipation*texture2D(uSource,vUv-dt*texture2D(uVelocity,vUv).xy*texelSize).rgb,1.); }`,
  ],
  divergence: [
    V,
    `${P} ${S}
    uniform sampler2D uVelocity; uniform vec2 texelSize; varying vec2 vUv;
    vec2 vel(vec2 uv){ vec2 e=vec2(1.); if(uv.x<0.){uv.x=0.;e.x=-1.;} if(uv.x>1.){uv.x=1.;e.x=-1.;} if(uv.y<0.){uv.y=0.;e.y=-1.;} if(uv.y>1.){uv.y=1.;e.y=-1.;} return e*texture2D(uVelocity,uv).xy; }
    void main(){ vec2 L=vUv-vec2(texelSize.x,0.),R=vUv+vec2(texelSize.x,0.),T=vUv+vec2(0.,texelSize.y),B=vUv-vec2(0.,texelSize.y); gl_FragColor=vec4(.5*(vel(R).x-vel(L).x+vel(T).y-vel(B).y),0.,0.,1.); }`,
  ],
  curl: [
    V,
    `${P} ${S}
    uniform sampler2D uVelocity; uniform vec2 texelSize; varying vec2 vUv;
    void main(){ vec2 L=vUv-vec2(texelSize.x,0.),R=vUv+vec2(texelSize.x,0.),T=vUv+vec2(0.,texelSize.y),B=vUv-vec2(0.,texelSize.y); gl_FragColor=vec4(texture2D(uVelocity,R).y-texture2D(uVelocity,L).y-texture2D(uVelocity,T).x+texture2D(uVelocity,B).x,0.,0.,1.); }`,
  ],
  vorticity: [
    V,
    `${P} ${S}
    uniform sampler2D uVelocity,uCurl; uniform vec2 texelSize; uniform float curlStrength,dt; varying vec2 vUv;
    void main(){ vec2 L=vUv-vec2(texelSize.x,0.),R=vUv+vec2(texelSize.x,0.),T=vUv+vec2(0.,texelSize.y),B=vUv-vec2(0.,texelSize.y); vec2 f=normalize(vec2(abs(texture2D(uCurl,T).x)-abs(texture2D(uCurl,B).x),abs(texture2D(uCurl,R).x)-abs(texture2D(uCurl,L).x))+.0001)*curlStrength*texture2D(uCurl,vUv).x; gl_FragColor=vec4(texture2D(uVelocity,vUv).xy+f*dt,0.,1.); }`,
  ],
  pressure: [
    V,
    `${P} ${S}
    uniform sampler2D uPressure,uDivergence; uniform vec2 texelSize; varying vec2 vUv;
    void main(){ vec2 L=clamp(vUv-vec2(texelSize.x,0.),0.,1.),R=clamp(vUv+vec2(texelSize.x,0.),0.,1.),T=clamp(vUv+vec2(0.,texelSize.y),0.,1.),B=clamp(vUv-vec2(0.,texelSize.y),0.,1.); gl_FragColor=vec4((texture2D(uPressure,L).x+texture2D(uPressure,R).x+texture2D(uPressure,T).x+texture2D(uPressure,B).x-texture2D(uDivergence,vUv).x)*.25,0.,0.,1.); }`,
  ],
  gradientSubtract: [
    V,
    `${P} ${S}
    uniform sampler2D uPressure,uVelocity; uniform vec2 texelSize; varying vec2 vUv;
    void main(){ float pL=texture2D(uPressure,clamp(vUv-vec2(texelSize.x,0.),0.,1.)).x,pR=texture2D(uPressure,clamp(vUv+vec2(texelSize.x,0.),0.,1.)).x,pT=texture2D(uPressure,clamp(vUv+vec2(0.,texelSize.y),0.,1.)).x,pB=texture2D(uPressure,clamp(vUv-vec2(0.,texelSize.y),0.,1.)).x; gl_FragColor=vec4(texture2D(uVelocity,vUv).xy-vec2(pR-pL,pT-pB),0.,1.); }`,
  ],
  clear: [
    V,
    `${P} ${S}
    uniform sampler2D uTexture; uniform float value; varying vec2 vUv;
    void main(){ gl_FragColor=value*texture2D(uTexture,vUv); }`,
  ],
  display: [
    V,
    `${P}
    uniform sampler2D uTexture; uniform float threshold,edgeSoftness; uniform vec3 inkColor; varying vec2 vUv;
    void main(){ float d=clamp(length(texture2D(uTexture,vUv).rgb),0.,1.); float a=edgeSoftness>0.?smoothstep(threshold-edgeSoftness*.5,threshold+edgeSoftness*.5,d):step(threshold,d); gl_FragColor=vec4(inkColor,a); }`,
  ],
} as const;

export type InkFluidConfig = {
  simResolution: number;
  dyeResolution: number;
  curl: number;
  pressureIterations: number;
  velocityDissipation: number;
  dyeDissipation: number;
  splatRadius: number;
  forceStrength: number;
  pressureDecay: number;
  threshold: number;
  edgeSoftness: number;
  inkColor: THREE.Color;
};

export const INK_DEFAULTS: InkFluidConfig = {
  simResolution: 128,
  dyeResolution: 512,
  curl: 42,
  pressureIterations: 20,
  velocityDissipation: 0.94,
  dyeDissipation: 0.955,
  splatRadius: 0.28,
  forceStrength: 8.5,
  pressureDecay: 0.75,
  threshold: 1.0,
  // Zero on purpose. The display shader then takes its `step` branch, giving
  // a strictly binary alpha — a hard-edged silhouette of solid accent rather
  // than a soft haze. That crisp liquid-metal edge is the whole character of
  // this effect; feathering it turns it into generic smoke.
  edgeSoftness: 0.0,
  inkColor: new THREE.Color(0.761, 1.0, 0.271), // --color-acid #c2ff45
};

type Double = {
  read: THREE.WebGLRenderTarget;
  write: THREE.WebGLRenderTarget;
  swap: () => void;
};

export class InkFluid {
  private config: InkFluidConfig;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private quad: THREE.Mesh;
  private geometry: THREE.PlaneGeometry;

  private width = 1;
  private height = 1;
  private dpr = 1;

  private simSize = { w: 1, h: 1 };
  private dyeSize = { w: 1, h: 1 };
  private velocity!: Double;
  private dye!: Double;
  private pressure!: Double;
  private divergence!: THREE.WebGLRenderTarget;
  private curl!: THREE.WebGLRenderTarget;

  private material: Record<string, THREE.ShaderMaterial>;

  private mouse = { x: 0, y: 0, vx: 0, vy: 0, moved: false };

  // Hoisted scratch — the original allocated five of these per frame.
  private tmpPoint = new THREE.Vector2();
  private tmpColor = new THREE.Vector3();
  private simTexel = new THREE.Vector2();
  private dyeTexel = new THREE.Vector2();

  private resizeObserver: ResizeObserver;
  private host: HTMLElement;
  private disposed = false;

  constructor(
    canvas: HTMLCanvasElement,
    host: HTMLElement,
    config: Partial<InkFluidConfig> = {}
  ) {
    this.config = { ...INK_DEFAULTS, ...config };
    this.host = host;

    // premultipliedAlpha:false is REQUIRED now that edgeSoftness > 0. The
    // display shader emits `vec4(inkColor, a)` — straight, not premultiplied.
    // three defaults to premultiplied, which was harmless while alpha was
    // binary but blows out every feathered edge once it can be fractional.
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: false,
      premultipliedAlpha: false,
    });
    // Cap DPR at 1.5: this is a decorative overlay, and fill rate across ~25
    // full-target passes is the entire cost.
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.dpr = this.renderer.getPixelRatio();

    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.geometry = new THREE.PlaneGeometry(2, 2);
    this.quad = new THREE.Mesh(this.geometry);
    this.scene.add(this.quad);

    const make = (pair: readonly [string, string], uniforms: Record<string, { value: unknown }>) =>
      new THREE.ShaderMaterial({
        vertexShader: pair[0],
        fragmentShader: pair[1],
        uniforms: uniforms as never,
        transparent: true,
      });
    const tex = () => ({ value: null });
    const num = (v = 0) => ({ value: v });
    const vec2 = () => ({ value: new THREE.Vector2() });

    this.material = {
      splat: make(SHADERS.splat, {
        uTarget: tex(),
        aspectRatio: num(),
        radius: num(),
        color: { value: new THREE.Vector3() },
        point: { value: new THREE.Vector2() },
      }),
      advection: make(SHADERS.advection, {
        uVelocity: tex(),
        uSource: tex(),
        texelSize: vec2(),
        dt: num(),
        dissipation: num(),
      }),
      divergence: make(SHADERS.divergence, { uVelocity: tex(), texelSize: vec2() }),
      curl: make(SHADERS.curl, { uVelocity: tex(), texelSize: vec2() }),
      vorticity: make(SHADERS.vorticity, {
        uVelocity: tex(),
        uCurl: tex(),
        texelSize: vec2(),
        curlStrength: num(),
        dt: num(),
      }),
      pressure: make(SHADERS.pressure, { uPressure: tex(), uDivergence: tex(), texelSize: vec2() }),
      gradientSubtract: make(SHADERS.gradientSubtract, {
        uPressure: tex(),
        uVelocity: tex(),
        texelSize: vec2(),
      }),
      clear: make(SHADERS.clear, { uTexture: tex(), value: num() }),
      display: make(SHADERS.display, {
        uTexture: tex(),
        threshold: num(),
        edgeSoftness: num(),
        inkColor: { value: this.config.inkColor },
      }),
    };

    this.resize();
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(host);

    // Listening on window rather than the host: the host is
    // pointer-events:none (so it can't swallow clicks on the CTAs it covers),
    // which also means it never receives pointer events itself. Hit-testing
    // against its rect gives the same behaviour without blocking input.
    window.addEventListener("pointermove", this.onPointerMove, { passive: true });
  }

  /** Pointer is tracked relative to the host, so the ink follows the cursor
   *  inside the card rather than assuming a full-viewport canvas. */
  private onPointerMove = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    const b = this.host.getBoundingClientRect();
    const inside =
      e.clientX >= b.left && e.clientX <= b.right && e.clientY >= b.top && e.clientY <= b.bottom;
    if (!inside) {
      this.mouse.moved = false;
      return;
    }
    const x = (e.clientX - b.left) * this.dpr;
    const y = (e.clientY - b.top) * this.dpr;
    this.mouse.vx = (x - this.mouse.x) * this.config.forceStrength;
    this.mouse.vy = (y - this.mouse.y) * this.config.forceStrength;
    this.mouse.x = x;
    this.mouse.y = y;
    this.mouse.moved = true;
  };

  private makeTarget(w: number, h: number) {
    return new THREE.WebGLRenderTarget(Math.max(w, 2), Math.max(h, 2), {
      type: THREE.HalfFloatType,
      depthBuffer: false,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
    });
  }

  private makeDouble(w: number, h: number): Double {
    return {
      read: this.makeTarget(w, h),
      write: this.makeTarget(w, h),
      swap() {
        const t = this.read;
        this.read = this.write;
        this.write = t;
      },
    };
  }

  private disposeTargets() {
    this.velocity?.read.dispose();
    this.velocity?.write.dispose();
    this.dye?.read.dispose();
    this.dye?.write.dispose();
    this.pressure?.read.dispose();
    this.pressure?.write.dispose();
    this.divergence?.dispose();
    this.curl?.dispose();
  }

  /** Rebuilds every target at the host's current aspect. */
  resize() {
    if (this.disposed) return;
    const rect = this.host.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) return;

    this.renderer.setSize(rect.width, rect.height, false);
    this.width = rect.width * this.dpr;
    this.height = rect.height * this.dpr;

    const aspect = this.width / this.height;
    const { simResolution: simRes, dyeResolution: dyeRes } = this.config;
    this.simSize = { w: simRes, h: Math.max(Math.round(simRes / aspect), 2) };
    this.dyeSize = { w: dyeRes, h: Math.max(Math.round(dyeRes / aspect), 2) };

    this.disposeTargets();
    this.velocity = this.makeDouble(this.simSize.w, this.simSize.h);
    this.dye = this.makeDouble(this.dyeSize.w, this.dyeSize.h);
    this.pressure = this.makeDouble(this.simSize.w, this.simSize.h);
    this.divergence = this.makeTarget(this.simSize.w, this.simSize.h);
    this.curl = this.makeTarget(this.simSize.w, this.simSize.h);

    this.simTexel.set(1 / this.simSize.w, 1 / this.simSize.h);
    this.dyeTexel.set(1 / this.dyeSize.w, 1 / this.dyeSize.h);
  }

  private pass(material: THREE.ShaderMaterial, target: THREE.WebGLRenderTarget | null) {
    this.quad.material = material;
    this.renderer.setRenderTarget(target);
    this.renderer.render(this.scene, this.camera);
  }

  private set(material: THREE.ShaderMaterial, values: Record<string, unknown>) {
    for (const key in values) material.uniforms[key].value = values[key];
    return material;
  }

  private splat() {
    const m = this.material;
    this.tmpPoint.set(this.mouse.x / this.width, 1 - this.mouse.y / this.height);
    this.set(m.splat, {
      aspectRatio: this.width / this.height,
      point: this.tmpPoint,
      radius: this.config.splatRadius / 100,
    });

    this.tmpColor.set(this.mouse.vx, -this.mouse.vy, 0);
    this.set(m.splat, { uTarget: this.velocity.read.texture, color: this.tmpColor });
    this.pass(m.splat, this.velocity.write);
    this.velocity.swap();

    this.tmpColor.set(3, 3, 3);
    this.set(m.splat, { uTarget: this.dye.read.texture, color: this.tmpColor });
    this.pass(m.splat, this.dye.write);
    this.dye.swap();
  }

  /** Advance one frame. Driven by the shared ticker, not an internal rAF. */
  step(dt: number) {
    if (this.disposed || !this.velocity) return;
    const m = this.material;
    const c = this.config;
    const clamped = Math.min(dt, 0.016);

    if (this.mouse.moved) {
      this.splat();
      this.mouse.moved = false;
    }

    this.pass(
      this.set(m.curl, { uVelocity: this.velocity.read.texture, texelSize: this.simTexel }),
      this.curl
    );
    this.pass(
      this.set(m.vorticity, {
        uVelocity: this.velocity.read.texture,
        uCurl: this.curl.texture,
        texelSize: this.simTexel,
        curlStrength: c.curl,
        dt: clamped,
      }),
      this.velocity.write
    );
    this.velocity.swap();

    this.pass(
      this.set(m.divergence, {
        uVelocity: this.velocity.read.texture,
        texelSize: this.simTexel,
      }),
      this.divergence
    );
    this.pass(
      this.set(m.clear, { uTexture: this.pressure.read.texture, value: c.pressureDecay }),
      this.pressure.write
    );
    this.pressure.swap();

    this.set(m.pressure, { uDivergence: this.divergence.texture, texelSize: this.simTexel });
    for (let i = 0; i < c.pressureIterations; i++) {
      m.pressure.uniforms.uPressure.value = this.pressure.read.texture;
      this.pass(m.pressure, this.pressure.write);
      this.pressure.swap();
    }

    this.pass(
      this.set(m.gradientSubtract, {
        uPressure: this.pressure.read.texture,
        uVelocity: this.velocity.read.texture,
        texelSize: this.simTexel,
      }),
      this.velocity.write
    );
    this.velocity.swap();

    this.set(m.advection, {
      uVelocity: this.velocity.read.texture,
      uSource: this.velocity.read.texture,
      texelSize: this.simTexel,
      dt: clamped,
      dissipation: c.velocityDissipation,
    });
    this.pass(m.advection, this.velocity.write);
    this.velocity.swap();

    this.set(m.advection, {
      uSource: this.dye.read.texture,
      texelSize: this.dyeTexel,
      dissipation: c.dyeDissipation,
    });
    this.pass(m.advection, this.dye.write);
    this.dye.swap();

    this.pass(
      this.set(m.display, {
        uTexture: this.dye.read.texture,
        threshold: c.threshold,
        edgeSoftness: c.edgeSoftness,
        inkColor: c.inkColor,
      }),
      null
    );
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.resizeObserver.disconnect();
    window.removeEventListener("pointermove", this.onPointerMove);
    this.disposeTargets();
    this.geometry.dispose();
    for (const key in this.material) this.material[key].dispose();
    this.renderer.dispose();
  }
}
