# Die verlorenen Erinnerungen – 30-Minuten-Abenteuer (V1.5)

Felice ist die spielbare Hauptfigur. Elias wird vom **Schatten** im Erinnerungsarchiv festgehalten. Felice holt vier Erinnerungsfragmente zurück, löst sechs Haupt-Rätsel und befreit ihn mit der Antwort **„Weil wir zusammengehören“**. Das Abenteuer ist ein eigener Spielmodus neben der Chronik **„Unser Jahr“**; beide teilen Welt, Bewegung, Kollisionen, Figuren, Dialogbox, Ruheplätze und Ton.

## Ablauf und geplante Spielzeit (erstes Durchspielen)

| Kapitel | geplant | Haupt-Rätsel | Typ |
|---|---|---|---|
| Prolog – Verschwinden | 3 Min. | 1 · Das Schattensiegel | Musterrätsel (3×3) |
| Radegast | 6 Min. | 2 · Das Treffen rekonstruieren | Detektivrätsel: Hinweise sammeln → Akte kombinieren → 5 Fragen |
| Schulweg | 5 Min. | 3 · Der manipulierte Fahrplan | Logikrätsel: 5 von 7 Stationen aus Fahrkarte, Zettel, Busfahrer |
| Zörbig | 5 Min. | 4 · Der Trainingsraum | Escape Room: Schalter (Teil 1) + Symbolschloss (Teil 2), Tür verriegelt |
| Weihnachten | 6 Min. | 5 · Das eingefrorene Weihnachten | Uhr auf „8“ (Teil 1) + Geschenke-Reihenfolge (Teil 2) |
| Finale | 5 Min. | 6 · Die Barriere | Lügen des Schattens (Teil 1) + letzte Frage „Weil wir zusammengehören“ (Teil 2) |

Kurze Wege: Der Schattenbus fährt direkt zum Pausenhof (überspringbare Busfahrt, 9 s), nach dem Escape Room wechselt die Szene direkt ins weihnachtliche Wohnzimmer. Keine Wartezeiten; Dialoge lassen sich antippen oder mit × überspringen.

**Spielzeit prüfen:** `node --experimental-strip-types scripts/adventure-playtime.mjs` spielt die vorgesehene Route durch die echte Engine und schätzt die Zeit (Lesetempo, echte Laufwege, angenommene Denkzeit pro Rätsel – alle Annahmen stehen in `tests/adventure-route.mjs`). Das ist ein **Modell**, keine gemessene Spielzeit. Die **tatsächliche** Spielzeit zählt das Spiel selbst (nur aktive Zeit, ohne Pause) und zeigt sie im Tagebuch je Kapitel und im Abspann.

## Dranbleiben (V1.5)

- **Elias meldet sich nach jedem Fragment** (`ELIAS_MESSAGES`): Das Handysignal wird mit jeder Erinnerung stärker (1–4 Balken), seine Nachrichten werden klarer und deuten das nächste Kapitel an. Felice antwortet mit einer von zwei eigenen Antworten.
- **„Deine Worte“** (`WORDS`): Jede Antwort, die Felice wählt (Brief, Nachbarin, Elena, Schatten, Tischkarte, Elias' Nachrichten, Wiedersehen), wird gespeichert (`said-…`) und vor dem Liebesbrief zitiert – ohne richtig oder falsch.
- **Spürbare Belohnung**: Ein zurückgeholtes Fragment bzw. ein gelöstes Haupt-Rätsel dreht sich als Blender-Sprite in der Mitte und fliegt zur Anzeige oben links, mit Ton und Handyvibration (abschaltbar über „Effekte: Reduziert“).
- **Geschicklichkeit im Escape Room** (`TargetChallenge.tsx`): Die Zielscheiben leuchten auf und werden angetippt. Wie oft jede Scheibe dran war (Stern 2, Mond 3, Herz 5), ist der Code fürs Symbolschloss. Verpasste Scheiben kommen wieder, „Ohne Zeitdruck“ hält sie an – man kann nicht verlieren.
- **Eigene Fotos und Sprachnachrichten**: Dateien nach `public/adventure-memories/` legen und in `content.ts` unter `MEMENTOS` eintragen, z. B. `"f-chocolate": { photo: "/adventure-memories/schokolade.jpg", audio: "/adventure-memories/elias-1.mp3", caption: "Radegast, 19.11.2025" }`. Sie erscheinen im Erinnerungsalbum, sobald das Fragment zurück ist. Leere Einträge werden nicht angezeigt.

## Blender-Effekte

`scripts/blender/render_fx.py` baut die Effekte als Pixel-Sprite-Sheets nach `public/fx/` (Fragment, Schatten-Auflösung, Herzen). Das Spiel braucht Blender nicht zur Laufzeit; die PNGs liegen im Projekt. Neu rendern (z. B. nach Farb- oder Bewegungsänderungen im Skript):

```
"C:\Program Files\Blender Foundation\Blender 5.2\blender.exe" -b --factory-startup --python scripts/blender/render_fx.py
```

Bildanzahl und Größe stehen in `game/adventure/fx-sheets.ts` und werden per Test gegen die PNGs geprüft.

## Hinweise

Jedes Rätsel hat drei freiwillige Hinweisstufen (Richtung → konkreter Tipp → Lösung) im Rätselfenster und über „Hinweis“. Überspringen wird nach Fehlversuchen angeboten und gibt dieselbe Belohnung.

## Speichern

- Hauptslot `felice-elias.adventure.v1` (Name aus V1.0 bleibt, Inhalt ist **Version 2**) und Checkpoint `felice-elias.adventure.checkpoint` in `localStorage`.
- Automatisch bei jeder Aktion, jedem Ortswechsel, alle 30 s (Position, Spielzeit) und beim Verlassen/Verstecken der Seite; Checkpoint nach jedem gelösten Rätsel, Kapitelwechsel und manuellem Speichern („Spiel speichern“ im Pausenmenü bzw. Tagebuch → Einstellungen).
- Gesichert: Ort, Position, Kapitel, Inventar, Hinweise/Schlussfolgerungen, Rätselzustände (Fehlversuche, Hinweisstufe), Fragmente/Erinnerungen, Quest-Markierungen, Einstellungen, Spielzeit.
- Laden prüft streng (Version, Orte, IDs, Position begehbar), repariert Belohnungen gelöster Rätsel und berechnet das Kapitel neu. V1-Stände (12-Rätsel-Fassung) werden übernommen.
- Beschädigter Hauptslot: Startmenü bietet „Letzten Checkpoint fortsetzen“ oder „Neues Spiel“; der beschädigte Text wird unter `felice-elias.adventure.damaged` aufbewahrt, nie stillschweigend gelöscht.
- Startmenü und Pausenmenü erklären, dass gelöschte Browserdaten den lokalen Spielstand entfernen können.

## Smartphone

Joystick (unten links), Aktionsknopf (unten rechts), HUD-Knöpfe Tagebuch · Akte · Tasche · Hinweis, Pause oben rechts. Alle Rätsel sind Tipp-Knöpfe, keine Texteingabe. Kurze Querformat-Bildschirme bekommen kompakte, scrollbare Start- und Rätselfenster. Installierbar als PWA (`public/manifest.webmanifest`, `public/sw.js`, Icons aus `scripts/make-icons.mjs`); der Service Worker cached nur Dateien, nie Spielstände.

## Module

- `core.ts` – Spielstand-Typ (v2), Konstanten, Helfer, Spielzeit.
- `content.ts` – Kapitel (mit geplanten Minuten), Intro, Fragmente, Gegenstände, Hinweise/Schlussfolgerungen, Rätsel, `MAIN_PUZZLES`, Hotspots, Aufgaben, Nebenquests, Liebesbrief, Abspann.
- `engine.ts` – Regeln, Ziele, Ortssperren (inkl. Escape-Room-Tür), Speicher-Parsing, Migration und Reparatur.
- `storage.ts` – Haupt-/Checkpoint-Slot, beschädigte Stände, gesperrter oder voller Speicher.
- `PuzzlePanel.tsx`, `AdventureUI.tsx`, `adventure.css` – Oberfläche.

Persönliche Fakten folgen den bereits im Spiel bestätigten Angaben (19.11.2025, Fahrrad aus Zörbig, Schokolade, Schulweg, acht Menschen und erster Kuss am 25.12.2025). Der Liebesbrief steht in `content.ts` als `LOVE_LETTER`.
