"""Convert Blender renders to alpha WebP, create previews and exact manifest.
Uses the existing Pillow and FFmpeg installations. No external images.
"""
import argparse
import json
import subprocess
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
PROJECT = ROOT.parents[2]
PUBLIC = PROJECT / 'public/media/unimatch-hero'
parser = argparse.ArgumentParser()
parser.add_argument('--draft', action='store_true')
opts = parser.parse_args()
source = ROOT / ('previews/draft' if opts.draft else 'renders')
files = sorted(source.glob('frame-*.png'))
assert files, f'No renders in {source}'
preview_frames = []
bounds = []
def convert_frame(item):
    index, file = item
    im = Image.open(file).convert('RGBA')
    for folder, size, quality in [('frames', 960, 87), ('mobile', 560, 84)]:
        path = PUBLIC / folder
        output = im if size == 960 else im.resize((size, size), Image.Resampling.LANCZOS)
        output.save(path / f'frame-{index + 1:04d}.webp', quality=quality, method=4, alpha_quality=100)
    print(f'WEBP {index + 1}/{len(files)}', flush=True)

if not opts.draft:
    for folder in ('frames', 'mobile'):
        (PUBLIC / folder).mkdir(parents=True, exist_ok=True)
    with ThreadPoolExecutor(max_workers=4) as executor:
        list(executor.map(convert_frame, enumerate(files)))

for index, file in enumerate(files):
    im = Image.open(file).convert('RGBA')
    alpha = im.getchannel('A').point(lambda a: 255 if a > 8 else 0)
    bounds.append(alpha.getbbox())
    bg = Image.new('RGBA', im.size, '#080e24')
    bg.alpha_composite(im)
    bg = bg.convert('RGB')
    bg.thumbnail((480, 480), Image.Resampling.LANCZOS)
    preview_frames.append(bg)
    if not opts.draft:
        assert im.size == (960, 960)

preview_name = 'draft-preview' if opts.draft else 'preview'
preview_frames[0].save(ROOT / 'previews' / f'{preview_name}.gif', save_all=True,
                      append_images=preview_frames[1:], duration=200 if opts.draft else 42, loop=0)
video_dir = ROOT / 'previews' / 'video-frames'
video_dir.mkdir(exist_ok=True)
for i, im in enumerate(preview_frames):
    im.save(video_dir / f'{i:04d}.png')
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', '5' if opts.draft else '24',
                '-i', str(video_dir / '%04d.png'), '-c:v', 'libx264', '-pix_fmt', 'yuv420p',
                '-crf', '21', '-movflags', '+faststart', str(ROOT / 'previews' / f'{preview_name}.mp4')], check=True)
for file in video_dir.glob('*.png'):
    file.unlink()
video_dir.rmdir()

sheet = Image.new('RGB', (1440, 960), '#080e24')
selected = [round(i * (len(files) - 1) / 5) for i in range(6)]
for i, idx in enumerate(selected):
    sheet.paste(preview_frames[idx], ((i % 3) * 480, (i // 3) * 480))
sheet.save(ROOT / 'previews' / f'{preview_name}-contact-sheet.jpg', quality=92)
if not opts.draft:
    assert len(files) == 120
    assert Image.open(files[0]).tobytes() == Image.open(files[-1]).tobytes(), 'Loop must close exactly'
    manifest = {'name': 'UniMatch Light Atlas', 'frameCount': len(files), 'fps': 24,
                'transparent': True, 'scrollViewportHeights': 3.5,
                'stages': {'sphere': 1, 'atlas': 48, 'routes': 73, 'sphereAgain': 120},
                'variants': {}, 'alphaBounds': bounds}
    for folder, size in [('frames', 960), ('mobile', 560)]:
        outputs = list((PUBLIC / folder).glob('*.webp'))
        assert len(outputs) == 120
        manifest['variants'][folder] = {'width': size, 'height': size, 'totalBytes': sum(p.stat().st_size for p in outputs),
                                       'largestFrameBytes': max(p.stat().st_size for p in outputs)}
    (PUBLIC / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
    Image.open(files[0]).save(PUBLIC / 'poster.webp', quality=87, method=6)
    print(json.dumps(manifest['variants']))
print(f'PACKAGED {len(files)} FRAMES; preview: {preview_name}.mp4')
