"""Build correspondence maps for the original character; never redraw its art.

Run with Python + opencv-python-headless + Pillow installed. The website has
no Python dependency. DIS optical flow aligns matching features BEFORE the
shader blends poses, unlike an ordinary crossfade that produces two faces.

Source: public/brand/hoodie-atlas.webp (the existing 33-pose artwork).
Outputs: repacked artwork, lossless flow data, and the runtime pose grid.
"""
from pathlib import Path
import json
import cv2
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public/brand"
W, H = 330, 434
FW, FH = 96, 126
FLOW_RANGE = 48
LUT = [
    [8,8,6,6,7,9,9,9,9,5,5,10,10,10,10,10,3,3,4,4,4,4,4,11,11,11,12,2,2,2,2,2,0,1,1,29,26,27,27,28,20,20,20,21,21,21,21,19,19,19,19,19,19,14,14,14,18,18,18,18,17,15,16,16],
    [8,8,6,6,7,9,9,9,9,5,5,10,10,10,10,10,3,3,4,4,4,4,4,11,11,11,12,2,2,2,2,2,0,1,1,30,25,25,22,13,13,13,20,21,21,21,21,19,19,19,19,14,14,14,14,14,18,18,18,18,17,16,16,16],
    [8,8,7,7,7,9,9,9,9,5,5,5,10,10,10,10,3,3,4,4,4,4,4,11,11,11,12,2,2,2,2,2,0,32,32,32,31,24,23,13,13,13,20,21,21,21,21,19,19,19,19,14,14,14,14,14,18,18,18,18,17,16,16,16],
]
assert all(len(row) == 64 for row in LUT)

# Collapse repeated columns to their centres. Repeating an identical pose
# across several input bins was the original hold-then-jump behaviour.
runs = []
for x in range(64):
    cell = LUT[1][x]
    if runs and runs[-1][2] == cell:
        runs[-1][1] = x
    else:
        runs.append([x, x, cell])
knots = [(start + end) / 126 for start, end, _ in runs]
knots[0], knots[-1] = 0, 1
grid = [[row[(start + end) // 2] for row in LUT] for start, end, _ in runs]

source = Image.open(OUT / "hoodie-atlas.webp").convert("RGBA")
frames = [np.array(source.crop((i * W, 0, (i + 1) * W, H))) for i in range(33)]
atlas = Image.new("RGBA", (6 * W, 6 * H))
for i, frame in enumerate(frames):
    atlas.paste(Image.fromarray(frame), ((i % 6) * W, (i // 6) * H))
# Lossless avoids another generation of edge/linework compression.
atlas.save(OUT / "hoodie-poses.webp", lossless=True, method=6)

# Composite onto neutral gray for correspondence: transparent RGB is not
# meaningful. The silhouette must participate alongside facial features.
gray = []
for frame in frames:
    alpha = frame[:, :, 3:4].astype(np.float32) / 255
    composite = frame[:, :, :3] * alpha + 80 * (1 - alpha)
    gray.append(cv2.cvtColor(composite.astype(np.uint8), cv2.COLOR_RGB2GRAY))

dis = cv2.DISOpticalFlow_create(cv2.DISOPTICAL_FLOW_PRESET_MEDIUM)
dis.setFinestScale(0)
dis.setGradientDescentIterations(40)
dis.setVariationalRefinementIterations(10)
cache = {}


def flow(a, b):
    if a == b:
        return np.zeros((FH, FW, 2), np.float32)
    if (a, b) not in cache:
        field = dis.calc(gray[a], gray[b], None)
        cache[a, b] = cv2.resize(field, (FW, FH), interpolation=cv2.INTER_AREA)
    return cache[a, b]


patches, fields = [], []
for y in range(2):
    for x in range(len(grid) - 1):
        ids = [grid[x][y], grid[x + 1][y], grid[x][y + 1], grid[x + 1][y + 1]]
        patches.append(ids)
        for corner, cell in enumerate(ids):
            # RG: toward the horizontal neighbour. BA: toward the vertical.
            vectors = np.concatenate((flow(cell, ids[corner ^ 1]), flow(cell, ids[corner ^ 2])), axis=2)
            fields.append(np.round(np.clip(vectors / FLOW_RANGE, -1, 1) * 127 + 128).astype(np.uint8))

rows = (len(fields) + 15) // 16
packed = Image.new("RGBA", (16 * FW, rows * FH), (128, 128, 128, 128))
for i, field in enumerate(fields):
    packed.paste(Image.fromarray(field), ((i % 16) * FW, (i // 16) * FH))
# These are four DATA channels, including alpha. Do not premultiply or
# colour-correct this texture, and do not replace PNG with lossy WebP.
packed.save(OUT / "hoodie-flow.png", optimize=True)

data = dict(knots=knots, patches=patches, artGrid=[6, 6], artCell=[W, H],
            flowGrid=[16, rows], flowCell=[FW, FH], flowRange=FLOW_RANGE)
(ROOT / "lib/generated/hoodie-motion.json").write_text(json.dumps(data, separators=(",", ":")) + "\n")
print(f"Built {len(grid)} yaw knots, {len(patches)} patches, {len(cache)} correspondences")
for name in ("hoodie-poses.webp", "hoodie-flow.png"):
    print(name, (OUT / name).stat().st_size, "bytes")
