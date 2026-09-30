"""Assemble the prepared character in Blender, save an editable .blend and GLB.

Blender --background --python tools/assemble-hoodie-model.py -- /tmp/hoodie-3d-build
The preparer must have run first. Model uses Blender -Y forward / Z up;
the glTF exporter converts to +Z forward / Y up for Three.js.
"""
import bpy
import json
import math
import sys
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
DIR = Path(sys.argv[sys.argv.index("--") + 1])
data = json.loads((DIR / "geometry.json").read_text())
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene


def solid(name, srgb):
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    nodes = material.node_tree.nodes
    nodes.clear()
    rgb = nodes.new("ShaderNodeRGB")
    linear = [v / 12.92 if v <= .04045 else ((v + .055) / 1.055) ** 2.4 for v in srgb]
    rgb.outputs[0].default_value = (*linear, 1)
    output = nodes.new("ShaderNodeOutputMaterial")
    material.node_tree.links.new(rgb.outputs[0], output.inputs["Surface"])
    return material


def textured(name, file):
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    nodes = material.node_tree.nodes
    nodes.clear()
    image = nodes.new("ShaderNodeTexImage")
    image.image = bpy.data.images.load(str(file))
    image.image.pack()
    output = nodes.new("ShaderNodeOutputMaterial")
    # A colour connected to Surface is shadeless in Blender and exports as
    # KHR_materials_unlit. Texture linework retains its exact original tone.
    transparent = nodes.new("ShaderNodeBsdfTransparent")
    cutoff = nodes.new("ShaderNodeMath")
    cutoff.operation = "GREATER_THAN"
    cutoff.inputs[1].default_value = .25
    mix = nodes.new("ShaderNodeMixShader")
    links = material.node_tree.links
    links.new(image.outputs["Alpha"], cutoff.inputs[0])
    links.new(cutoff.outputs[0], mix.inputs[0])
    links.new(transparent.outputs[0], mix.inputs[1])
    links.new(image.outputs["Color"], mix.inputs[2])
    links.new(mix.outputs[0], output.inputs["Surface"])
    return material


skin = solid("NeckSkin", (.92, .80, .64))
dark = solid("HiddenHairAndFabric", (.09, .09, .095))
surface = textured("OriginalArtwork", DIR / "surface.png")
eyes = textured("OriginalEyes", DIR / "original.png")


def pivot(name, position, parent=None):
    obj = bpy.data.objects.new(name, None)
    scene.collection.objects.link(obj)
    obj.location = position
    bpy.context.view_layer.update()
    if parent:
        world = obj.matrix_world.copy()
        obj.parent = parent
        obj.matrix_parent_inverse = parent.matrix_world.inverted()
        obj.matrix_world = world
    bpy.context.view_layer.update()
    return obj


body = pivot("BodyRig", data["bodyPivot"])
head = pivot("HeadRig", data["headPivot"], body)

for part in data["parts"]:
    mesh = bpy.data.meshes.new(part["name"])
    mesh.from_pydata(part["vertices"], [], part["faces"])
    mesh.update()
    obj = bpy.data.objects.new(part["name"], mesh)
    scene.collection.objects.link(obj)
    obj.parent = body if part["name"] == "HoodieSurface" else head
    obj.matrix_parent_inverse = obj.parent.matrix_world.inverted()
    obj.data.materials.append(eyes if part["name"].startswith("Eye") else surface)
    obj.data.materials.append(dark)
    uv = mesh.uv_layers.new(name="UVMap")
    for poly in mesh.polygons:
        poly.material_index = part["materials"][poly.index]
        poly.use_smooth = True
        for loop in poly.loop_indices:
            uv.data[loop].uv = part["uv"][mesh.loops[loop].vertex_index]
    # Colour projection on rounded geometry should stay crisp at the jaw.
    # No subdivision modifier: it would shrink the measured silhouette.

# Neck and the hidden inner hood cover surfaces exposed during a nod.
bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=16, location=(0, .04, 1.03))
neck = bpy.context.object
neck.name = "Neck"
neck.scale = (.18, .18, .32)
neck.data.materials.append(skin)
neck.parent = body
neck.matrix_parent_inverse = body.matrix_world.inverted()
for poly in neck.data.polygons:
    poly.use_smooth = True

bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=16, location=(0, .08, .98))
hood = bpy.context.object
hood.name = "InnerHood"
hood.scale = (.49, .24, .24)
hood.data.materials.append(dark)
hood.parent = body
hood.matrix_parent_inverse = body.matrix_world.inverted()
for poly in hood.data.polygons:
    poly.use_smooth = True

# Save before adding the preview camera: only the character ships.
bpy.ops.object.select_all(action="SELECT")
bpy.ops.export_scene.gltf(filepath=str(DIR / "hoodie-character.glb"), export_format="GLB", export_yup=True)
bpy.ops.wm.save_as_mainfile(filepath=str(DIR / "hoodie-character.blend"))

scene.render.engine = "BLENDER_EEVEE"
scene.render.resolution_x = 660
scene.render.resolution_y = 868
scene.render.resolution_percentage = 100
scene.render.film_transparent = True
scene.view_settings.view_transform = "Standard"
scene.view_settings.look = "None"
scene.view_settings.exposure = 0
scene.view_settings.gamma = 1
bpy.ops.object.camera_add(location=(0, -7, 434 / 330))
camera = bpy.context.object
camera.rotation_euler = (math.pi / 2, 0, 0)
camera.data.type = "ORTHO"
camera.data.ortho_scale = 434 / 165
scene.camera = camera
for name, angle, nod in [("front", 0, 0), ("left", -.4, .07), ("right", .4, -.07)]:
    head.rotation_euler = (nod, 0, angle)
    scene.render.filepath = str(DIR / f"preview-{name}.png")
    bpy.ops.render.render(write_still=True)
print("Saved model, editable Blender source, and three viewing angles to", DIR)
