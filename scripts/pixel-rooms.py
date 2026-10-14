#!/usr/bin/env python3
"""Pixelgemälde für die Klassenfahrt-Orte (V1.1).

Ersetzt die flachen SVG-Entwürfe aus scripts/trip-scenes.py durch gezeichnete
Pixel-Art im Stil der übrigen Räume: Konturen, Ober- und Schattenkanten,
Texturen, Schlagschatten und Lichtkegel. Gezeichnet wird auf 320×320 Pixeln und
verlustfrei auf 1280×1280 vergrößert, damit die Pixel scharf bleiben.

Möbel und Bauten liegen exakt auf den Hindernissen aus game/story.ts. Wer hier
ein Rechteck verschiebt, muss die Kollision dort mitziehen.

Aufruf: python3 scripts/pixel-rooms.py
"""
import math
import random
from pathlib import Path

from PIL import Image, ImageDraw

OUT = Path(__file__).resolve().parent.parent / "public" / "rooms"
N = 320       # Zeichenfläche
SCALE = 4     # Ausgabe 1280×1280


def rgb(value):
    value = value.lstrip("#")
    return tuple(int(value[i:i + 2], 16) for i in (0, 2, 4))


def shade(color, factor):
    """factor < 1 dunkler, > 1 heller; hellt Richtung Weiß auf statt zu clippen."""
    r, g, b = rgb(color) if isinstance(color, str) else color
    if factor <= 1:
        return tuple(max(0, int(c * factor)) for c in (r, g, b))
    k = factor - 1
    return tuple(min(255, int(c + (255 - c) * k)) for c in (r, g, b))


def mix(a, b, t):
    a = rgb(a) if isinstance(a, str) else a
    b = rgb(b) if isinstance(b, str) else b
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


class Canvas:
    def __init__(self, seed):
        self.img = Image.new("RGB", (N, N), (0, 0, 0))
        self.draw = ImageDraw.Draw(self.img)
        self.rng = random.Random(seed)

    # --- Grundformen in Pixeln -------------------------------------------------
    def rect(self, x0, y0, x1, y1, color):
        x0, y0, x1, y1 = (int(round(v)) for v in (x0, y0, x1, y1))
        if x1 > x0 and y1 > y0:
            self.draw.rectangle((x0, y0, x1 - 1, y1 - 1), fill=rgb(color) if isinstance(color, str) else color)

    def px(self, x, y, color):
        if 0 <= x < N and 0 <= y < N:
            self.img.putpixel((int(x), int(y)), rgb(color) if isinstance(color, str) else color)

    def line(self, points, color, width=1):
        self.draw.line([(int(x), int(y)) for x, y in points], fill=rgb(color) if isinstance(color, str) else color, width=width)

    def ellipse(self, x0, y0, x1, y1, color):
        self.draw.ellipse((int(x0), int(y0), int(x1) - 1, int(y1) - 1), fill=rgb(color) if isinstance(color, str) else color)

    # --- Spielkoordinaten 0..1 -------------------------------------------------
    @staticmethod
    def p(v):
        return v * N

    def box(self, l, t, r, b, color):
        self.rect(self.p(l), self.p(t), self.p(r), self.p(b), color)

    # --- Effekte ----------------------------------------------------------------
    def shadow(self, l, t, r, b, dx=2, dy=3, strength=.55):
        """Weicher Schlagschatten nach rechts unten, vor dem Objekt zeichnen."""
        x0, y0, x1, y1 = (int(round(self.p(v))) for v in (l, t, r, b))
        for y in range(y0 + dy, min(N, y1 + dy)):
            for x in range(x0 + dx, min(N, x1 + dx)):
                if 0 <= x < N and 0 <= y < N:
                    c = self.img.getpixel((x, y))
                    edge = x >= x1 or y >= y1
                    f = strength + (1 - strength) * .45 if edge else strength
                    self.img.putpixel((x, y), tuple(int(v * f) for v in c))

    def light(self, cx, cy, radius, color, strength=.35, steps=10):
        """Lichtkegel in Stufen (Pixel-Art-typische Bänderung)."""
        cx, cy, radius = self.p(cx), self.p(cy), self.p(radius)
        tint = rgb(color)
        for y in range(max(0, int(cy - radius)), min(N, int(cy + radius) + 1)):
            for x in range(max(0, int(cx - radius)), min(N, int(cx + radius) + 1)):
                d = math.hypot(x - cx, y - cy) / radius
                if d >= 1:
                    continue
                band = (math.ceil((1 - d) * steps) / steps) ** 1.6
                a = strength * band
                c = self.img.getpixel((x, y))
                self.img.putpixel((x, y), tuple(min(255, int(c[i] + (tint[i] - c[i] * .35) * a)) for i in range(3)))

    def bevel(self, l, t, r, b, color, outline=None, top_light=1.25, bottom_dark=.7):
        """Fläche mit heller Ober-/Linkskante, dunkler Unter-/Rechtskante und Kontur."""
        x0, y0, x1, y1 = (int(round(self.p(v))) for v in (l, t, r, b))
        self.rect(x0, y0, x1, y1, color)
        self.rect(x0, y0, x1, y0 + 1, shade(color, top_light))
        self.rect(x0, y0, x0 + 1, y1, shade(color, (top_light + 1) / 2))
        self.rect(x0, y1 - 1, x1, y1, shade(color, bottom_dark))
        self.rect(x1 - 1, y0, x1, y1, shade(color, (bottom_dark + 1) / 2))
        self.outline(x0, y0, x1, y1, outline or shade(color, .45))

    def outline(self, x0, y0, x1, y1, color):
        c = rgb(color) if isinstance(color, str) else color
        self.draw.rectangle((x0 - 1, y0 - 1, x1, y1), outline=c)

    def noise(self, l, t, r, b, colors, density=.18):
        x0, y0, x1, y1 = (int(round(self.p(v))) for v in (l, t, r, b))
        for y in range(y0, y1):
            for x in range(x0, x1):
                if self.rng.random() < density:
                    self.px(x, y, self.rng.choice(colors))

    def vignette(self, strength=.22):
        for y in range(N):
            for x in range(N):
                d = math.hypot(x / N - .5, y / N - .5) / .707
                f = 1 - strength * max(0, d - .45) / .55
                c = self.img.getpixel((x, y))
                self.img.putpixel((x, y), tuple(int(v * f) for v in c))

    def save(self, name):
        out = self.img.resize((N * SCALE, N * SCALE), Image.NEAREST)
        path = OUT / name
        out.save(path, "WEBP", lossless=True, quality=100, method=6)
        print(path.relative_to(OUT.parent.parent), path.stat().st_size, "Bytes")


# --- Bausteine -------------------------------------------------------------------

def carpet(c, l, t, r, b, base, seed):
    c.box(l, t, r, b, base)
    rng = random.Random(seed)
    x0, y0, x1, y1 = (int(round(c.p(v))) for v in (l, t, r, b))
    light, dark = shade(base, 1.08), shade(base, .9)
    for y in range(y0, y1):
        for x in range(x0, x1):
            # leichtes Rautenmuster wie Hotelteppich
            if (x + y) % 12 == 0 or (x - y) % 12 == 0:
                c.px(x, y, dark)
            elif rng.random() < .12:
                c.px(x, y, light if rng.random() < .5 else dark)


def wall_band(c, top, bottom, base, seed, stripe=None):
    """Sichtbare Wand oben (Vorderansicht), Tapete mit Streifen und Sockelleiste."""
    c.box(0, top, 1, bottom, base)
    x_step = 9
    for x in range(0, N, x_step):
        c.rect(x, c.p(top), x + 1, c.p(bottom) - 4, stripe or shade(base, .93))
    c.noise(0, top, 1, bottom - .015, [shade(base, 1.04), shade(base, .96)], .08)
    c.rect(0, c.p(bottom) - 4, N, c.p(bottom), "#6b5236")
    c.rect(0, c.p(bottom) - 4, N, c.p(bottom) - 3, "#8a6c48")
    c.rect(0, c.p(bottom) - 1, N, c.p(bottom), "#3e2e1f")


def side_walls(c, base):
    dark = shade(base, .55)
    c.box(0, 0, .075, 1, base)
    c.box(.94, 0, 1, 1, base)
    c.box(0, .92, 1, 1, base)
    for x0, x1 in ((0, .075), (.94, 1)):
        c.noise(x0, 0, x1, 1, [shade(base, 1.06), shade(base, .94)], .1)
    c.noise(0, .92, 1, 1, [shade(base, 1.06), shade(base, .94)], .1)
    # Innenkanten
    c.box(.072, .16, .075, .92, dark)
    c.box(.94, .16, .943, .92, dark)
    c.box(.075, .918, .94, .921, dark)


def window(c, l, t, r, b, view="day"):
    c.bevel(l, t, r, b, "#e9e4d6")
    il, it, ir, ib = l + .012, t + .012, r - .012, b - .012
    sky_top, sky_bottom = ("#8fc3e8", "#cfe6f4") if view == "day" else ("#2c3a5c", "#5a6d93")
    h = int(c.p(ib) - c.p(it))
    for i in range(h):
        c.rect(c.p(il), c.p(it) + i, c.p(ir), c.p(it) + i + 1, mix(sky_top, sky_bottom, i / max(1, h - 1)))
    # Dächer von Kehl und Rhein-Andeutung
    rng = random.Random(7)
    x = c.p(il)
    while x < c.p(ir):
        w = rng.randint(6, 12)
        hh = rng.randint(5, 10)
        c.rect(x, c.p(ib) - hh, min(x + w, c.p(ir)), c.p(ib), rng.choice(["#8c5a4a", "#a46a52", "#7d6a5c"]))
        c.rect(x, c.p(ib) - hh, min(x + w, c.p(ir)), c.p(ib) - hh + 1, "#c48a6a")
        x += w
    c.box((l + r) / 2 - .004, it, (l + r) / 2 + .004, ib, "#e9e4d6")
    c.box(il, (it + ib) / 2 - .004, ir, (it + ib) / 2 + .004, "#e9e4d6")
    # Vorhänge
    for cx in (l - .025, r + .005):
        c.bevel(cx, t - .005, cx + .02, b + .02, "#b9584a")
        for k in range(3):
            c.box(cx + .004 + k * .006, t, cx + .006 + k * .006, b + .015, "#9d4639")


def bed(c, l, t, r, b, blanket, seed, frame="#6b4426"):
    c.shadow(l, t, r, b)
    c.bevel(l, t, r, b, frame)
    # Kopfteil
    c.bevel(l, t, r, t + .035, shade(frame, 1.15))
    # Matratze und Laken
    c.bevel(l + .012, t + .04, r - .012, b - .012, "#f1ece2", outline="#b9b0a0")
    # Kissen
    c.bevel(l + .025, t + .05, r - .025, t + .095, "#ffffff", outline="#c9c2b4")
    c.box(l + .03, t + .085, r - .03, t + .092, "#e3ddd2")
    # Decke mit Falten und Steppnähten
    bt = t + .115
    c.bevel(l + .012, bt, r - .012, b - .012, blanket)
    c.box(l + .012, bt, r - .012, bt + .02, shade(blanket, 1.2))
    c.box(l + .012, bt + .02, r - .012, bt + .024, shade(blanket, .8))
    rng = random.Random(seed)
    for k in range(1, 4):
        y = bt + .03 + k * (b - bt - .05) / 4
        c.box(l + .02, y, r - .02, y + .003, shade(blanket, .85))
    for _ in range(5):
        x = rng.uniform(l + .03, r - .05)
        y = rng.uniform(bt + .04, b - .04)
        c.box(x, y, x + .025, y + .004, shade(blanket, 1.15))
    c.box(l + .012, b - .03, r - .012, b - .012, shade(blanket, .75))


def lamp_glow(c, x, y, r=.07):
    c.light(x, y, r, "#ffd28a", .45)
    c.box(x - .008, y - .008, x + .008, y + .008, "#fff1c4")


def plant(c, x, y, size=.035):
    c.shadow(x - size / 2, y - .005, x + size / 2, y + size / 2, 1, 2, .6)
    c.bevel(x - size / 2.6, y, x + size / 2.6, y + size / 2, "#b4683e")
    rng = random.Random(int(x * 1000 + y * 100))
    for _ in range(14):
        dx, dy = rng.uniform(-size, size) * .7, rng.uniform(-size, 0) * .9
        c.box(x + dx - .006, y + dy - .006, x + dx + .006, y + dy + .006, rng.choice(["#3f7f3a", "#4f9a44", "#2f6a30", "#64ad52"]))


def door_bottom(c, x, label):
    """Tür in der unteren Wand (Blick von oben auf die Schwelle)."""
    c.bevel(x - .055, .915, x + .055, .99, "#7a5a3a")
    c.bevel(x - .045, .92, x + .045, .985, "#a27a4e")
    c.box(x - .045, .95, x + .045, .953, "#8a663f")
    c.box(x + .03, .945, x + .037, .958, "#e8c86a")
    c.box(x - .05, .895, x + .05, .915, "#5c4a3a")   # Fußmatte
    c.noise(x - .05, .895, x + .05, .915, ["#6e5a48", "#4e3e30"], .3)


# --- Räume -------------------------------------------------------------------------

def hotel_shell(c, seed, carpet_color):
    carpet(c, .075, .16, .94, .92, carpet_color, seed)
    wall_band(c, 0, .16, "#e6dcc6", seed)
    side_walls(c, "#4a4652")


def hotel():
    c = Canvas(11)
    hotel_shell(c, 11, "#5f6f88")
    window(c, .40, .02, .60, .14)
    c.light(.5, .2, .22, "#fff4d0", .16)                    # Tageslicht vom Fenster
    # Betten (Hindernisse 0.12–0.30 und 0.32–0.50, je 0.16–0.44)
    bed(c, .12, .16, .30, .44, "#3f8f8a", 1)
    bed(c, .32, .16, .50, .44, "#3f8f8a", 2)
    # Leselampen am Kopfteil
    for x in (.21, .41):
        c.box(x - .004, .1, x + .004, .16, "#3b3a45")
        lamp_glow(c, x, .1, .035)
    # Schreibtisch (0.62–0.88 × 0.16–0.30) mit Fernseher an der Wand
    c.shadow(.62, .16, .88, .30)
    c.bevel(.62, .16, .88, .30, "#7a5236")
    c.box(.63, .17, .87, .175, "#9a6c46")
    c.noise(.63, .18, .87, .29, ["#6e4a30", "#86603e"], .15)
    c.bevel(.67, .02, .83, .135, "#1c1c22")
    c.box(.68, .03, .82, .125, "#2d3b55")
    c.box(.68, .03, .82, .045, "#3e5072")
    c.box(.745, .135, .755, .16, "#2a2a30")
    c.bevel(.64, .19, .69, .215, "#e8e2d4")                 # Notizblock
    c.bevel(.80, .19, .845, .235, "#c9a24a")                # Schlüsselkarte/Mappe
    lamp_glow(c, .84, .2, .03)
    # Koffer (0.70–0.80 × 0.55–0.62)
    c.shadow(.70, .55, .80, .62)
    c.bevel(.70, .55, .80, .62, "#b2453c")
    for x in (.725, .75, .775):
        c.box(x, .555, x + .004, .615, "#8f342d")
    c.box(.735, .535, .765, .55, "#2b211c")
    c.box(.705, .585, .795, .59, "#d06a5f")
    # Teppich
    c.shadow(.30, .58, .62, .80, 1, 1, .8)
    c.bevel(.30, .58, .62, .80, "#8a5a6e")
    c.box(.315, .595, .605, .785, "#9d6b80")
    c.noise(.315, .595, .605, .785, ["#b07d93", "#86566a"], .2)
    for x in range(int(c.p(.30)), int(c.p(.62)), 3):
        c.px(x, c.p(.58) - 1, "#d8c9a8")
        c.px(x, c.p(.80), "#d8c9a8")
    plant(c, .1, .85)
    plant(c, .9, .2, .03)
    for x in (.16, .42, .66):
        door_bottom(c, x, "")
    # Tür rechts (Heimreise) bei y≈0.70
    c.bevel(.94, .62, .99, .78, "#7a5a3a")
    c.bevel(.945, .63, .985, .77, "#a27a4e")
    c.box(.95, .69, .958, .71, "#e8c86a")
    c.vignette(.18)
    c.save("trip-hotel-v11.webp")


def hotelboys():
    c = Canvas(21)
    hotel_shell(c, 21, "#5b6a80")
    window(c, .52, .02, .63, .14, "dusk")
    for i, (l, r) in enumerate(((.10, .26), (.28, .44), (.46, .62))):
        bed(c, l, .16, r, .40, ["#3d6fa8", "#4f8a3c", "#a8573d"][i], 10 + i)
    # zerwühlte Decken
    c.box(.12, .33, .2, .37, "#5a8ac0")
    c.box(.50, .30, .6, .33, "#c06a4e")
    # Kommode mit Fernseher (0.70–0.90 × 0.16–0.28), Pokalspiel läuft
    c.shadow(.70, .16, .90, .28)
    c.bevel(.70, .16, .90, .28, "#7a5236")
    for y in (.2, .24):
        c.box(.71, y, .89, y + .004, "#5e3f29")
        c.box(.79, y + .012, .81, y + .02, "#d8b36a")
    c.bevel(.71, .015, .89, .145, "#18181d")
    c.box(.72, .025, .88, .135, "#2f8a3c")
    for k in range(5):
        c.box(.72 + k * .032, .025, .736 + k * .032, .135, "#339442")
    c.box(.795, .025, .8, .135, "#e8f0e0")
    c.box(.765, .065, .83, .095, "#2f8a3c")
    c.rect(c.p(.775), c.p(.07), c.p(.82), c.p(.09), "#e8f0e0")
    c.rect(c.p(.778), c.p(.073), c.p(.817), c.p(.087), "#2f8a3c")
    c.box(.73, .03, .78, .045, "#101015")                  # Spielstand-Einblendung
    c.box(.735, .034, .755, .041, "#f2eee4")
    c.box(.785, .145, .815, .165, "#2a2a30")
    c.light(.8, .2, .1, "#9ee0a0", .14)
    # Tisch mit Pizzakartons (0.62–0.76 × 0.52–0.60)
    c.shadow(.62, .52, .76, .60)
    c.bevel(.62, .52, .76, .60, "#6b4a30")
    c.bevel(.628, .5, .695, .55, "#d8b37a")
    c.box(.635, .51, .688, .54, "#c79e62")
    c.bevel(.69, .515, .752, .565, "#cfa86c")
    c.box(.697, .522, .745, .558, "#e8c27a")                # offener Karton
    c.ellipse(c.p(.7), c.p(.525), c.p(.742), c.p(.556), "#e0a04a")
    for dx, dy in ((.708, .532), (.725, .54), (.715, .548), (.732, .53)):
        c.box(dx, dy, dx + .006, dy + .006, "#b5452f")
    c.box(.64, .575, .66, .59, "#c94c3c")                  # Getränkedosen
    c.box(.735, .575, .75, .59, "#3a6fb5")
    # Kleidung, Rucksäcke, Schuhe
    c.shadow(.14, .49, .22, .56, 1, 2)
    c.bevel(.145, .49, .215, .56, "#2f3a4a")                 # Rucksack
    c.bevel(.155, .5, .205, .52, "#3e4c60")
    c.box(.152, .53, .158, .555, "#1e2530")
    c.box(.202, .53, .208, .555, "#1e2530")
    c.box(.175, .525, .185, .535, "#c9a24a")
    c.bevel(.80, .70, .88, .76, "#3f5c8a")
    c.box(.82, .69, .86, .705, "#2c4366")
    c.bevel(.3, .82, .33, .835, "#f2f2f2")
    c.bevel(.335, .825, .365, .84, "#f2f2f2")
    for dx, dy, w in ((.52, .78, .07), (.53, .795, .05), (.545, .77, .03)):   # Pulli, zerknüllt
        c.bevel(dx, dy, dx + w, dy + .022, "#c94c3c")
    c.box(.515, .785, .53, .792, "#a83a2c")
    plant(c, .9, .85)
    door_bottom(c, .16, "")
    c.vignette(.22)
    c.save("trip-hotelboys-v11.webp")


def paving(c, l, t, r, b, colors, seed, tile=(10, 6)):
    rng = random.Random(seed)
    x0, y0, x1, y1 = (int(round(c.p(v))) for v in (l, t, r, b))
    c.rect(x0, y0, x1, y1, shade(colors[0], .78))
    tw, th = tile
    for row, y in enumerate(range(y0, y1, th + 1)):
        shift = tw // 2 if row % 2 else 0
        for x in range(x0 - shift, x1, tw + 1):
            col = rng.choice(colors)
            l2, r2 = max(x, x0), min(x + tw, x1)
            if r2 <= l2:
                continue
            c.rect(l2, y, r2, min(y + th, y1), col)
            c.rect(l2, y, r2, y + 1, shade(col, 1.08))


def tree(c, x, y, r=.05, leaves=("#3f7f3a", "#4f9a44", "#2f6a30", "#64ad52"), trunk="#6b4a30"):
    c.shadow(x - r * .8, y - r * .3, x + r * .9, y + r * .9, 3, 4, .6)
    c.box(x - .006, y, x + .006, y + r * .8, trunk)
    rng = random.Random(int(x * 997 + y * 131))
    cx, cy, rr = c.p(x), c.p(y - r * .2), c.p(r)
    for yy in range(int(cy - rr), int(cy + rr) + 1):
        for xx in range(int(cx - rr), int(cx + rr) + 1):
            d = math.hypot(xx - cx, yy - cy) / rr
            if d > 1 or (d > .85 and rng.random() < .5):
                continue
            light = (cx - xx + cy - yy) / (2 * rr)
            idx = 0 if light > .25 else 1 if light > -.1 else 2 if d < .9 else 2
            if rng.random() < .18:
                idx = rng.randrange(len(leaves))
            col = leaves[[3, 1, 0, 2][idx]] if idx < 4 else leaves[0]
            c.px(xx, yy, col)


def lamp_post(c, x, y_base, height=.1, lit=False):
    c.shadow(x - .004, y_base - .01, x + .004, y_base, 2, 2, .6)
    c.box(x - .004, y_base - height, x + .004, y_base, "#34343c")
    c.box(x - .012, y_base - height - .02, x + .012, y_base - height, "#2a2a30")
    c.box(x - .009, y_base - height - .017, x + .009, y_base - height - .004, "#ffe7a6" if lit else "#d8d2b8")
    if lit:
        c.light(x, y_base - .01, .06, "#ffd88a", .3)


def bench(c, l, t, r, b):
    c.shadow(l, t, r, b, 2, 2)
    c.bevel(l, t, r, b, "#8a5a36")
    for k in range(3):
        y = t + (b - t) * (k + .5) / 3
        c.box(l + .003, y, r - .003, y + .002, "#6b4328")


def parliament():
    c = Canvas(31)
    # Himmel
    for y in range(int(c.p(.16))):
        c.rect(0, y, N, y + 1, mix("#9cc9ea", "#dcecf5", y / c.p(.16)))
    for x0, y0, w in ((.24, .03, .08), (.7, .05, .1), (.86, .02, .06)):
        c.box(x0, y0, x0 + w, y0 + .012, "#f4f8fb")
        c.box(x0 + .015, y0 - .008, x0 + w - .02, y0, "#f4f8fb")
    # Platz mit hellem Stein und dunklen Bändern
    paving(c, .18, .16, 1, 1, ["#cdc8bd", "#c6c1b5", "#d4cfc4", "#bfbaae"], 31, (12, 7))
    for y in (.55, .75):
        c.box(.18, y, 1, y + .012, "#9d988c")
    # Die Ill mit Uferkante (Hindernis 0–0.18)
    for y in range(N):
        c.rect(0, y, c.p(.17), y + 1, mix("#3f78a6", "#4f8ab8", (math.sin(y / 9) + 1) / 2))
    rng = random.Random(32)
    for _ in range(90):
        x, y = rng.uniform(.005, .16), rng.uniform(0, 1)
        c.box(x, y, x + rng.uniform(.012, .03), y + .003, rng.choice(["#7fb2d8", "#a6cbe6", "#376a94"]))
    c.box(.165, 0, .19, 1, "#8f8a7f")
    c.box(.165, 0, .17, 1, "#b2ada2")
    c.box(.186, 0, .19, 1, "#6d695f")
    # Gebäude: geschwungene Glasfassade (Hindernis 0.20–0.80 × 0.16–0.40), Rundturm dahinter
    c.box(.34, 0, .66, .08, "#56738a")
    for i in range(12):
        x = .345 + i * .026
        c.box(x, 0, x + .02, .075, "#7e9cb2" if i % 2 else "#6c8ba3")
    for y in (.02, .045, .07):
        c.box(.34, y, .66, y + .004, "#3f5568")
    c.box(.34, .075, .66, .085, "#3a4c5c")
    c.shadow(.20, .06, .80, .40, 3, 4, .55)
    c.box(.20, .06, .80, .40, "#4e6d86")
    for i in range(24):
        x = .205 + i * .0245
        center = 1 - abs((x + .012) - .5) / .3                     # Wölbung: Mitte heller
        col = mix("#5f84a2", "#a9c8de", max(0, center) * .8)
        c.box(x, .07, x + .02, .39, col)
        c.box(x, .07, x + .004, .39, shade(col, 1.12))
    for y in (.13, .2, .27, .34):
        c.box(.20, y, .80, y + .006, "#3a5468")
    c.box(.20, .06, .80, .07, "#8fa9bc")
    c.box(.20, .385, .80, .40, "#33475a")
    # Spiegelung von Himmel und Wolken
    for x0, y0 in ((.3, .1), (.55, .16), (.66, .09)):
        c.box(x0, y0, x0 + .05, y0 + .01, "#d5e6f1")
    # Eingang mit Vordach
    c.bevel(.44, .32, .56, .40, "#2a3b4b")
    c.box(.42, .315, .58, .33, "#9fb2c0")
    c.box(.495, .33, .505, .40, "#506a80")
    # Europa-Sterne über dem Eingang
    for k in range(12):
        a = k / 12 * math.tau
        c.px(c.p(.5) + math.cos(a) * 7, c.p(.27) + math.sin(a) * 7, "#f2c230")
    # Fahnen (Sockel 0.62–0.90 × 0.44–0.48)
    flags = ["#2a4fa8", "#d33a3a", "#f2c230", "#3a9a4a", "#ffffff", "#1d3f8f", "#d36a2a", "#6a3aa8"]
    c.shadow(.62, .44, .90, .48, 2, 2)
    c.bevel(.62, .44, .90, .48, "#9a958a")
    for i, col in enumerate(flags):
        x = .635 + i * .034
        c.box(x, .30, x + .005, .45, "#7d7d82")
        c.box(x + .005, .30, x + .029, .34, col)
        c.box(x + .005, .33, x + .029, .34, shade(col, .78))
        c.px(c.p(x) + 1, c.p(.30) - 1, "#d8d8dc")
    # Bäume in Pflanzkübeln, Bänke, Laternen
    for x, y in ((.25, .5), (.95, .6), (.25, .9)):
        c.bevel(x - .03, y + .02, x + .03, y + .05, "#8f8a7f")
        tree(c, x, y, .04)
    bench(c, .33, .9, .43, .925)
    for x, y in ((.3, .66), (.95, .4)):
        lamp_post(c, x, y)
    c.vignette(.15)
    c.save("trip-parliament-v11.webp")


def europapark():
    c = Canvas(41)
    for y in range(int(c.p(.16))):
        c.rect(0, y, N, y + 1, mix("#8ec8ec", "#d9eef8", y / c.p(.16)))
    # ferne Attraktionen als Silhouette (keine echte Bahn)
    c.box(.06, .06, .2, .16, "#b7cfdc")
    c.ellipse(c.p(.08), c.p(.0), c.p(.2), c.p(.12), "#a9c3d2")
    c.ellipse(c.p(.1), c.p(.02), c.p(.18), c.p(.1), "#c9dce6")
    c.box(.25, .09, .32, .16, "#b7cfdc")
    c.box(.27, .05, .3, .09, "#b7cfdc")
    # Wege
    paving(c, 0, .16, 1, 1, ["#dccaa2", "#d5c399", "#e2d1ab", "#cfbd94"], 41, (9, 6))
    # Grün links und rechts mit Blumen (Hindernis rechts ist der Zaun)
    for l, r in ((0, .075), (.94, 1)):
        c.box(l, .16, r, 1, "#5d9a4a")
        c.noise(l, .16, r, 1, ["#4c8a3c", "#6fae58", "#3f7a32"], .3)
        c.noise(l, .16, r, 1, ["#f2c230", "#d8353a", "#ffffff", "#c45ab0"], .05)
    c.box(.075, .16, .08, 1, "#8a7a5a")
    c.box(.935, .16, .94, 1, "#8a7a5a")
    # Achterbahn (Hindernis 0.45–0.92 × 0.16–0.40): Rasen, Stützen, Schiene
    c.box(.45, .16, .92, .40, "#5d9a4a")
    c.noise(.45, .16, .92, .40, ["#4c8a3c", "#6fae58"], .3)
    c.bevel(.45, .385, .92, .40, "#8a7a5a")
    track = [(.45, .34), (.5, .2), (.54, .08), (.58, .03), (.63, .1), (.68, .26), (.73, .18), (.78, .05), (.83, .12), (.88, .27), (.92, .3)]
    pts = []
    for (x1, y1), (x2, y2) in zip(track, track[1:]):
        for k in range(20):
            t = k / 20
            pts.append((x1 + (x2 - x1) * t, y1 + (y2 - y1) * t))
    for i, (x, y) in enumerate(pts):
        if i % 10 == 0:
            c.box(x - .003, y, x + .003, .39, "#d9d9de")
            c.box(x - .003, y, x - .001, .39, "#f4f4f6")
            c.shadow(x - .003, .385, x + .003, .392, 2, 1, .6)
    for i, (x, y) in enumerate(pts):
        c.box(x - .006, y - .006, x + .006, y + .004, "#a8232a")
        c.box(x - .006, y - .006, x + .006, y - .003, "#e2484e")
    # Wagen auf der Strecke
    for k, (x, y) in enumerate(pts[48:56:3]):
        c.bevel(x - .012, y - .02, x + .012, y - .004, ["#2a4fa8", "#f2c230", "#2a4fa8"][k % 3])
    # Eingang zur Warteschlange
    c.bevel(.56, .40, .66, .43, "#2a4fa8")
    c.box(.565, .405, .655, .425, "#f2c230")
    for x in (.575, .6, .625, .645):
        c.box(x, .41, x + .012, .42, "#2a4fa8")
    for x in (.52, .7):
        c.box(x, .43, x + .004, .5, "#b0b0b8")
    c.box(.52, .46, .704, .464, "#d8353a")
    # Brunnen (0.18–0.34 × 0.40–0.52)
    c.shadow(.18, .40, .34, .52)
    c.bevel(.18, .40, .34, .52, "#a8a296")
    c.box(.195, .415, .325, .505, "#4f8ab8")
    rng = random.Random(43)
    for _ in range(30):
        x, y = rng.uniform(.2, .31), rng.uniform(.42, .5)
        c.box(x, y, x + .01, y + .003, rng.choice(["#7fb2d8", "#a6cbe6"]))
    c.bevel(.245, .43, .275, .47, "#c9c3b6")
    c.box(.255, .41, .265, .44, "#e6f4fb")
    for dx in (-.02, .02):
        c.box(.258 + dx, .425, .262 + dx, .435, "#e6f4fb")
    # Imbissstand (0.76–0.92 × 0.58–0.70) mit gestreifter Markise
    c.shadow(.76, .58, .92, .70)
    c.bevel(.76, .6, .92, .70, "#b2453c")
    for i in range(8):
        x = .76 + i * .02
        c.box(x, .565, x + .01, .605, "#ffffff")
        c.box(x + .01, .565, x + .02, .605, "#d8353a")
    c.box(.76, .6, .92, .608, "#8f342d")
    c.bevel(.775, .625, .905, .665, "#f2e3c2")
    for x in (.785, .81, .835, .86, .885):
        c.box(x, .632, x + .012, .645, rng.choice(["#e0a04a", "#c94c3c", "#f2c230", "#8a5a36"]))
    c.box(.81, .675, .87, .69, "#f2c230")
    # Bänke, Laternen, Bäume, Ballons
    bench(c, .12, .64, .2, .665)
    bench(c, .52, .9, .62, .925)
    for x in (.40, .72):
        lamp_post(c, x, .62)
    for x, y in ((.12, .3), (.36, .24), (.9, .88)):
        tree(c, x, y, .045)
    for x, col in ((.47, "#d8353a"), (.485, "#f2c230"), (.5, "#2a4fa8")):
        c.ellipse(c.p(x), c.p(.6), c.p(x + .02), c.p(.627), col)
        c.px(c.p(x) + 1, c.p(.605), "#ffffff")
        c.line([(c.p(x + .01), c.p(.627)), (c.p(.49), c.p(.68))], "#555555")
    c.vignette(.14)
    c.save("trip-europapark-v11.webp")


def main():
    hotel()
    hotelboys()
    parliament()
    europapark()


if __name__ == "__main__":
    main()
