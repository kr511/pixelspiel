# Renders the adventure's effect animations as pixel-art sprite sheets.
#
#   "C:\Program Files\Blender Foundation\Blender 5.2\blender.exe" -b --factory-startup --python scripts/blender/render_fx.py
#
# Output (committed, the game never needs Blender at runtime):
#   public/fx/fragment.png         – a spinning memory fragment (16 frames)
#   public/fx/shadow-dissolve.png  – the Shadow breaking apart into light (24 frames)
#   public/fx/heart-burst.png      – little hearts rising (20 frames)
# Each sheet is one row of square frames. Frame counts and sizes are mirrored in game/adventure/fx.ts.
import math
import os
import random
import sys
import tempfile

import bpy
import bmesh
import numpy as np

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
OUT = os.path.join(ROOT, "public", "fx")
os.makedirs(OUT, exist_ok=True)

GOLD = (1.0, 0.62, 0.12, 1)
WARM = (1.0, 0.88, 0.5, 1)
NIGHT = (0.05, 0.025, 0.11, 1)
VIOLET = (0.43, 0.35, 0.64, 1)
RED = (0.62, 0.08, 0.06, 1)
PINK = (0.95, 0.36, 0.42, 1)


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_WORKBENCH"
    scene.render.film_transparent = True
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.view_settings.view_transform = "Standard"
    shading = scene.display.shading
    shading.light = "FLAT"
    shading.color_type = "OBJECT"
    shading.show_object_outline = True
    shading.object_outline_color = (0.11, 0.07, 0.15)
    scene.display.render_aa = "OFF"
    camera_data = bpy.data.cameras.new("camera")
    camera_data.type = "ORTHO"
    camera = bpy.data.objects.new("camera", camera_data)
    scene.collection.objects.link(camera)
    camera.location = (0, -10, 0)
    camera.rotation_euler = (math.pi / 2, 0, 0)
    scene.camera = camera
    return scene, camera_data


def mesh_object(name, build, color):
    mesh = bpy.data.meshes.new(name)
    bm = bmesh.new()
    build(bm)
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new(name, mesh)
    obj.color = color
    bpy.context.scene.collection.objects.link(obj)
    return obj


def cube(bm, size=1.0):
    bmesh.ops.create_cube(bm, size=size)


def octahedron(bm):
    points = [(0, 0, 1.25), (0, 0, -1.25), (0.8, 0, 0), (-0.8, 0, 0), (0, 0.8, 0), (0, -0.8, 0)]
    verts = [bm.verts.new(p) for p in points]
    top, bottom, px, nx, py, ny = verts
    for a, b in ((px, py), (py, nx), (nx, ny), (ny, px)):
        bm.faces.new((top, a, b))
        bm.faces.new((bottom, b, a))


def heart(bm):
    # A flat pixel heart built from unit cubes (11 × 10 grid, like the app icon).
    rows = ["..XX...XX..", ".XXXX.XXXX.", "XXXXXXXXXXX", "XXXXXXXXXXX", ".XXXXXXXXX.", "..XXXXXXX..", "...XXXXX...", "....XXX....", ".....X....."]
    for y, row in enumerate(rows):
        for x, cell in enumerate(row):
            if cell == "X":
                geom = bmesh.ops.create_cube(bm, size=1.0)
                bmesh.ops.translate(bm, verts=geom["verts"], vec=(x - 5, 0, 4 - y))


def render_sheet(scene, name, frames, size):
    scene.render.resolution_x = size
    scene.render.resolution_y = size
    scene.frame_start, scene.frame_end = 1, frames
    folder = tempfile.mkdtemp(prefix=f"fx-{name}-")
    tiles = []
    for frame in range(1, frames + 1):
        scene.frame_set(frame)
        path = os.path.join(folder, f"{frame:03d}.png")
        scene.render.filepath = path
        bpy.ops.render.render(write_still=True)
        image = bpy.data.images.load(path)
        pixels = np.array(image.pixels[:], dtype=np.float32).reshape(size, size, 4)
        tiles.append(pixels)
        bpy.data.images.remove(image)
    sheet = np.concatenate(tiles, axis=1)  # rows are bottom-up in Blender; concatenating columns keeps that intact
    out = bpy.data.images.new(name, width=size * frames, height=size, alpha=True)
    out.pixels = sheet.ravel()
    out.filepath_raw = os.path.join(OUT, f"{name}.png")
    out.file_format = "PNG"
    out.save()
    print(f"[fx] {name}: {frames} frames à {size}px -> {out.filepath_raw}")


def key(obj, frame, **values):
    for attr, value in values.items():
        setattr(obj, attr, value)
        obj.keyframe_insert(data_path=attr, frame=frame)


def fragment():
    scene, cam = reset()
    cam.ortho_scale = 4.2
    gem = mesh_object("gem", octahedron, GOLD)
    core = mesh_object("core", lambda bm: cube(bm, 0.5), WARM)
    frames = 16
    for frame in range(1, frames + 2):
        t = (frame - 1) / frames
        key(gem, frame, rotation_euler=(0.35, 0, t * math.pi), location=(0, 0, 0.12 * math.sin(t * 2 * math.pi)))
        key(core, frame, rotation_euler=(t * math.pi, t * math.pi, 0), location=(0, -1.5, 0.12 * math.sin(t * 2 * math.pi)))
    for index in range(4):
        spark = mesh_object(f"spark{index}", lambda bm: cube(bm, 0.22), WARM)
        for frame in range(1, frames + 2):
            angle = (frame - 1) / frames * 2 * math.pi + index * math.pi / 2
            key(spark, frame, location=(1.45 * math.cos(angle), -1 * math.sin(angle), 0.9 * math.sin(angle * 2) * 0.4))
    render_sheet(scene, "fragment", frames, 96)


def shadow_dissolve():
    scene, cam = reset()
    cam.ortho_scale = 7
    random.seed(7)
    frames = 24
    for index in range(70):
        # Points inside a hooded silhouette (wider at the bottom).
        z = random.uniform(-2.2, 1.6)
        width = 0.55 + (1.6 - z) * 0.32 if z < 0.9 else 0.55
        x = random.uniform(-width, width)
        piece = mesh_object(f"piece{index}", lambda bm: cube(bm, random.uniform(0.36, 0.5)), NIGHT)
        delay = int(abs(x) * 3 + (1.6 - z) * 1.5)
        direction = (x * 0.8 + random.uniform(-0.6, 0.6), 0, random.uniform(1.0, 3.0))
        for frame in range(1, frames + 1):
            p = max(0.0, min(1.0, (frame - 1 - delay) / 12))
            ease = p * p
            color = tuple(NIGHT[i] + (GOLD[i] - NIGHT[i]) * min(1, p * 1.6) for i in range(3)) + (1,)
            key(piece, frame, location=(x + direction[0] * ease * 1.6, 0, z + direction[2] * ease), scale=(1 - p,) * 3, color=color)
    for eye_x in (-0.22, 0.22):
        eye = mesh_object("eye", lambda bm: cube(bm, 0.18), (0.79, 0.71, 1, 1))
        for frame in range(1, frames + 1):
            p = max(0.0, min(1.0, (frame - 1) / 6))
            key(eye, frame, location=(eye_x, -1, 1.1), scale=(1 - p,) * 3)
    render_sheet(scene, "shadow-dissolve", frames, 128)


def heart_burst():
    scene, cam = reset()
    cam.ortho_scale = 6
    random.seed(3)
    frames = 20
    for index in range(5):
        h = mesh_object(f"heart{index}", heart, RED if index % 2 == 0 else PINK)
        base = 0.11 + random.uniform(0, 0.05)
        start_x, drift = random.uniform(-1.6, 1.6), random.uniform(-0.6, 0.6)
        delay = index * 2
        for frame in range(1, frames + 1):
            p = max(0.0, min(1.0, (frame - 1 - delay) / 10))
            s = base * (math.sin(min(1, p * 2.5) * math.pi / 2)) * (1 - max(0, p - 0.75) * 4)
            key(h, frame, location=(start_x + drift * p, 0, -2.2 + 4.2 * p), scale=(max(s, 0.0001),) * 3)
    render_sheet(scene, "heart-burst", frames, 96)


fragment()
shadow_dissolve()
heart_burst()
print("[fx] fertig")
sys.exit(0)
