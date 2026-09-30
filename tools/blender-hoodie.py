"""
Stylized anime bust, built procedurally, exported as GLB.

DESIGN NOTES (the same mistakes are easy to make in 3D as in 2D):
  - The head is TALLER than it is wide (0.78 x 0.86 x 1.0) with a tapered
    jaw. Equal width and height is infant proportion and reads as a baby.
  - Hair is a mass that extends BEYOND the skull. Anime hair is defined
    by its silhouette, not by lying flat on the scalp.
  - Eyes are wide but not round, set at 45% of head height, with a heavy
    upper lash bar. Round eyes set low is the strongest "baby" cue there
    is.
  - Toon look comes from an INVERTED HULL: each shape is duplicated,
    scaled up slightly and its normals flipped, so with backface culling
    only the silhouette shows as a dark outline.

The HEAD is its own empty-parented group so the runtime can rotate it
independently of the torso — that is the whole point of going 3D.
"""
import bpy
import bmesh
import math
import sys
from mathutils import Vector

ARGS = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
OUT = ARGS[0] if ARGS else "/tmp/hoodie.glb"
PREVIEW = ARGS[1] if len(ARGS) > 1 else ""

# ----------------------------------------------------------------- scene
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene

SKIN = (0.949, 0.835, 0.761, 1)
SHADE = (0.847, 0.678, 0.592, 1)
HAIR = (0.055, 0.055, 0.075, 1)
HOOD = (0.078, 0.078, 0.110, 1)
SHIRT = (0.043, 0.043, 0.063, 1)
WHITE = (1, 1, 1, 1)
IRIS = (0.216, 0.129, 0.090, 1)
INK = (0.043, 0.043, 0.063, 1)
MOUTH = (0.42, 0.20, 0.20, 1)

_mats = {}


def mat(name, rgba, emissive=False):
    if name in _mats:
        return _mats[name]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = rgba
    bsdf.inputs["Roughness"].default_value = 0.85
    if "Specular IOR Level" in bsdf.inputs:
        bsdf.inputs["Specular IOR Level"].default_value = 0.1
    if emissive:
        bsdf.inputs["Emission Color"].default_value = rgba
        bsdf.inputs["Emission Strength"].default_value = 1.0
    m.use_backface_culling = True
    _mats[name] = m
    return m


def put(obj, material, parent=None, smooth=True):
    obj.data.materials.append(material)
    if smooth:
        for p in obj.data.polygons:
            p.use_smooth = True
    if parent:
        obj.parent = parent
    return obj


def sphere(name, loc, scale, segs=28, rings=16):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segs, ring_count=rings,
                                         radius=0.5, location=loc)
    o = bpy.context.object
    o.name = name
    o.scale = scale
    return o


def cyl(name, loc, scale, verts=20):
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=0.5, depth=1.0,
                                        location=loc)
    o = bpy.context.object
    o.name = name
    o.scale = scale
    return o


def cone(name, loc, scale, verts=5):
    bpy.ops.mesh.primitive_cone_add(vertices=verts, radius1=0.5, radius2=0.0,
                                    depth=1.0, location=loc)
    o = bpy.context.object
    o.name = name
    o.scale = scale
    return o


def apply_transforms(o):
    bpy.context.view_layer.objects.active = o
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)


# ------------------------------------------------------------ head group
head_root = bpy.data.objects.new("HeadRoot", None)
scene.collection.objects.link(head_root)
head_root.location = (0, 0, 0)

body_root = bpy.data.objects.new("BodyRoot", None)
scene.collection.objects.link(body_root)

# ---- skull: taller than wide, jaw tapered toward the chin
skull = sphere("Head", (0, 0, 0), (0.78, 0.86, 1.0), segs=32, rings=20)
apply_transforms(skull)
me = skull.data
bm = bmesh.new()
bm.from_mesh(me)
for v in bm.verts:
    z = v.co.z
    if z < 0.0:
        # 1.0 at the eye line down to 0.62 at the chin: this taper is what
        # separates a face from a ball.
        t = min(1.0, (-z) / 0.5)
        k = 1.0 - 0.38 * (t ** 1.5)
        v.co.x *= k
        v.co.y *= k
    if z < -0.30:
        v.co.y += (z + 0.30) * 0.22          # chin pulled forward
bm.to_mesh(me)
bm.free()
put(skull, mat("skin", SKIN), head_root)

# ---- hair cap + spikes, extending past the skull silhouette
cap = sphere("HairCap", (0, 0.04, 0.14), (0.86, 0.94, 0.92), segs=32, rings=20)
apply_transforms(cap)
me = cap.data
bm = bmesh.new()
bm.from_mesh(me)
# TRIM HARD. The first pass kept everything above z=-0.10 and the cap
# came down over the eyes and most of the cheeks — the face was gone.
# The front of the cap is cut well above the brow line; the back keeps
# its length so the silhouette still reads as hair.
kill = [v for v in bm.verts
        if (v.co.y < 0.0 and v.co.z < 0.16)          # front: above the brow
        or (v.co.y >= 0.0 and v.co.z < -0.22)]       # back: down to the nape
bmesh.ops.delete(bm, geom=kill, context="VERTS")
for v in bm.verts:
    v.co.z += 0.02 * math.sin(v.co.x * 9.0)   # ragged, not moulded
bm.to_mesh(me)
bm.free()
put(cap, mat("hair", HAIR), head_root)

# WEDGES, NOT SPIKES. Thin tall cones read as a crown of thorns, which
# is what the first pass produced. Hair reads as chunks: wide across,
# thick front-to-back, and only moderately tall.
SPIKES = [
    ((-0.40, 0.08, 0.30), (0.40, 0.42, 0.34), (22, 0, -40)),
    ((-0.22, -0.10, 0.44), (0.38, 0.40, 0.32), (14, 0, -16)),
    ((0.02, -0.16, 0.48), (0.42, 0.44, 0.34), (8, 0, 2)),
    ((0.26, -0.08, 0.44), (0.38, 0.40, 0.32), (14, 0, 18)),
    ((0.42, 0.08, 0.28), (0.40, 0.42, 0.32), (22, 0, 42)),
    ((-0.46, 0.22, 0.04), (0.34, 0.36, 0.30), (40, 0, -62)),
    ((0.48, 0.22, 0.02), (0.34, 0.36, 0.28), (40, 0, 64)),
    ((0.0, 0.44, 0.22), (0.38, 0.40, 0.32), (-40, 0, 0)),
]
for i, (loc, sc, rot) in enumerate(SPIKES):
    s = cone(f"Spike{i}", loc, sc, verts=6)
    s.rotation_euler = tuple(math.radians(a) for a in rot)
    apply_transforms(s)
    put(s, mat("hair", HAIR), head_root)

# ---- fringe: sits ABOVE the brow line, never over the eyes
for i, (x, rz, h) in enumerate([(-0.26, -16, 0.22), (-0.08, -6, 0.26),
                                (0.12, 7, 0.25), (0.30, 17, 0.20)]):
    f = cone(f"Fringe{i}", (x, -0.33, 0.30), (0.26, 0.24, h), verts=4)
    f.rotation_euler = (math.radians(150), 0, math.radians(rz))
    apply_transforms(f)
    put(f, mat("hair", HAIR), head_root)

# ---- eyes: wide, not round; set at 45% of head height
for side in (-1, 1):
    x = 0.215 * side
    w = sphere(f"EyeW{side}", (x, -0.315, 0.02), (0.235, 0.10, 0.175))
    apply_transforms(w)
    put(w, mat("eyewhite", WHITE), head_root)

    ir = sphere(f"Iris{side}", (x, -0.372, 0.005), (0.135, 0.07, 0.135))
    apply_transforms(ir)
    put(ir, mat("iris", IRIS), head_root)

    pu = sphere(f"Pupil{side}", (x, -0.395, 0.0), (0.075, 0.05, 0.085))
    apply_transforms(pu)
    put(pu, mat("pupil", INK), head_root)

    hl = sphere(f"Hl{side}", (x - 0.045 * side, -0.408, 0.055), (0.052, 0.04, 0.052))
    apply_transforms(hl)
    put(hl, mat("hl", WHITE, emissive=True), head_root)

    # upper lash bar — the single line that makes an anime eye an eye
    la = cyl(f"Lash{side}", (x, -0.345, 0.105), (0.30, 0.30, 0.055), verts=14)
    la.rotation_euler = (math.radians(90), 0, 0)
    apply_transforms(la)
    put(la, mat("hair", HAIR), head_root)

    br = cone(f"Brow{side}", (x + 0.02 * side, -0.340, 0.215), (0.26, 0.055, 0.075), verts=4)
    br.rotation_euler = (math.radians(90), 0, math.radians(-9 * side))
    apply_transforms(br)
    put(br, mat("hair", HAIR), head_root)

# ---- mouth + nose hint
mo = sphere("Mouth", (0, -0.345, -0.315), (0.085, 0.05, 0.035))
apply_transforms(mo)
put(mo, mat("mouth", MOUTH), head_root)

no = sphere("Nose", (0, -0.360, -0.175), (0.035, 0.035, 0.030))
apply_transforms(no)
put(no, mat("shade", SHADE), head_root)

for side in (-1, 1):
    ea = sphere(f"Ear{side}", (0.375 * side, 0.02, -0.03), (0.075, 0.13, 0.20))
    apply_transforms(ea)
    put(ea, mat("shade", SHADE), head_root)

# ------------------------------------------------------------ body group
neck = cyl("Neck", (0, 0.02, -0.66), (0.26, 0.24, 0.34))
apply_transforms(neck)
put(neck, mat("skin", SKIN), body_root)

torso = cyl("Torso", (0, 0.0, -1.32), (1.12, 0.86, 1.10), verts=28)
apply_transforms(torso)
me = torso.data
bm = bmesh.new()
bm.from_mesh(me)
for v in bm.verts:
    # CLAMPED. Unclamped, the topmost vertex lands at t = 1.0000000000002
    # from float error, (1.0 - t) goes negative, and a negative base to a
    # fractional power is COMPLEX in Python — which surfaces much later as
    # "assigned value not a number" on the vector write.
    t = max(0.0, min(1.0, (v.co.z + 0.55) / 1.10))   # 0 at hem, 1 at shoulder
    # Widest at the SHOULDER, barely tapering down. The first pass had it
    # backwards — narrow at the top, wide at the hem — which is a cone,
    # and with the collar sphere on top the whole bust read as an acorn.
    k = 0.88 + 0.12 * t
    v.co.x *= k
    v.co.y *= k * 0.92
bm.to_mesh(me)
bm.free()
put(torso, mat("hood", HOOD), body_root)

# Shoulder slope, flattened: a sphere here is what made the acorn.
shoulders = sphere("Shoulders", (0, 0.0, -0.95), (1.30, 0.92, 0.42))
apply_transforms(shoulders)
put(shoulders, mat("hood", HOOD), body_root)

tee = cyl("Tee", (0, -0.12, -0.92), (0.40, 0.30, 0.30), verts=18)
apply_transforms(tee)
put(tee, mat("shirt", SHIRT), body_root)

# ------------------------------------------------ inverted-hull outlines
outline_mat = mat("outline", (0.016, 0.016, 0.024, 1), emissive=True)
# CULLING MUST BE ON. The hull's normals are flipped, so its near-side
# faces point away from the camera and get culled, leaving only the far
# side visible around the silhouette — that rim IS the outline. With
# culling off the whole shell draws and swallows the model, which is
# exactly what the first render did.
outline_mat.use_backface_culling = True

targets = [o for o in scene.collection.objects
           if o.type == "MESH" and not o.name.startswith(("Hl", "Pupil", "Iris"))]
for o in targets:
    dup = o.copy()
    dup.data = o.data.copy()
    dup.name = o.name + "_OL"
    scene.collection.objects.link(dup)
    dup.parent = o.parent
    dup.matrix_parent_inverse = o.matrix_parent_inverse.copy()

    bm = bmesh.new()
    bm.from_mesh(dup.data)
    # normal_update() first: a bmesh built from a mesh has no vertex
    # normals until asked, and offsetting along a zero vector is what the
    # "assigned value not a number" failure actually was.
    bm.normal_update()
    # Push along normals, then flip. With backface culling the front of the
    # shell is discarded and only the rim survives, which is the outline.
    for v in bm.verts:
        v.co = v.co + (Vector(v.normal) * 0.022)
    bmesh.ops.reverse_faces(bm, faces=bm.faces)
    bm.to_mesh(dup.data)
    bm.free()
    dup.data.materials.clear()
    dup.data.materials.append(outline_mat)

# ------------------------------------------------------------- subsurf
for o in scene.collection.objects:
    if o.type == "MESH" and not o.name.endswith("_OL"):
        m = o.modifiers.new("sub", "SUBSURF")
        m.levels = 1
        m.render_levels = 1

# ------------------------------------------------------------- export
bpy.ops.object.select_all(action="SELECT")
bpy.ops.export_scene.gltf(
    filepath=OUT,
    export_format="GLB",
    export_apply=True,
    export_yup=True,
    export_materials="EXPORT",
)
print("WROTE", OUT)

# ------------------------------------------------------------- preview
if PREVIEW:
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 520
    scene.render.resolution_y = 620
    scene.render.film_transparent = True
    bpy.ops.object.camera_add(location=(0, -5.2, -0.35))
    cam = bpy.context.object
    cam.data.type = "ORTHO"
    cam.data.ortho_scale = 3.0
    cam.rotation_euler = (math.radians(90), 0, 0)
    scene.camera = cam
    for loc, e in [((-3, -4, 3), 400), ((4, -3, 1), 160), ((0, 4, 2), 120)]:
        bpy.ops.object.light_add(type="AREA", location=loc)
        L = bpy.context.object
        L.data.energy = e
        L.data.size = 6
        L.rotation_euler = (math.radians(60), 0, math.radians(30))
    for tag, rz in [("front", 0), ("q34", 32), ("side", 62)]:
        head_root.rotation_euler = (0, 0, math.radians(rz))
        scene.render.filepath = f"{PREVIEW}_{tag}.png"
        bpy.ops.render.render(write_still=True)
    print("PREVIEWS DONE")
