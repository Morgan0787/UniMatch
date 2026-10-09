"""Original UniMatch Light Atlas. Blender 4.3+, no add-ons or external assets.

blender -b -t 6 --python assets/hero/unimatch/source/create_scene.py -- --mode keys
Modes: keys (scene + key renders), preview (24 small frames), full (120 frames).
Every mode reconstructs the same deterministic, editable scene from scratch.
"""
import argparse
import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
ARGS = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
parser = argparse.ArgumentParser()
parser.add_argument('--mode', choices=['keys', 'preview', 'full'], default='keys')
parser.add_argument('--size', type=int, default=960)
opts = parser.parse_args(ARGS)
FRAMES = 120

bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
for block in list(bpy.data.materials):
    bpy.data.materials.remove(block)

scene = bpy.context.scene
scene.frame_start, scene.frame_end = 1, FRAMES
scene.render.fps = 24
scene.render.engine = 'CYCLES'
scene.cycles.samples = 12
scene.cycles.use_denoising = False
scene.cycles.max_bounces = 2
scene.cycles.use_adaptive_sampling = True
scene.render.film_transparent = True
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGBA'
scene.render.image_settings.color_depth = '8'
scene.view_settings.view_transform = 'AgX'
scene.world.color = (0.008, 0.012, 0.03)
scene.render.resolution_x = scene.render.resolution_y = opts.size
scene.render.resolution_percentage = 100

def material(name, rgb, power):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    nodes.clear()
    out = nodes.new('ShaderNodeOutputMaterial')
    glow = nodes.new('ShaderNodeEmission')
    glow.inputs['Color'].default_value = (*rgb, 1)
    glow.inputs['Strength'].default_value = power
    mat.node_tree.links.new(glow.outputs[0], out.inputs['Surface'])
    return mat

pearl = material('01 · Lavender pearl / knowledge', (0.49, 0.43, 1.0), 3.0)
teal = material('02 · Glacial cyan / pathways', (0.11, 0.72, 1.0), 3.0)
gold = material('03 · Champagne / destinations', (1.0, 0.62, 0.24), 3.5)

book, routes, destinations = [], [], []
# Four gently arched leaf layers on each side of a continuous spine.
for layer in range(4):
    for side in (-1, 1):
        for row in range(19):
            v = row / 18
            for col in range(27):
                u = col / 26
                x = side * (0.04 + 2.10 * u)
                y = (v - 0.5) * 3.05
                z = -0.38 + layer * 0.075 + 0.46 * math.sin(u * math.pi * 0.78)
                z += 0.13 * (2 * v - 1) ** 2 * u
                book.append((x, y, z))
# Finer luminous page edges make the open atlas legible at phone size.
for side in (-1, 1):
    for layer in range(4):
        for i in range(110):
            u = i / 109
            for y in (-1.525, 1.525):
                book.append((side * (0.04 + 2.10 * u), y,
                             -0.38 + layer * 0.075 + 0.46 * math.sin(u * math.pi * 0.78) + 0.13 * u))

endpoints = [(-3.10, 0.75, 1.70), (-1.65, 1.55, 2.55), (0.0, 1.85, 2.90),
             (1.85, 1.30, 2.40), (3.10, 0.15, 1.65)]
for j, endpoint in enumerate(endpoints):
    start = Vector(((j - 2) * 0.45, -0.15 + j * 0.08, -0.05))
    end = Vector(endpoint)
    for strand in range(2):
        for i in range(90):
            t = i / 89
            p = start.lerp(end, t)
            p.z += math.sin(t * math.pi) * 0.92
            p.y -= math.sin(t * math.pi) * 0.22
            p.x += (strand - 0.5) * 0.035
            routes.append((tuple(p), tuple(start.lerp(Vector(((-1 if j < 2 else 1) * 1.9,
                                                        (t - 0.5) * 2.6, 0.05)), t))))
    for i in range(90):
        z = 1 - 2 * (i + 0.5) / 90
        a = i * math.pi * (3 - math.sqrt(5))
        r = math.sqrt(1 - z*z)
        offset = Vector((r * math.cos(a), r * math.sin(a), z)) * 0.12
        destinations.append((tuple(end + offset), tuple(start + offset)))

def sphere_points(count, seed):
    points = []
    for i in range(count):
        z = 1 - 2 * (i + 0.5) / count
        a = i * math.pi * (3 - math.sqrt(5)) + seed
        radius = 1.74 + 0.06 * math.sin(a * 4)
        r = math.sqrt(1 - z*z)
        points.append((radius * r * math.cos(a), radius * r * math.sin(a), radius * z + 0.38))
    return points

def cloud(name, target_book, target_routes, mat, radius, seed):
    initial = sphere_points(len(target_book), seed)
    mesh = bpy.data.meshes.new(name + ' · point lattice')
    mesh.from_pydata(initial, [], [])
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    scene.collection.objects.link(obj)
    obj.shape_key_add(name='Sphere')
    key_book = obj.shape_key_add(name='Open atlas')
    key_routes = obj.shape_key_add(name='Learning pathways')
    key_routes.relative_key = key_book
    for i, p in enumerate(target_book):
        key_book.data[i].co = p
    for i, p in enumerate(target_routes):
        key_routes.data[i].co = p
    # Same particles survive every state; only continuous shape-key weights change.
    for frame, weight in [(1, 0), (10, 0), (48, 1), (85, 1), (114, 0), (120, 0)]:
        key_book.value = weight
        key_book.keyframe_insert('value', frame=frame)
    for frame, weight in [(1, 0), (39, 0), (68, 1), (78, 1), (102, 0), (120, 0)]:
        key_routes.value = weight
        key_routes.keyframe_insert('value', frame=frame)
    modifier = obj.modifiers.new('Editable particle instances', 'NODES')
    group = bpy.data.node_groups.new(name + ' · particles', 'GeometryNodeTree')
    group.interface.new_socket(name='Geometry', in_out='INPUT', socket_type='NodeSocketGeometry')
    group.interface.new_socket(name='Geometry', in_out='OUTPUT', socket_type='NodeSocketGeometry')
    modifier.node_group = group
    n, links = group.nodes, group.links
    source = n.new('NodeGroupInput')
    source.location = (-500, 150)
    ico = n.new('GeometryNodeMeshIcoSphere')
    ico.location = (-500, -100)
    ico.inputs['Radius'].default_value = radius
    ico.inputs['Subdivisions'].default_value = 1
    set_mat = n.new('GeometryNodeSetMaterial')
    set_mat.location = (-270, -100)
    set_mat.inputs['Material'].default_value = mat
    inst = n.new('GeometryNodeInstanceOnPoints')
    inst.location = (0, 150)
    output = n.new('NodeGroupOutput')
    output.location = (250, 150)
    links.new(source.outputs['Geometry'], inst.inputs['Points'])
    links.new(ico.outputs['Mesh'], set_mat.inputs['Geometry'])
    links.new(set_mat.outputs['Geometry'], inst.inputs['Instance'])
    links.new(inst.outputs['Instances'], output.inputs['Geometry'])
    for f, angle in [(1, -0.10), (48, 0.07), (78, 0.07), (120, -0.10)]:
        obj.rotation_euler.z = angle
        obj.keyframe_insert('rotation_euler', frame=f)
    obj['design_note'] = 'One continuous point cloud: sphere → atlas → pathways → sphere.'
    return obj

cloud('ATLAS · leaves', book, book, pearl, 0.0125, 0.0)
cloud('PATHS · five possible futures', [p[1] for p in routes], [p[0] for p in routes], teal, 0.016, 0.7)
cloud('BEACONS · opportunities', [p[1] for p in destinations], [p[0] for p in destinations], gold, 0.024, 1.6)

bpy.ops.object.camera_add(location=(5.3, -10.8, 7.8))
camera = bpy.context.object
camera.name = 'CAMERA · single shared composition'
camera.rotation_euler = (Vector((0, 0, 0.80)) - camera.location).to_track_quat('-Z', 'Y').to_euler()
camera.data.type = 'ORTHO'
camera.data.ortho_scale = 8.3
scene.camera = camera
bpy.ops.object.light_add(type='AREA', location=(0, -4, 6))
bpy.context.object.name = 'LIGHT · shared softbox'
bpy.context.object.data.energy = 250
bpy.context.object.data.shape = 'DISK'
bpy.context.object.data.size = 5

# Optical glow with transparent outer fringes, not an opaque black rectangle.
scene.use_nodes = True
n, links = scene.node_tree.nodes, scene.node_tree.links
n.clear()
render = n.new('CompositorNodeRLayers')
glare = n.new('CompositorNodeGlare')
glare.glare_type = 'FOG_GLOW'
glare.quality = 'HIGH'
glare.threshold = 1
glare.size = 7
glare.mix = 0
luminance = n.new('CompositorNodeRGBToBW')
maximum = n.new('CompositorNodeMath')
maximum.operation = 'MAXIMUM'
alpha = n.new('CompositorNodeSetAlpha')
alpha.mode = 'REPLACE_ALPHA'
composite = n.new('CompositorNodeComposite')
links.new(render.outputs['Image'], glare.inputs['Image'])
links.new(glare.outputs['Image'], luminance.inputs['Image'])
links.new(render.outputs['Alpha'], maximum.inputs[0])
links.new(luminance.outputs[0], maximum.inputs[1])
links.new(glare.outputs['Image'], alpha.inputs['Image'])
links.new(maximum.outputs[0], alpha.inputs['Alpha'])
links.new(alpha.outputs['Image'], composite.inputs['Image'])
for i, node in enumerate(n):
    node.location = (i * 220, 0)

for name, frame in [('SPHERE', 1), ('UNFOLD', 28), ('ATLAS', 48), ('PATHWAYS', 73), ('RECONVERGE', 102), ('SPHERE AGAIN', 120)]:
    scene.timeline_markers.new(name, frame=frame)
scene['art_direction'] = 'UniMatch Light Atlas. Original procedural geometry, no borrowed models, no text in renders.'
scene['seed'] = 0
scene.frame_set(1)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'unimatch-light-atlas.blend'))

if opts.mode == 'keys':
    frames = [1, 28, 48, 73, 102, 120]
    out = ROOT / 'previews' / 'keys'
elif opts.mode == 'preview':
    frames = list(range(1, 121, 5))
    out = ROOT / 'previews' / 'draft'
    scene.render.resolution_x = scene.render.resolution_y = 480
    scene.cycles.samples = 8
else:
    frames = list(range(1, 121))
    out = ROOT / 'renders'
out.mkdir(parents=True, exist_ok=True)
for frame in frames:
    scene.frame_set(frame)
    scene.render.filepath = str(out / f'frame-{frame:04d}.png')
    bpy.ops.render.render(write_still=True)
    print(f'UNIMATCH_RENDER {opts.mode} {frame}/{FRAMES}', flush=True)
print('UNIMATCH_SCENE_OK', flush=True)
