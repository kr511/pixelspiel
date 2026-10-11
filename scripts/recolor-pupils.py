"""Recolor the six pupil looks in the v07 walk sheets into two extra variants (clothes and some hair).

Writes public/characters/neighbors-{front,back,side,side-step}-v07-alt{1,2}.png; run: python3 scripts/recolor-pupils.py
"""
import os, sys
from PIL import Image
import numpy as np
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'public', 'characters') + os.sep
OUT = sys.argv[1] if len(sys.argv) > 1 else ROOT
ATLAS = {
 'front': [[[233,5,98,208],[469,3,95,211],[692,6,111,208],[922,4,102,210]],[[230,218,101,201],[468,217,98,202],[692,218,105,201],[923,216,98,203]],[[234,422,104,203],[466,419,97,206],[685,421,124,204],[925,419,100,205]],[[236,630,101,201],[468,627,100,203],[702,628,97,203],[925,626,98,205]],[[234,835,105,190],[467,831,90,194],[687,835,130,190],[924,831,99,195]],[[232,1029,103,213],[468,1026,96,216],[700,1030,98,212],[926,1027,97,216]]],
 'back': [[[213,12,99,209],[474,7,95,214],[710,11,115,210],[967,10,99,211]],[[213,236,97,201],[474,227,96,210],[718,234,97,203],[971,230,89,207]],[[216,444,99,185],[470,440,95,189],[711,443,113,186],[965,443,98,186]],[[216,640,102,187],[468,632,97,195],[718,640,100,187],[971,634,91,193]],[[213,833,105,189],[466,831,100,191],[705,832,124,190],[963,833,102,189]],[[214,1034,104,201],[468,1026,102,210],[714,1033,103,202],[967,1026,99,210]]],
 'side': [[[184,7,104,220],[461,4,83,223],[722,8,109,219],[980,6,87,221]],[[187,238,105,220],[455,236,89,224],[721,241,94,219],[985,237,82,223]],[[167,466,121,217],[440,464,111,220],[704,467,132,216],[971,466,106,217]],[[168,695,127,221],[435,694,118,222],[702,698,113,219],[969,692,113,224]]],
 'side-step': [[[128,21,237,408],[541,10,239,418],[984,20,262,407],[1428,12,232,417]],[[123,456,238,397],[541,445,252,411],[984,453,237,401],[1430,443,242,409]]],
}
ROWS = {'front': 3, 'back': 3, 'side': 2, 'side-step': 1}  # walk steps per row pair
CHARS = {'one': (0,0), 'two': (3,0), 'three': (2,0), 'four': (1,1), 'five': (0,1), 'six': (2,1)}
# Regions: hue band (lo, hi) degrees (wrap allowed), min/max saturation, value range, vertical band of the frame.
REGIONS = {
 'one':   {'top': ((335, 20), .28, 1, .4, 1, .34, .70), 'hair': ((8, 32), .38, 1, .2, .66, 0, .45)},
 'two':   {'top': ((195, 265), .12, 1, .1, 1, .30, .72)},
 'three': {'top': ((19, 50), .4, 1, .25, .76, .38, .80), 'hair': ((0, 19), .45, 1, .12, .7, 0, .64)},
 'four':  {'top': ((120, 230), .06, 1, .15, .9, .30, .70), 'hair': ((12, 45), .38, 1, .3, .82, 0, .3)},
 'five':  {'top': ((310, 360), .18, 1, .15, 1, .32, .70)},
 'six':   {'top': ((30, 58), .42, 1, .45, 1, .22, .74), 'hair': ((8, 30), .35, 1, .15, .62, 0, .36)},
}
# (hue, saturation factor, value factor) or None to keep the hue
VARIANTS = {
 1: {'one': {'top': (178, .9, .95), 'hair': (38, .75, 1.45)}, 'two': {'top': (352, 1.9, 1.5)}, 'three': {'top': (95, .7, .9), 'hair': (22, .55, .6)},
     'four': {'top': (222, 2.2, .9), 'hair': (14, 1.35, .75)}, 'five': {'top': (40, 1.7, 1.6)}, 'six': {'top': (4, 1.0, .8), 'hair': (None, .4, .5)}},
 2: {'one': {'top': (268, .65, 1.05), 'hair': (None, .35, .45)}, 'two': {'top': (140, 2.2, 1.6)}, 'three': {'top': (212, .75, .95), 'hair': (40, .7, 1.4)},
     'four': {'top': (25, 2.3, 1.0), 'hair': (20, .75, .38)}, 'five': {'top': (205, 1.3, 1.7)}, 'six': {'top': (None, .12, .95), 'hair': (12, 1.3, 1.05)}},
}
def rgb_to_hsv(a):
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    mx = a[..., :3].max(-1); mn = a[..., :3].min(-1); d = mx - mn + 1e-6
    h = np.where(mx == r, ((g - b) / d) % 6, np.where(mx == g, (b - r) / d + 2, (r - g) / d + 4)) * 60
    return h, (mx - mn) / (mx + 1e-6), mx
def hsv_to_rgb(h, s, v):
    h = (h % 360) / 60; i = np.floor(h).astype(int) % 6; f = h - np.floor(h)
    p, q, t = v * (1 - s), v * (1 - s * f), v * (1 - s * (1 - f))
    out = np.zeros(h.shape + (3,))
    for k, (r, g, b) in enumerate([(v, t, p), (q, v, p), (p, v, t), (p, q, v), (t, p, v), (v, p, q)]):
        m = i == k
        out[..., 0][m], out[..., 1][m], out[..., 2][m] = r[m], g[m], b[m]
    return out
def recolor(crop, char, variant):
    a = crop.astype(np.float32) / 255
    H, S, V = rgb_to_hsv(a); h_ = crop.shape[0]
    rows = (np.arange(h_) / h_)[:, None]
    nh, ns, nv = H.copy(), S.copy(), V.copy()
    for part, (target_h, sf, vf) in VARIANTS[variant][char].items():
        (lo, hi), smin, smax, vmin, vmax, y0, y1 = REGIONS[char][part]
        hue = (H >= lo) & (H <= hi) if lo < hi else (H >= lo) | (H <= hi)
        m = hue & (S >= smin) & (S <= smax) & (V >= vmin) & (V <= vmax) & (rows >= y0) & (rows <= y1) & (a[..., 3] > .5)
        if target_h is not None: nh[m] = target_h
        ns[m] = np.clip(S[m] * sf, 0, 1); nv[m] = np.clip(V[m] * vf, 0, 1)
    rgb = hsv_to_rgb(nh, ns, nv)
    out = crop.copy(); out[..., :3] = np.clip(rgb * 255, 0, 255).astype(np.uint8)
    return out
for variant in VARIANTS:
    for sheet, frames in ATLAS.items():
        im = np.asarray(Image.open(f'{ROOT}neighbors-{sheet}-v07.png').convert('RGBA')).copy()
        for char, (col, row) in CHARS.items():
            for step in range(ROWS[sheet]):
                x, y, w, h = frames[row + step * 2][col]
                im[y:y + h, x:x + w] = recolor(im[y:y + h, x:x + w], char, variant)
        Image.fromarray(im).save(f'{OUT}neighbors-{sheet}-v07-alt{variant}.png', optimize=True)
print('ok')
