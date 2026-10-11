#!/usr/bin/env python3
"""Vorläufige Pixelentwürfe für die Klassenfahrt (V0.95).

Erzeugt public/rooms/trip-*-v095.svg im Stil der vorhandenen SVG-Szenen
(320×320, crispEdges). Möbel und Bauten liegen genau auf den Hindernissen
aus game/story.ts, damit Kollision und Bild zusammenpassen. Die Bilder sind
Platzhalter, bis finale Pixelgemälde geliefert werden.

Aufruf: python3 scripts/trip-scenes.py
"""
import random
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "public" / "rooms"
U = 320  # Bildgröße; Spielkoordinaten 0..1 werden mit U multipliziert


class Scene:
    def __init__(self, title):
        self.title = title
        self.parts = []

    def rect(self, x, y, w, h, fill):
        x, y, w, h = (round(v) for v in (x, y, w, h))
        if w > 0 and h > 0:
            self.parts.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{fill}"/>')

    def box(self, left, top, right, bottom, fill):
        """Rechteck in Spielkoordinaten (0..1)."""
        self.rect(left * U, top * U, (right - left) * U, (bottom - top) * U, fill)

    def tiles(self, x, y, w, h, colors, tile=(10, 6), seed=1, offset=True):
        rng = random.Random(seed)
        tw, th = tile
        for row, ty in enumerate(range(int(y), int(y + h), th + 1)):
            shift = (tw // 2) if offset and row % 2 else 0
            for tx in range(int(x) - shift, int(x + w), tw + 1):
                left = max(tx, int(x))
                right = min(tx + tw, int(x + w))
                self.rect(left, ty, right - left, min(th, int(y + h) - ty), rng.choice(colors))

    def svg(self):
        body = "".join(self.parts)
        return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {U} {U}" shape-rendering="crispEdges">'
                f"<title>{self.title.replace('&', '&amp;')}</title>{body}</svg>\n")


def bed(s, left, top, right, bottom, blanket, seed):
    s.box(left, top, right, bottom, "#5b3b28")
    s.box(left + .01, top + .01, right - .01, top + .05, "#7a5236")
    s.box(left + .015, top + .05, right - .015, bottom - .015, "#f2eee4")
    s.box(left + .03, top + .065, right - .03, top + .11, "#ffffff")
    s.box(left + .015, top + .14, right - .015, bottom - .015, blanket)
    rng = random.Random(seed)
    for _ in range(6):
        x = rng.uniform(left + .03, right - .05)
        y = rng.uniform(top + .16, bottom - .05)
        s.box(x, y, x + .02, y + .012, "#ffffff22")


def hotel_wall(s, seed):
    s.rect(0, 0, U, U, "#3b3a45")
    s.tiles(0, 0, U, .16 * U, ["#d9c9a8", "#d3c29f", "#ddd0b2"], tile=(14, 8), seed=seed)
    s.rect(0, .155 * U, U, 3, "#9c8a6a")
    s.tiles(.075 * U, .16 * U, .865 * U, .76 * U, ["#6f7d95", "#6a778f", "#74829a", "#68748b"], tile=(8, 5), seed=seed + 1)
    s.box(0, 0, .075, 1, "#2e2d36")
    s.box(.94, 0, 1, 1, "#2e2d36")
    s.box(0, .92, 1, 1, "#2e2d36")


def door(s, x, label_color="#c7a46a"):
    s.box(x - .05, .90, x + .05, .935, "#8a6a44")
    s.box(x - .04, .905, x + .04, .93, label_color)


def hotel():
    s = Scene("B&B Hotel Kehl, Zimmer · Vorläufiger Pixelentwurf als Spielinterpretation")
    hotel_wall(s, 11)
    # Fenster mit Blick über den Rhein
    s.box(.38, .02, .62, .14, "#e9e4d6")
    s.box(.395, .03, .605, .13, "#9fc6e4")
    s.box(.395, .095, .605, .13, "#7aa6c4")
    s.box(.495, .03, .505, .13, "#e9e4d6")
    bed(s, .12, .16, .30, .44, "#3f8f8a", 1)
    bed(s, .32, .16, .50, .44, "#3f8f8a", 2)
    # Schreibtisch mit Fernseher
    s.box(.62, .16, .88, .30, "#7a5236")
    s.box(.63, .17, .87, .20, "#956743")
    s.box(.68, .02, .82, .14, "#1d1d24")
    s.box(.69, .03, .81, .13, "#2f3b52")
    s.box(.735, .14, .765, .17, "#1d1d24")
    # Koffer
    s.box(.70, .55, .80, .62, "#b2453c")
    s.box(.71, .56, .79, .57, "#d0625a")
    s.box(.735, .53, .765, .55, "#3b2a24")
    # Teppich
    s.box(.30, .58, .62, .80, "#8a5a6e")
    s.box(.32, .60, .60, .78, "#9d6b80")
    for x in (.16, .42, .66):
        door(s, x)
    s.box(.93, .64, .94, .76, "#c7a46a")
    return s


def hotelboys():
    s = Scene("B&B Hotel Kehl, Zimmer von Elias, Paul und Justin · Vorläufiger Pixelentwurf")
    hotel_wall(s, 21)
    for i, (left, right) in enumerate(((.10, .26), (.28, .44), (.46, .62))):
        bed(s, left, .16, right, .40, ["#3d6fa8", "#4f8a3c", "#a8573d"][i], 10 + i)
    # Kommode mit Fernseher (Pokalabend)
    s.box(.70, .16, .90, .28, "#7a5236")
    s.box(.71, .17, .89, .20, "#956743")
    s.box(.72, .01, .88, .145, "#1d1d24")
    s.box(.73, .02, .87, .135, "#2f7a3c")
    s.box(.79, .06, .81, .10, "#f2eee4")
    s.box(.78, .145, .82, .17, "#1d1d24")
    # Tisch mit Pizzakartons
    s.box(.62, .52, .76, .60, "#6b4a30")
    s.box(.635, .50, .70, .545, "#d8b37a")
    s.box(.69, .515, .75, .56, "#cfa86c")
    s.box(.645, .51, .69, .53, "#b5452f")
    # Kleidung und Taschen auf dem Boden
    s.box(.14, .50, .22, .55, "#2f2f3a")
    s.box(.80, .70, .88, .76, "#3f5c8a")
    door(s, .16)
    return s


def parliament():
    s = Scene("Straßburg, Platz vor dem Europäischen Parlament · Vorläufiger Pixelentwurf")
    # Himmel
    s.rect(0, 0, U, .16 * U, "#b9d8ec")
    s.rect(0, .10 * U, U, .06 * U, "#a8cde6")
    # Platz
    s.tiles(0, .16 * U, U, .84 * U, ["#c9c6be", "#c2bfb6", "#cfccc4", "#bdb9b0"], tile=(12, 7), seed=31)
    # Gebogener Glasbau mit Rundturm
    s.box(.20, .06, .80, .40, "#5d7f99")
    for i in range(12):
        x = .21 + i * .05
        s.box(x, .07, x + .04, .39, "#86aac4" if i % 2 else "#7a9fbb")
    for y in (.13, .20, .27, .34):
        s.box(.20, y, .80, y + .006, "#4a6a83")
    s.box(.36, .00, .64, .06, "#6f92ad")
    s.box(.38, .00, .62, .05, "#93b6cf")
    s.box(.20, .38, .80, .40, "#3e566b")
    s.box(.46, .33, .54, .40, "#2d3f50")
    # Die Ill links
    s.tiles(0, 0, .18 * U, U, ["#4f86b0", "#4a80aa", "#5b92bc"], tile=(9, 4), seed=32)
    s.box(.17, 0, .19, 1, "#8f8a7f")
    # Fahnenreihe
    flags = ["#2a4fa8", "#d33a3a", "#f2c230", "#3a9a4a", "#ffffff", "#2a4fa8", "#d36a2a", "#6a3aa8"]
    for i, color in enumerate(flags):
        x = .63 + i * .035
        s.box(x, .30, x + .006, .48, "#6b6b6b")
        s.box(x + .006, .30, x + .028, .34, color)
    s.box(.62, .46, .90, .48, "#8f8a7f")
    # Bänke und Bäumchen
    s.box(.26, .84, .36, .86, "#7a5236")
    s.box(.70, .60, .74, .64, "#3a7a3c")
    return s


def europapark():
    s = Scene("Europa-Park · Vorläufiger Pixelentwurf, keine Nachbildung einer bestimmten Bahn")
    s.rect(0, 0, U, .16 * U, "#bfe0f2")
    s.tiles(0, .16 * U, U, .84 * U, ["#d9c7a0", "#d3c098", "#decda8"], tile=(11, 6), seed=41)
    # Grünflächen
    s.box(0, .16, .075, 1, "#5d9a4a")
    s.box(.94, .16, 1, 1, "#5d9a4a")
    # Achterbahn: Stützen und Schienen
    s.box(.45, .30, .92, .40, "#5d9a4a")
    for i in range(10):
        x = .47 + i * .045
        s.box(x, .10 + (i % 3) * .05, x + .008, .40, "#e8e8e8")
    track = [(.45, .30), (.52, .12), (.58, .05), (.64, .14), (.70, .24), (.76, .08), (.82, .18), (.88, .28), (.92, .22)]
    for (x1, y1), (x2, y2) in zip(track, track[1:]):
        steps = 14
        for k in range(steps):
            x = x1 + (x2 - x1) * k / steps
            y = y1 + (y2 - y1) * k / steps
            s.box(x, y, x + .012, y + .012, "#d8353a")
    s.box(.56, .02, .62, .05, "#2a4fa8")
    # Eingang zur Warteschlange
    s.box(.56, .40, .66, .43, "#2a4fa8")
    s.box(.565, .405, .655, .425, "#f2c230")
    # Brunnen
    s.box(.18, .40, .34, .52, "#8f8a7f")
    s.box(.195, .415, .325, .505, "#5b92bc")
    s.box(.25, .43, .27, .47, "#d8eef8")
    # Imbissstand
    s.box(.76, .58, .92, .70, "#b2453c")
    for i in range(4):
        x = .76 + i * .04
        s.box(x, .56, x + .02, .59, "#ffffff")
        s.box(x + .02, .56, x + .04, .59, "#d8353a")
    s.box(.78, .62, .90, .66, "#f2e3c2")
    # Blumen und Lampen
    rng = random.Random(42)
    for _ in range(24):
        x = rng.uniform(.0, .06)
        y = rng.uniform(.2, .9)
        s.box(x, y, x + .012, y + .012, rng.choice(["#f2c230", "#d8353a", "#ffffff", "#c45ab0"]))
    for x in (.40, .72):
        s.box(x, .52, x + .008, .62, "#3b3a45")
        s.box(x - .008, .50, x + .016, .525, "#f2e3a0")
    return s


def main():
    for name, build in (("hotel", hotel), ("hotelboys", hotelboys), ("parliament", parliament), ("europapark", europapark)):
        path = OUT / f"trip-{name}-v095.svg"
        path.write_text(build().svg(), encoding="utf-8")
        print(path.relative_to(OUT.parent.parent), path.stat().st_size, "Bytes")


if __name__ == "__main__":
    main()
