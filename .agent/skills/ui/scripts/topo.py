"""Generate a topographic contour-map SVG with one clear summit.

Usage: python3 topo.py out.svg [--seed 7] [--summit 1250,320] [--width 1600] [--height 1000]
                               [--levels 40] [--color "#e9dfd2"]
Needs numpy and matplotlib. Every fifth line is an "index contour" (stronger), like a real map.
Overlay a route with an <svg> of the same viewBox and preserveAspectRatio="xMidYMid slice".
"""
import argparse
import numpy as np
import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt

p = argparse.ArgumentParser()
p.add_argument("out")
p.add_argument("--seed", type=int, default=7)
p.add_argument("--summit", default="1250,320")
p.add_argument("--width", type=int, default=1600)
p.add_argument("--height", type=int, default=1000)
p.add_argument("--levels", type=int, default=40)
p.add_argument("--color", default="#e9dfd2")
a = p.parse_args()

W, H = a.width, a.height
nx, ny = W // 4, H // 4
rng = np.random.default_rng(a.seed)
X, Y = np.meshgrid(np.linspace(0, W, nx), np.linspace(0, H, ny))


def noise(scale, amp):
    """Smooth random terrain: white noise low-pass filtered in frequency space."""
    F = np.fft.fft2(rng.normal(size=(ny, nx)))
    k = np.sqrt(np.fft.fftfreq(nx)[None, :] ** 2 + np.fft.fftfreq(ny)[:, None] ** 2)
    g = np.real(np.fft.ifft2(F * np.exp(-((k * scale) ** 2))))
    return amp * g / g.std()


def hill(cx, cy, s, amp):
    return amp * np.exp(-((X - cx) ** 2 + (Y - cy) ** 2) / (2 * s**2))


sx, sy = map(float, a.summit.split(","))
Z = noise(110, 1.0) + noise(45, 0.22)
Z += hill(sx, sy, 210 * W / 1600, 3.2) + hill(sx - 150 * W / 1600, sy - 80, 130, 0.8)  # the summit
Z += hill(W * 0.2, H * 0.82, 300, -1.6) + hill(W * 0.45, H * 0.64, 240, -0.7)          # valleys where text sits

cs = plt.contour(X, Y, Z, levels=np.linspace(Z.min(), Z.max(), a.levels))
paths = []
for i, segs in enumerate(cs.allsegs):
    d = [
        "M" + " ".join(f"{x:.0f} {y:.0f}" for x, y in s[::2])
        for s in segs
        if len(s) >= 6 and np.ptp(s[:, 0]) + np.ptp(s[:, 1]) >= 90  # drop tiny loops: they read as noise
    ]
    if d:
        strong = i % 5 == 0
        paths.append(f'<path d="{" ".join(d)}" stroke-opacity="{0.42 if strong else 0.16}" stroke-width="{1.3 if strong else 0.9}"/>')

svg = (
    f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" fill="none" stroke="{a.color}" '
    f'stroke-linejoin="round" stroke-linecap="round">{"".join(paths)}</svg>'
)
open(a.out, "w").write(svg)
print(f"{a.out}: {len(svg) // 1024} KB, summit at {sx:.0f},{sy:.0f}")
