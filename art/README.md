# Hoodie character

`hoodie-character.blend` is the editable model served as
`public/brand/hoodie-character.glb`. Rebuild it with:

```sh
/Applications/Blender.app/Contents/MacOS/Blender --background \
  --python tools/sculpt-hoodie.py -- /tmp/hoodie-sculpt-build
```

This is a sculpted interpretation of the original anime character, not an exact
reconstruction of the drawing. The face, swept hair locks, ears, half-lidded eyes,
neck, raised fabric hood, drawstrings and hoodie folds are opaque meshes with matte materials. No projected
illustration, transparency masks, or raster eye decals are used. The current
export is 1.40 MB, 63,280 triangles and 16 meshes with no textures.

`HeadRig` pivots at the neck, `BodyRig` at the torso, and `EyeLeft` / `EyeRight`
move the pupils independently. The runtime limits head yaw to ±24 degrees and
pitch to ±9 degrees. Pupil travel stays inside the eye whites. The browser adds
hemisphere and directional lighting without expensive shadow maps.

The generator saves front and left/right three-quarter preview renders. Inspect
all three before copying the GLB to `public/brand` and the Blender file here.
Convert the 900×1184 front PNG to `public/brand/hoodie-3d-poster.webp` for the
loading and reduced-motion fallback. Camera height is 2.91, centered at 1.37.

`components/effects/hoodie-3d.tsx` loads only when visible, caps pixel ratio at 2,
uses time-based damping, and renders on demand until the pose settles. The head
response time constant is 22 ms; eyes are 8 ms and shoulders 90 ms. Development
builds expose a rolling frame-interval median and p95 in `data-frame-timing` on
the renderer host. These are rAF intervals, not GPU execution measurements.

The older `prepare-hoodie-model.py` / `assemble-hoodie-model.py` pipeline is an
abandoned projected-artwork experiment and does not generate the current asset.
The original sprite atlas remains available as the visual reference.
