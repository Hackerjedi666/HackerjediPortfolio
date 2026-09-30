"""Model a texture-free, matte chibi bust. Blender -Y forward, Z up.

Blender --background --python tools/sculpt-hoodie.py -- /tmp/hoodie-sculpt-build
All visible details are geometry; no alpha masks, projected photos or decals.
"""
import bpy
import math
import sys
from pathlib import Path
from mathutils import Vector

OUT = Path(sys.argv[sys.argv.index('--') + 1])
OUT.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene


def material(name, color, roughness=.88):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = (*color, 1)
    bsdf.inputs['Roughness'].default_value = roughness
    bsdf.inputs['Specular IOR Level'].default_value = .16
    return mat


skin = material('warm porcelain skin', (.66, .43, .25))
ear = material('ear recess', (.34, .19, .13))
hair = material('charcoal hair', (.016, .018, .021))
cloth = material('black cotton', (.021, .025, .029))
hood_cloth = material('hood charcoal cotton', (.030, .035, .042))
seam = material('fold shadows', (.007, .009, .012))
shirt = material('washed charcoal shirt', (.040, .043, .049))
ink = material('soft black features', (.004, .003, .004))
white = material('warm eye whites', (.80, .79, .73))
iris = material('brown iris', (.13, .060, .027))


def parent(obj, rig):
    bpy.context.view_layer.update()
    world = obj.matrix_world.copy()
    obj.parent = rig
    obj.matrix_world = world
    return obj


def pivot(name, loc, rig=None):
    obj = bpy.data.objects.new(name, None)
    scene.collection.objects.link(obj)
    obj.location = loc
    if rig:
        parent(obj, rig)
    return obj


body = pivot('BodyRig', (0, 0, .3))
head = pivot('HeadRig', (0, 0, 1.15), body)


def sphere(name, loc, scale, mat, rig=head, segments=40, rings=24):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments, ring_count=rings, location=loc)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    obj.data.materials.append(mat)
    for poly in obj.data.polygons:
        poly.use_smooth = True
    if rig:
        parent(obj, rig)
    return obj


def tube(name, points, radius, mat, rig=head):
    curve = bpy.data.curves.new(name, 'CURVE')
    curve.dimensions = '3D'
    curve.resolution_u = 12
    curve.bevel_depth = radius
    curve.bevel_resolution = 3
    spline = curve.splines.new('BEZIER')
    spline.bezier_points.add(len(points)-1)
    for p, co in zip(spline.bezier_points, points):
        p.co = co
        p.handle_left_type = p.handle_right_type = 'AUTO'
    obj = bpy.data.objects.new(name, curve)
    scene.collection.objects.link(obj)
    obj.data.materials.append(mat)
    parent(obj, rig)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.convert(target='MESH')
    obj.select_set(False)
    return obj


def cushion(name, outline, y, depth, mat, rig=head, center=None):
    """Closed pillow surface with sculpted silhouette and rounded front/back."""
    cx, cz = center or (sum(p[0] for p in outline)/len(outline), sum(p[1] for p in outline)/len(outline))
    vertices, faces = [], []
    n = len(outline)
    for scale, d in [(.02, -depth), (.45, -depth*.94), (.85, -depth*.55), (1, 0), (.85, depth*.5), (.02, depth*.7)]:
        vertices.extend([(cx+(x-cx)*scale, y+d, cz+(z-cz)*scale) for x,z in outline])
    for row in range(5):
        for i in range(n):
            j=(i+1)%n
            faces.append((row*n+i,row*n+j,(row+1)*n+j,(row+1)*n+i))
    faces += [tuple(reversed(range(n))), tuple(range(5*n,6*n))]
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj=bpy.data.objects.new(name,mesh)
    scene.collection.objects.link(obj)
    obj.data.materials.append(mat)
    # Make normals outward independent of authored silhouette winding.
    bpy.context.view_layer.objects.active=obj
    obj.select_set(True)
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.mesh.normals_make_consistent(inside=False)
    bpy.ops.object.mode_set(mode='OBJECT')
    mod=obj.modifiers.new('rounded sculpt', 'SUBSURF')
    mod.levels=2
    bpy.ops.object.modifier_apply(modifier=mod.name)
    for poly in obj.data.polygons:
        poly.use_smooth=True
    obj.select_set(False)
    parent(obj,rig)
    return obj


# Broad cheeks, small chin, flattened front rather than a round ball face.
cushion('Face', [(-.56,1.95),(-.53,2.08),(-.28,2.17),(.28,2.17),(.53,2.08),(.56,1.95),(.57,1.61),(.47,1.39),(.23,1.25),(0,1.22),(-.23,1.25),(-.47,1.39),(-.57,1.61)], -.08, .39, skin, center=(0,1.75))
sphere('Neck',(0,.02,1.15),(.18,.18,.29),skin,body)
for side in [-1,1]:
    sphere('Ear', (side*.55,-.04,1.59),(.13,.105,.19),skin)
    sphere('EarInset',(side*.586,-.132,1.61),(.056,.025,.105),ear)
    tube('EarFold',[(side*.59,-.16,1.65),(side*.55,-.175,1.68),(side*.56,-.17,1.57)],.015,skin)

# Eyes sit in front of the face, with a fixed half-lid and bounded pupils.
for side, name in [(-1,'EyeLeft'),(1,'EyeRight')]:
    x=side*.255
    outline=[(x-.14,1.75),(x-.07,1.75),(x,1.75),(x+.07,1.75),(x+.14,1.75),(x+.13,1.65),(x+.08,1.57),(x,1.555),(x-.08,1.57),(x-.13,1.65)]
    cushion('Eye socket',[(x+(u-x)*1.055,1.65+(v-1.65)*1.06) for u,v in outline],-.448,.027,ink)
    cushion('Eye white',outline,-.475,.025,white)
    eye=pivot(name,(x,-.518,1.655),head)
    pupil=[(x-.058,1.76),(x,1.76),(x+.058,1.76),(x+.058,1.66),(x+.040,1.603),(x,1.593),(x-.040,1.603),(x-.058,1.66)]
    cushion('Pupil outline',pupil,-.526,.012,ink,eye)
    cushion('Brown pupil',[(x+(u-x)*.78,1.69+(v-1.69)*.84) for u,v in pupil],-.544,.008,iris,eye)
    tube('Sleepy upper lid',[(x-.143,-.51,1.758),(x,-.535,1.755),(x+.143,-.51,1.758)],.022,ink)
    tube('Eyebrow',[(x-.125,-.442,1.878),(x-.045,-.485,1.9),(x+.115,-.455,1.88)],.028,hair)
sphere('Nose',(0,-.458,1.565),(.032,.03,.026),skin)
tube('Quiet mouth',[(-.042,-.426,1.415),(0,-.435,1.419),(.041,-.426,1.415)],.009,ink)

# Back mass and separately modeled swept locks retain the asymmetric silhouette.
sphere('Hair back',(0,.105,2.04),(.67,.46,.57),hair)
locks=[
    ([(-.73,2.10),(-.94,2.20),(-.78,2.16),(-.65,2.32),(-.42,2.46),(-.19,2.38),(-.34,2.14),(-.57,2.02)],-.10,.19),
    ([(-.57,2.35),(-.68,2.48),(-.53,2.47),(-.40,2.40),(-.27,2.61),(.06,2.64),(.18,2.73),(.19,2.51),(-.01,2.31)],-.03,.20),
    ([(-.25,2.42),(.12,2.63),(.37,2.56),(.61,2.45),(.78,2.51),(.66,2.31),(.49,2.22),(.2,2.28)],-.20,.21),
    ([(.38,2.39),(.65,2.42),(.73,2.18),(.86,2.11),(.94,2.18),(.85,1.98),(.63,1.96),(.45,2.13)],-.10,.17),
    ([(-.39,2.37),(-.13,2.40),(-.17,2.12),(-.33,1.95),(-.42,1.74),(-.53,1.88),(-.48,2.10)],-.38,.14),
    ([(-.15,2.47),(.14,2.43),(.13,2.20),(.20,1.98),(.35,1.89),(.13,1.92),(-.04,2.08)],-.43,.16),
    ([(.09,2.48),(.37,2.43),(.48,2.24),(.46,2.10),(.57,2.03),(.40,1.99),(.22,2.12)],-.36,.17),
    ([(.42,2.31),(.61,2.24),(.69,2.05),(.63,1.81),(.55,1.70),(.52,1.93),(.39,2.09)],-.20,.14),
    ([(-.63,2.27),(-.45,2.27),(-.54,2.04),(-.61,1.78),(-.69,1.94),(-.70,2.12)],-.19,.14),
]
for i,(outline,y,d) in enumerate(locks):
    cushion(f'Swept hair lock {i+1}',outline,y,d,hair)

# Tuck the side tufts inside the cloth instead of intersecting its rim.
bpy.context.view_layer.update()
for obj in list(head.children):
    if obj.type=='MESH' and obj.data.materials[0]==hair:
        inverse=obj.matrix_world.inverted()
        for v in obj.data.vertices:
            world=obj.matrix_world @ v.co
            world.x *= .88
            v.co=inverse @ world

# An open, double-wall fabric hood wrapping over the crown and behind the
# head. The face opening is real geometry; the bangs remain in front of it.
opening=[(-.30,1.17),(-.58,1.31),(-.72,1.58),(-.76,1.96),(-.71,2.33),(-.51,2.57),(-.25,2.67),(0,2.70),(.25,2.67),(.51,2.57),(.71,2.33),(.76,1.96),(.72,1.58),(.58,1.31),(.30,1.17),(0,1.13)]
verts=[]
for scale,y in [(1,-.28),(1.13,-.16),(1.10,.22),(.81,.57),(.04,.68)]:
    verts.extend([(x*scale,y,1.94+(z-1.94)*scale) for x,z in opening])
n=len(opening)
faces=[(r*n+i,r*n+(i+1)%n,(r+1)*n+(i+1)%n,(r+1)*n+i) for r in range(4) for i in range(n)]
faces.append(tuple(range(4*n,5*n)))
mesh=bpy.data.meshes.new('fabric hood shell')
mesh.from_pydata(verts,[],faces)
mesh.update()
obj=bpy.data.objects.new('Raised fabric hood',mesh)
scene.collection.objects.link(obj)
obj.data.materials.append(hood_cloth)
bpy.ops.object.select_all(action='DESELECT')
obj.select_set(True)
bpy.context.view_layer.objects.active=obj
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.mesh.normals_make_consistent(inside=False)
bpy.ops.object.mode_set(mode='OBJECT')
mod=obj.modifiers.new('soft fabric','SUBSURF')
mod.levels=2
bpy.ops.object.modifier_apply(modifier=mod.name)
mod=obj.modifiers.new('cloth thickness','SOLIDIFY')
mod.thickness=.025
bpy.ops.object.modifier_apply(modifier=mod.name)
for poly in obj.data.polygons: poly.use_smooth=True
parent(obj,head)
obj.select_set(False)
tube('Hood opening hem',[(x,-.295,z) for x,z in opening[:15]],.028,hood_cloth)
tube('Crown stitched seam',[(0,.04,2.73),(0,.22,2.74),(0,.53,2.50)],.006,seam)

# A tapered torso with rounded sleeves and overlapping padded hood folds.
cushion('Sweatshirt torso',[(-.44,1.03),(-.66,.85),(-.68,.20),(-.60,.02),(.60,.02),(.68,.20),(.66,.85),(.44,1.03)],.04,.29,cloth,body)
for side in [-1,1]:
    sleeve=sphere('Sleeve',(side*.59,.04,.48),(.23,.29,.50),cloth,body)
    sleeve.rotation_euler.y=side*-.23
    cushion('Draped neckline',[(side*.15,1.07),(side*.33,1.19),(side*.48,1.10),(side*.38,.91),(side*.20,.79)],-.19,.055,hood_cloth,body)
    tube('Drawstring',[(side*.20,-.33,1.02),(side*.23,-.345,.72),(side*.21,-.33,.38)],.016,shirt,body)
    sphere('Drawstring tip',(side*.21,-.33,.37),(.017,.017,.048),seam,body,16,12)
    tube('Sleeve crease',[(side*.56,-.20,.76),(side*.46,-.26,.55),(side*.49,-.28,.33)],.012,seam,body)
cushion('T shirt',[(-.20,1.03),(-.23,.82),(-.11,.59),(.11,.59),(.23,.82),(.20,1.03)],-.25,.045,shirt,body)
tube('Collar',[(-.19,-.31,1.02),(-.14,-.335,.92),(0,-.35,.89),(.14,-.335,.92),(.19,-.31,1.02)],.022,seam,body)
tube('Front zipper',[(0,-.305,.86),(0,-.32,.55),(0,-.32,.18)],.010,shirt,body)

head.location.z -= .07

# Merge static pieces by material within each rig to keep draw calls small.
for rig in [body,head,bpy.data.objects['EyeLeft'],bpy.data.objects['EyeRight']]:
    groups={}
    for obj in list(rig.children):
        if obj.type=='MESH':
            groups.setdefault(obj.data.materials[0].name,[]).append(obj)
    for name,objects in groups.items():
        bpy.ops.object.select_all(action='DESELECT')
        for obj in objects: obj.select_set(True)
        bpy.context.view_layer.objects.active=objects[0]
        bpy.ops.object.join()
        objects[0].name=f'{rig.name} · {name}'

bpy.ops.object.select_all(action='DESELECT')
bpy.ops.export_scene.gltf(filepath=str(OUT/'hoodie-character.glb'),export_format='GLB',export_yup=True)
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'hoodie-character.blend'))

scene.render.engine='BLENDER_EEVEE'
scene.render.resolution_x=900
scene.render.resolution_y=1184
scene.render.resolution_percentage=100
scene.render.film_transparent=True
scene.view_settings.view_transform='Standard'
scene.world=bpy.data.worlds.new('Studio ambient')
scene.world.use_nodes=True
scene.world.node_tree.nodes.get('Background').inputs[0].default_value=(.55,.58,.65,1)
scene.world.node_tree.nodes.get('Background').inputs[1].default_value=.55
def light(loc,power,size):
    bpy.ops.object.light_add(type='AREA',location=loc)
    o=bpy.context.object
    o.data.energy=power
    o.data.shape='DISK'
    o.data.size=size
    o.rotation_euler=(Vector((0,0,1.5))-o.location).to_track_quat('-Z','Y').to_euler()
light((-3,-4,6),420,5)
light((3,-2,3),150,4)
bpy.ops.object.camera_add(location=(0,-7,1.37))
camera=bpy.context.object
camera.rotation_euler=(math.pi/2,0,0)
camera.data.type='ORTHO'
camera.data.ortho_scale=2.91
scene.camera=camera
for name,angle,nod in [('front',0,0),('left',-.38,.09),('right',.38,-.09)]:
    head.rotation_euler=(nod,0,angle)
    scene.render.filepath=str(OUT/f'{name}.png')
    bpy.ops.render.render(write_still=True)
print('Sculpted character exported to',OUT)
