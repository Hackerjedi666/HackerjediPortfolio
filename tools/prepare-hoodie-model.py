"""Prepare a textured, volumetric character from the existing artwork.

Python dependencies: numpy, Pillow, opencv-python-headless.
Usage: python tools/prepare-hoodie-model.py /tmp/hoodie-3d-build
Then run Blender with tools/assemble-hoodie-model.py (see its header).

This is a front-projected character model, not a collection of pose cards:
the head and torso have closed front/back geometry and independent pivots.
The source does not describe hidden surfaces; those use the hoodie/hair
colours. Keep the tracking range within the intended front three-quarter view.
"""
import json
from pathlib import Path
import sys
import cv2
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = Path(sys.argv[1])
OUT.mkdir(parents=True, exist_ok=True)
W, H, SCALE = 330, 434, 1 / 165
art = np.array(Image.open(ROOT / "public/brand/hoodie-atlas.webp").convert("RGBA").crop((0, 0, W, H)))
original = art.copy()

# Preserve the character's lids and draw the pupil/iris on independent
# small curved meshes. Fill the vacated iris with its surrounding sclera.
eye_masks = []
for left, right in [(94, 137), (168, 220)]:
    mask = np.zeros((H, W), np.uint8)
    for y in range(176, 201):
        row = original[y, left:right, :3]
        dark = row.max(axis=1) < 160
        xs = np.flatnonzero(dark)
        if not len(xs):
            continue
        lo, hi = left + xs.min(), left + xs.max()
        mask[y, lo:hi + 1] = 255
        # The white eye has a little gray shadow just below its upper lid.
        surrounding = np.r_[original[y, max(left, lo - 3):lo, :3], original[y, hi + 1:min(right, hi + 4), :3]]
        white = surrounding.mean(axis=0) if len(surrounding) else np.array([226, 229, 224])
        art[y, lo:hi + 1, :3] = white.astype(np.uint8)
    eye_masks.append(mask)

Image.fromarray(original).save(OUT / "original.png")
Image.fromarray(art).save(OUT / "surface.png")

# Follow the actual inked jaw rather than approximating it with a polygon.
r, g, b = [original[:, :, i].astype(float) for i in range(3)]
skin_pixels = ((r > 120) & (r > g * 1.04) & (g > b * 1.06)).astype(np.uint8)
_, labels, stats, _ = cv2.connectedComponentsWithStats(skin_pixels)
face_ids = [i for i, stat in enumerate(stats) if i and stat[4] > 100 and 100 < stat[1] < 200]
face_mask = np.isin(labels, face_ids)
face_hull = cv2.convexHull(np.argwhere(face_mask)[:, ::-1].astype(np.int32))
face_mask = np.zeros((H, W), np.uint8)
cv2.fillConvexPoly(face_mask, face_hull, 1)
xs, limits = [], []
for x in range(W):
    ys = np.flatnonzero(face_mask[:, x])
    if len(ys) and ys.max() > 165:
        xs.append(x)
        limits.append(ys.max() + 2)
lower = np.interp(np.arange(W), xs, limits, left=180, right=180)
head_mask = original[:, :, 3].copy()
head_mask[np.arange(H)[:, None] > lower] = 0
body_mask = original[:, :, 3].copy()
body_mask[head_mask > 0] = 0
body_mask[:242] = 0

# Smooth horizontal widths prevent little outline pixels from putting
# ripples in the rounded head's depth.
distance = cv2.distanceTransform((head_mask > 20).astype(np.uint8), cv2.DIST_L2, cv2.DIST_MASK_PRECISE)
distance = cv2.GaussianBlur(distance, (5, 5), 1)


def point(x, y, part, back=False):
    if part == "head":
        d = distance[int(np.clip(y, 0, H - 1)), int(np.clip(x, 0, W - 1))]
        depth = .54 * np.sqrt(max(0, (d - .5) / distance.max()))
        if back:
            depth *= .85
    else:
        rx = np.clip((x - 165) / 170, -1, 1)
        depth = .34 * np.sqrt(max(0, 1 - rx * rx))
    return [(x - W / 2) * SCALE, float(depth if back else -depth), (H - y) * SCALE]


def mesh(name, mask, part, closed=True, step=5, offset=0):
    binary = ((mask > 20) * 255).astype(np.uint8)
    probe_mask = cv2.dilate(binary, np.ones((3, 3), np.uint8))
    contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    points = set()
    for contour in contours:
        for x, y in cv2.approxPolyDP(contour, .35, True).reshape(-1, 2):
            points.add((float(x), float(y)))
    for y in range(1, H - 1, step):
        for x in range(1, W - 1, step):
            if binary[y, x]:
                points.add((float(x), float(y)))
    points = sorted(points)
    subdiv = cv2.Subdiv2D((0, 0, W, H))
    subdiv.insert(points)
    triangles = subdiv.getTriangleList().reshape(-1, 3, 2)
    lookup = {p: i for i, p in enumerate(points)}
    faces = []
    for tri in triangles:
        probes = [tri.mean(axis=0), (tri[0] + tri[1]) / 2, (tri[1] + tri[2]) / 2, (tri[2] + tri[0]) / 2]
        if not all(0 <= p[0] < W and 0 <= p[1] < H and probe_mask[int(round(p[1])), int(round(p[0]))] for p in probes):
            continue
        ids = [lookup.get(tuple(p)) for p in tri]
        if all(i is not None for i in ids):
            # Pixel y points DOWN, Blender z points UP: orient toward -Y.
            faces.append(ids[::-1])
    vertices = [point(x, y, part) for x, y in points]
    for vertex in vertices:
        vertex[1] -= offset
    uv = [[x / W, 1 - y / H] for x, y in points]
    materials = [0] * len(faces)
    if closed:
        n = len(vertices)
        vertices += [point(x, y, part, True) for x, y in points]
        uv += uv.copy()
        front = faces.copy()
        faces += [[i + n for i in face[::-1]] for face in front]
        materials += [1] * len(front)
        edges = {}
        for a, b, c in front:
            for i, j in [(a, b), (b, c), (c, a)]:
                key = tuple(sorted((i, j)))
                edges[key] = edges.get(key, []) + [(i, j)]
        for edge in edges.values():
            if len(edge) == 1:
                a, b = edge[0]
                faces += [[b, a, a + n], [b, a + n, b + n]]
                materials += [1, 1]
    return dict(name=name, vertices=vertices, uv=uv, faces=faces, materials=materials)


parts = [mesh("HeadSurface", head_mask, "head"), mesh("HoodieSurface", body_mask, "body")]
for name, mask in zip(["EyeLeft", "EyeRight"], eye_masks):
    # Clearance for lateral eye travel across the curved face: a decal only
    # .005 units above the surface intersects it as soon as it looks inward.
    parts.append(mesh(name, mask, "head", closed=False, step=2, offset=.035))
data = dict(parts=parts, headPivot=[0, 0, (H - 254) * SCALE], bodyPivot=[0, 0, .3])
(OUT / "geometry.json").write_text(json.dumps(data, separators=(",", ":")))
print(f"Prepared {sum(len(p['faces']) for p in parts):,} triangles")
