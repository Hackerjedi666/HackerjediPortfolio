import poses from "@/lib/generated/hoodie-motion.json";

/** A small WebGL compositor, using the original art and precomputed motion.
 * No mesh approximation, runtime optical-flow computation, or pose crossfade.
 * Corresponding features are warped into place before they are blended.
 */
const VERTEX = `
attribute vec2 position;
varying vec2 uv;
void main() {
  uv = vec2(position.x * .5 + .5, .5 - position.y * .5);
  gl_Position = vec4(position, 0., 1.);
}`;

const FRAGMENT = `
precision highp float;
varying vec2 uv;
uniform sampler2D artwork;
uniform sampler2D motion;
uniform vec4 cells;
uniform vec2 phase;
uniform float patch;
uniform vec2 flowGrid;

vec2 tileUV(vec2 p, float tile, vec2 grid, vec2 size) {
  p = clamp(p, .5 / size, 1. - .5 / size);
  return (vec2(mod(tile, grid.x), floor(tile / grid.x)) + p) / grid;
}

vec4 vectors(vec2 p, float tile) {
  vec4 encoded = texture2D(motion, tileUV(p, tile, flowGrid, vec2(${poses.flowCell.join(",")})));
  return (encoded * 255. - 128.) * (${poses.flowRange}. / 127.);
}

vec4 pose(float cell, float corner, vec2 travel) {
  vec2 p = uv;
  // Invert the forward correspondence field. Iteration matters around
  // eyes and the jaw, where one global translation would double outlines.
  for (int i = 0; i < 3; i++) {
    vec4 f = vectors(p, patch * 4. + corner);
    p = uv - (f.rg * travel.x + f.ba * travel.y) / vec2(${poses.artCell.join(",")});
  }
  vec4 c = texture2D(artwork, tileUV(p, cell, vec2(6.), vec2(${poses.artCell.join(",")})));
  // Blend premultiplied colours: invisible RGB must not make black fringes.
  return vec4(c.rgb * c.a, c.a);
}

void main() {
  vec4 a = pose(cells.x, 0., phase);
  vec4 b = pose(cells.y, 1., vec2(1. - phase.x, phase.y));
  vec4 c = pose(cells.z, 2., vec2(phase.x, 1. - phase.y));
  vec4 d = pose(cells.w, 3., 1. - phase);
  gl_FragColor = mix(mix(a, b, phase.x), mix(c, d, phase.x), phase.y);
}`;

export function locatePose(yaw: number, pitch: number) {
  const x = Math.max(0, Math.min(1, yaw));
  const y = Math.max(0, Math.min(1, pitch)) * 2;
  const row = Math.min(1, Math.floor(y));
  let col = 0;
  while (col < poses.knots.length - 2 && x > poses.knots[col + 1]) col++;
  const phaseX = (x - poses.knots[col]) / (poses.knots[col + 1] - poses.knots[col]);
  const patch = row * (poses.knots.length - 1) + col;
  return { patch, cells: poses.patches[patch], x: phaseX, y: y - row };
}

export type HoodieMorph = {
  draw: (yaw: number, pitch: number) => void;
  resize: (width: number) => void;
  dispose: () => void;
};

export async function createHoodieMorph(canvas: HTMLCanvasElement, signal: AbortSignal): Promise<HoodieMorph> {
  // WebGL keeps this tiny compositor available on Safari and older GPUs,
  // without booting another Three.js renderer beside the screen effect.
  const gl = canvas.getContext("webgl", {
    alpha: true, premultipliedAlpha: true, antialias: false,
    depth: false, stencil: false, powerPreference: "low-power",
  });
  if (!gl) throw new Error("Character compositor unavailable");

  const shaders: WebGLShader[] = [];
  const textures: WebGLTexture[] = [];
  const bitmaps: ImageBitmap[] = [];
  const program = gl.createProgram();
  const buffer = gl.createBuffer();
  const dispose = () => {
    bitmaps.forEach((bitmap) => bitmap.close());
    textures.forEach((texture) => gl.deleteTexture(texture));
    shaders.forEach((shader) => gl.deleteShader(shader));
    gl.deleteBuffer(buffer);
    gl.deleteProgram(program);
  };

  try {
    if (!program || !buffer) throw new Error("Character GPU allocation failed");
    for (const [type, source] of [[gl.VERTEX_SHADER, VERTEX], [gl.FRAGMENT_SHADER, FRAGMENT]] as const) {
      const shader = gl.createShader(type);
      if (!shader) throw new Error("Character shader allocation failed");
      shaders.push(shader);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) ?? "Character shader failed");
      gl.attachShader(program, shader);
    }
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error("Character shader linking failed");
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    // Decode raw RGBA. The motion PNG's alpha channel stores vertical
    // displacement; normal image premultiplication would corrupt all four.
    const urls = ["/brand/hoodie-poses.webp", "/brand/hoodie-flow.png"];
    const downloads = await Promise.all(urls.map(async (url) => {
      const response = await fetch(url, { signal });
      if (!response.ok) throw new Error(`Character asset unavailable: ${response.status}`);
      return response.blob();
    }));
    for (let unit = 0; unit < downloads.length; unit++) {
      signal.throwIfAborted();
      const bitmap = await createImageBitmap(downloads[unit], { premultiplyAlpha: "none", colorSpaceConversion: "none" });
      bitmaps.push(bitmap);
      signal.throwIfAborted();
      const texture = gl.createTexture();
      if (!texture) throw new Error("Character texture allocation failed");
      textures.push(texture);
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, bitmap);
      gl.uniform1i(gl.getUniformLocation(program, unit === 0 ? "artwork" : "motion"), unit);
    }
    if (gl.getError() !== gl.NO_ERROR) throw new Error("Character texture upload failed");
    gl.uniform2f(gl.getUniformLocation(program, "flowGrid"), poses.flowGrid[0], poses.flowGrid[1]);
    const cells = gl.getUniformLocation(program, "cells");
    const phase = gl.getUniformLocation(program, "phase");
    const patch = gl.getUniformLocation(program, "patch");

    return {
      resize(width) {
        const pixels = Math.max(1, Math.round(Math.min(width * Math.min(devicePixelRatio, 2), 660)));
        canvas.width = pixels;
        canvas.height = Math.round(pixels * 434 / 330);
        gl.viewport(0, 0, canvas.width, canvas.height);
      },
      draw(yaw, pitch) {
        const pose = locatePose(yaw, pitch);
        gl.uniform4fv(cells, pose.cells);
        gl.uniform2f(phase, pose.x, pose.y);
        gl.uniform1f(patch, pose.patch);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      },
      dispose,
    };
  } catch (error) {
    dispose();
    throw error;
  }
}
