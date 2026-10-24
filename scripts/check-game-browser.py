#!/usr/bin/env python3
"""Optional real-browser gameplay checks; requires Python Playwright.

Start the Vite development server, then run:
  python scripts/check-game-browser.py --base-url http://127.0.0.1:5173/pixelgame/ \
    --executable /usr/bin/chromium --output /tmp/pixelspiel-browser-qa

Use --fixture-url to additionally check all four school friends with a supplied
development-only spawn harness. Every scenario uses an isolated browser context.
"""

import argparse
import json
from pathlib import Path
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from playwright.sync_api import sync_playwright


def fixture(place, minute=400, beginning_completed=True):
    progress = {}
    if beginning_completed:
        progress["beginning-2025-11-01"] = {
            "cursor": 5, "topics": [], "topic": None, "line": 0,
            "visits": 1, "completedAt": "2025-11-10T05:00:00Z",
        }
    return {
        "felice-elias.story.v05": {
            "version": 1, "chapter": None, "step": 0, "completed": [],
            "place": place, "bag": [],
        },
        "felice-elias.timeline.v09": {
            "version": 2,
            "clock": {
                "version": 1, "date": "2025-11-10", "minute": minute,
                "day": 1, "season": "Herbst",
            },
            "progress": progress, "active": None, "inventory": [],
            "flags": ["intro-seen"],
        },
    }


def point(page):
    return page.locator('[data-testid="felice-player"]').evaluate(
        "e => ({x: Number(e.dataset.x), y: Number(e.dataset.y)})"
    )


def school_pupils(page):
    return page.locator('[data-entity^="school-pupil-"]').count()


def dismissed_pupils(page):
    return page.locator('.entity-person[data-entity^="school-"]').count()


def mobile_layout(page):
    return page.evaluate("""() => {
      const rect = e => {
        const r = e.getBoundingClientRect();
        return {x:r.x,y:r.y,right:r.right,bottom:r.bottom};
      };
      const overlaps = (a,b) => a.x < b.right && b.x < a.right &&
        a.y < b.bottom && b.y < a.bottom;
      const box = selector => rect(document.querySelector(selector));
      const labels = ['friends','jason','luca','wyatt'].map(id => ({id,
        ...box('[data-group-name="'+id+'"] .entity-name')}));
      return {
        viewport:[innerWidth,innerHeight],
        scroll:[document.documentElement.scrollWidth,document.documentElement.scrollHeight],
        doorsClockOverlap:overlaps(box('.hud-doors'),box('.day-clock')),
        doorsWorldOverlap:overlaps(box('.hud-doors'),box('.world-viewport')),
        clockWorldOverlap:overlaps(box('.day-clock'),box('.world-viewport')),
        thoughtJoystickOverlap:overlaps(box('.felice-thought'),box('.joystick')),
        labelsOverlap:labels.flatMap((a,i) => labels.slice(i+1)
          .filter(b => overlaps(a,b)).map(b => [a.id,b.id])),
        labels
      };
    }""")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base-url", default="http://127.0.0.1:5173/pixelgame/")
    parser.add_argument("--executable", help="Chromium path; otherwise use Playwright's installed browser")
    parser.add_argument("--fixture-url", help="Optional development spawn harness URL")
    parser.add_argument("--output", type=Path, default=Path("/tmp/pixelspiel-browser-qa"))
    parser.add_argument("--headed", action="store_true")
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=True)
    report = {"passed": False, "checks": [], "pageErrors": []}

    def checked(name, detail=None):
        report["checks"].append({"name": name, "detail": detail})
        print(f"PASS {name}", flush=True)

    with sync_playwright() as playwright:
        options = {"headless": not args.headed}
        if args.executable:
            options["executable_path"] = args.executable
        browser = playwright.chromium.launch(**options)

        def open_scenario(state=None, size=(1440, 900), url=None):
            context = browser.new_context(
                viewport={"width": size[0], "height": size[1]},
                is_mobile=size[0] < 1000, has_touch=size[0] < 1000,
            )
            if state is not None:
                context.add_init_script(
                    "for (const [key,value] of Object.entries(" + json.dumps(state) +
                    ")) localStorage.setItem(key,JSON.stringify(value));"
                )
            page = context.new_page()
            page.set_default_timeout(8000)
            page.on("pageerror", lambda error: report["pageErrors"].append(str(error)))
            page.goto(url or args.base_url, wait_until="networkidle")
            page.get_by_role("button", name="Welt betreten", exact=True).click()
            return context, page

        try:
            context, page = open_scenario()
            page.get_by_role("button", name="Überspringen").wait_for()
            page.screenshot(path=str(args.output / "fresh-intro.png"))
            checked("Fresh game starts the intro")
            context.close()

            context, page = open_scenario(fixture("bedroom", beginning_completed=False))
            assert page.locator('[data-testid="story-trigger"]').count() == 1
            before = point(page)
            page.keyboard.down("d")
            page.wait_for_timeout(900)
            after = point(page)
            page.keyboard.up("d")
            assert after["x"] > before["x"] + .12, (before, after)
            page.keyboard.down("d")
            page.keyboard.press("Escape")
            paused = point(page)
            page.wait_for_timeout(350)
            assert point(page) == paused
            page.get_by_role("button", name="Zurück zum Spiel", exact=True).click()
            page.wait_for_timeout(250)
            assert point(page) == paused, "Held input survived pause"
            page.keyboard.up("d")
            page.keyboard.down("a")
            page.wait_for_timeout(500)
            page.keyboard.up("a")
            assert point(page)["x"] < paused["x"] - .07
            checked("Held keyboard input survives a pending story trigger; pause clears it", {"before": before, "after": after})
            context.close()

            for minute in (434, 435):
                context, page = open_scenario(fixture("school", minute))
                assert page.locator('[data-entity="school-grille"]').count() == 0
                assert page.locator('.world-exit').filter(has_text="In die kleine Turnhalle").count() == 0
                assert page.locator('.world-exit').filter(has_text="Zurück zum Markt").count() == 1
                morning = page.locator('[data-entity^="school-group-"]').count()
                assert morning > 0 if minute == 434 else morning == 0
                assert school_pupils(page) == (6 if minute == 434 else 0)
                if minute == 434:
                    friend_points = page.locator('[data-group-name]').evaluate_all("""elements =>
                      Object.fromEntries(elements.map(e => [e.dataset.groupName,
                        {x:parseFloat(e.style.left)/100,y:parseFloat(e.style.top)/100}]))""")
                page.screenshot(path=str(args.output / f"school-{minute}.png"))
                checked(f"School morning groups at {minute // 60}:{minute % 60:02}")
                context.close()

            context, page = open_scenario(fixture("school", 780))
            page.wait_for_timeout(200)
            first = dismissed_pupils(page)
            page.wait_for_timeout(2200)
            assert dismissed_pupils(page) > first
            checked("School dismissal releases pupils in sequence")
            context.close()
            for place in ("school", "zoerbig"):
                context, page = open_scenario(fixture(place, 810))
                assert dismissed_pupils(page) == 10
                checked(f"Ten dismissed pupils settle in {place}")
                context.close()

            for size in ((844, 390), (667, 375)):
                context, page = open_scenario(fixture("school"), size)
                page.wait_for_timeout(150)
                layout = mobile_layout(page)
                assert not layout["doorsClockOverlap"], layout
                # The HUD lives in the margins beside the square world, never on top of it.
                assert not layout["doorsWorldOverlap"] and not layout["clockWorldOverlap"], layout
                assert not layout["thoughtJoystickOverlap"], layout
                assert not layout["labelsOverlap"], layout
                assert layout["scroll"] == list(size), layout
                page.screenshot(path=str(args.output / f"mobile-{size[0]}x{size[1]}.png"))
                box = page.locator(".joystick").bounding_box()
                x, y = box["x"] + box["width"] / 2, box["y"] + box["height"] / 2
                before = point(page)
                page.mouse.move(x, y)
                page.mouse.down()
                page.mouse.move(x + 34, y)
                page.wait_for_timeout(310)
                page.mouse.up()
                # easeInput brakes softly for about 0.1 s; measure once she has stopped.
                page.wait_for_timeout(150)
                right = point(page)
                assert right["x"] > before["x"] + .04
                page.wait_for_timeout(200)
                assert point(page) == right, "Joystick continues after release"
                page.mouse.move(x, y)
                page.mouse.down()
                page.mouse.move(x, y - 34)
                page.wait_for_timeout(700)
                page.mouse.up()
                assert point(page)["y"] < right["y"] - .09
                page.get_by_role("button", name="Menü öffnen", exact=True).click()
                page.get_by_role("button", name="Zurück zum Spiel", exact=True).click()
                page.get_by_role("button", name="Menü öffnen", exact=True).click()
                page.locator(".pause-menu button").filter(has_text="Tasche").click()
                assert page.locator(".inventory-modal").is_visible()
                page.get_by_role("button", name="Tasche schließen", exact=True).click()
                page.set_viewport_size({"width": size[1], "height": size[0]})
                page.locator(".rotate-screen").wait_for(state="visible")
                page.set_viewport_size({"width": size[0], "height": size[1]})
                page.locator(".rotate-screen").wait_for(state="hidden")
                checked(f"Mobile {size[0]}x{size[1]} layout, joystick, pause, bag and rotation", layout)
                context.close()

            for size in ((1280, 800), (667, 375)):
                # B-23: with a dialogue open, Felice stays above the dialogue's text panel.
                # Something to talk to or use in the living room opens a dialogue.
                context, page = open_scenario(fixture("home", minute=600), size=size)
                for _ in range(80):
                    here = point(page)
                    dx, dy = .30 - here["x"], .58 - here["y"]
                    if abs(dx) < .025 and abs(dy) < .025:
                        break
                    keys = ([("d" if dx > 0 else "a")] if abs(dx) >= .025 else []) + ([("s" if dy > 0 else "w")] if abs(dy) >= .025 else [])
                    for key in keys:
                        page.keyboard.down(key)
                    page.wait_for_timeout(90)
                    for key in keys:
                        page.keyboard.up(key)
                page.keyboard.press("e")
                page.locator('[data-testid="dialogue-box"]').wait_for()
                page.wait_for_timeout(900)
                gap = page.evaluate("""() => {
                  const felice = document.querySelector('[data-testid="felice-player"]').getBoundingClientRect();
                  const body = document.querySelector('.fx-dialogue-body').getBoundingClientRect();
                  return Math.round(body.top - felice.bottom);
                }""")
                page.screenshot(path=str(args.output / f"dialogue-{size[0]}x{size[1]}.png"))
                assert gap >= 0, f"Felice hidden behind the dialogue at {size}: {gap}px"
                checked(f"Felice above the dialogue at {size[0]}x{size[1]}", {"gapPx": gap})
                context.close()

            if args.fixture_url:
                for id, name in (("friends", "Elena"), ("jason", "Jason"), ("luca", "Luca"), ("wyatt", "Wyatt")):
                    x, y = friend_points[id]["x"], friend_points[id]["y"]
                    parts = urlsplit(args.fixture_url)
                    query = dict(parse_qsl(parts.query)) | {"place": "school", "x": str(x), "y": str(y)}
                    url = urlunsplit(parts._replace(query=urlencode(query)))
                    context, page = open_scenario(fixture("school"), url=url)
                    page.keyboard.press("e")
                    page.locator("#fx-dialogue-speaker").wait_for()
                    assert page.locator("#fx-dialogue-speaker").inner_text() == name
                    checked(f"E selects {name} in the compact group")
                    context.close()
                for mode, near, expected in (
                    ("nearby", False, []),
                    ("nearby", True, ["friends"]),
                    ("friends", False, ["friends", "jason", "luca", "wyatt"]),
                ):
                    state = fixture("school")
                    state["felice-elias.names.v07"] = {"version": 1, "names": {}, "visibility": mode}
                    if near:
                        parts = urlsplit(args.fixture_url)
                        query = dict(parse_qsl(parts.query)) | {"place": "school", "x": str(friend_points["friends"]["x"]), "y": str(friend_points["friends"]["y"])}
                        url = urlunsplit(parts._replace(query=urlencode(query)))
                    else:
                        url = args.base_url
                    context, page = open_scenario(state, url=url)
                    visible = page.locator("[data-group-name]").evaluate_all("""elements => elements
                      .filter(e => getComputedStyle(e.querySelector('.entity-name')).display !== 'none')
                      .map(e => e.dataset.groupName)""")
                    assert visible == expected, (mode, near, visible)
                    checked(f"Names mode {mode}, near Elena: {near}", visible)
                    context.close()
            assert not report["pageErrors"], report["pageErrors"]
            report["passed"] = True
        finally:
            (args.output / "results.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
            browser.close()


if __name__ == "__main__":
    main()
