# Umsetzungsplan 0.95

Stand: 11.10.2026, Basis `38b4a12` (main). Grundlage ist das Konzept „Felice × Elias World – großer Entwicklungsplan für Version 0.95“. Dieses Dokument übersetzt das Konzept in konkrete Arbeitsschritte am vorhandenen Code. Nichts davon ist schon umgesetzt.

## 1. Ehrliche Einschätzung des Konzepts

Das Konzept ist inhaltlich vernünftig, aber zu breit und an einigen Stellen ungenau:

- **Der eigentliche Blocker ist das Datum, nicht die Technik.** Die Hauptgeschichte in `game/timeline.ts` ist eine automatische Kette: `mainline` wird nach Datum sortiert und jedes Ereignis bekommt `requires: [vorheriges]`. Ohne Datum lässt sich die Klassenfahrt nicht einordnen. Bis dahin baue ich sie mit `confirmed: false` als Entwurf, der niemanden blockiert.
- **Drei neue begehbare Karten plus 15 bis 25 Minuten Spielzeit ist viel.** Jede Karte braucht Bild, Kollisionen, Vordergrundmaske, Spawns, Ausgänge und Prüfung auf dem Handy. Das ist der teuerste Teil des Updates. Ankunft in Kehl wird deshalb keine eigene Karte, sondern ein Übergang ins Hotel.
- **Export/Import ist im Konzept P1, gehört aber nach vorne.** Die Klassenfahrt verändert die Ereigniskette und damit Speicherstände. Ein Export vorher ist das Sicherheitsnetz. Außerdem ist es klein und unabhängig.
- **„Orientierung“ braucht kein neues System.** `storyHint()` und `storyTrigger()` liefern schon den nächsten Schritt mit Ort und Text. Die Aufgabenanzeige wird nur eine sichtbare Fassung davon, damit Welt, Handy und Album garantiert dasselbe sagen.
- **Die Zahl 107 ist veraltet.** Aktuell laufen 111 Tests, alle grün.

## 2. Befunde aus dem Code

| Befund | Folge |
| --- | --- |
| `npm test` bricht unter Node 22.22 mit `bad option: --test-isolation=none` ab. CI nutzt Node 24 und läuft. `package.json` verspricht aber `node >= 22.13`. | Schritt 0: Skript auf `--experimental-test-isolation=none` umstellen oder `engines` auf 23+ anheben. Lokales Testen muss funktionieren. |
| `eventStatus()` sperrt alles vor `STORY_START` (10.11.2025) und nach `STORY_END` (02.11.2026). | Liegt die Fahrt außerhalb, braucht es eine bewusste Ausnahme für Rückblenden. Liegt sie dazwischen: keine Änderung nötig. |
| `nextEvent()` nimmt das früheste offene Ereignis. | Ein weit fortgeschrittener Spielstand bekommt nach dem Update die Klassenfahrt als nächste Erinnerung angezeigt, obwohl die Uhr schon weiter ist. Das ist gewollt, muss aber getestet werden (Abnahme 6). |
| Neuladen setzt eine aktive Sequenz am gespeicherten `cursor` fort (`Game.tsx`, Startposition aus `progress[active].cursor`). | Fortsetzen nach Neuladen ist schon da. Die Fahrt muss nur in sinnvolle Schritte geschnitten werden. |
| Sechs Speicher-Schlüssel: `story.v05`, `timeline.v09`, `day.v061` (alt), `names.v07`, `audio.v1`, `memories.v1`. | Export/Import muss alle erfassen und mit den vorhandenen `parse*`-Funktionen validieren. |
| `Game.tsx` hat knapp 900 Zeilen. | Neue Reiselogik kommt in eigene Module, nicht noch mehr in `Game.tsx`. |
| `Place` ist eine feste Union in `game/story.ts` mit `PLACES`, `ENTITIES`, `SPAWNS`. | Neue Orte: `kehlhotel`, `strasbourg`, `europapark`. Alle drei Tabellen und Tests erweitern. |

## 3. Architekturentscheidung für die Klassenfahrt

**Die Fahrt wird nicht ein riesiges Ereignis, sondern 5 bis 6 einzelne `sequence`-Ereignisse.** Gründe:

- Jedes abgeschlossene Ereignis wird sofort gespeichert. Das ergibt die Checkpoints an Szenengrenzen ohne neues Speichermodell.
- Die Kette über `requires` erzwingt die Reihenfolge automatisch.
- Wiederholen funktioniert pro Abschnitt mit dem vorhandenen flüchtigen Wiederholungszustand.
- Mehrtägig ist kein Sonderfall: jedes Ereignis bekommt sein echtes Datum.

Geplante Ereignisse (IDs stabil, Datum Platzhalter bis zur Bestätigung):

1. `klassenfahrt-abfahrt`: Treffpunkt, Gruppe, Abfahrt. Reise über `BusRide.tsx` oder kurze Pixelinszenierung, überspringbar.
2. `klassenfahrt-ankunft-kehl`: Ankunft am Hotel, kurzer Innenraum, Orientierung.
3. `klassenfahrt-strassburg`: kompakter Stadtbereich, 2 bis 4 Interaktionen.
4. `klassenfahrt-europapark`: kompakter Parkbereich, ein bestätigtes gemeinsames Erlebnis.
5. `klassenfahrt-hotelabend`: ruhige Szene, Ausblende, Übergang zum Morgen. Nichts Explizites, kein Albumtext dazu.
6. `klassenfahrt-rueckkehr`: Rückreise, Albumkarte „Unsere Klassenfahrt – Straßburg, Kehl & Europa-Park“.

Reihenfolge 3/4/5 richtet sich nach den echten Tagen.

Optional ein eigenes Datenmodul `game/trip.ts`, das diese Ereignisse liefert und von `timeline.ts` nur eingebunden wird. So bleibt `timeline.ts` lesbar.

## 4. Phasen

### Phase 0: Ausgangslage sichern (geht sofort)

- `npm test` unter Node 22 lauffähig machen.
- Lint, TypeScript und `npm run build:pages` einmal laufen lassen, Ergebnis notieren.
- Kurzer Browserlauf auf dem gebauten Stand mit `/pixelspiel/`: Start, gehaltene Lauftaste im Zimmer, Gruppe auf dem Schulhof, Handyquerformat. Screenshots nach `docs/screenshots/v095-baseline/`.

Fertig, wenn: alle Prüfungen lokal reproduzierbar grün sind und die Baseline dokumentiert ist.

### Phase 1: Export/Import (geht sofort)

- Neues Modul `game/savefile.ts`: `exportSave(storage)` liefert versioniertes JSON `{ format: "felice-elias-save", version: 1, exportedAt, data: { …alle Schlüssel } }`.
- `importSave(raw)` validiert jeden Teil mit `parseTimeline`, `parseStory`, `parseNames`, `readProgress` usw. **bevor** irgendetwas geschrieben wird. Fehlschlag ändert nichts.
- UI im Handy oder Menü: Datei speichern, Datei laden, Zusammenfassung (Datum im Spiel, Anzahl Erinnerungen, Namen) und Bestätigung vor dem Ersetzen.
- Tests: gültiger Roundtrip, kaputte Datei, fremdes Format, gesperrter Speicher.

Fertig, wenn: Fortschritt von lokal nach Pages und zurück mitgenommen werden kann und eine ungültige Datei nachweislich nichts kaputt macht.

### Phase 2: Orientierung (geht sofort)

- Kleine Aufgabenanzeige oben im Spiel, gespeist ausschließlich aus `storyHint()` plus `storyTrigger()`. Text wie „Sprich mit … am Treffpunkt“, Ort aus dem Trigger.
- Ein- und ausblendbar, Einstellung gespeichert. Keine neuen Pfeile auf dem Schulhof.
- `WorldMap.tsx`: Zielort des Triggers hervorheben, Weg über `routeTo()`.
- `StoryPhone.tsx`, `PhoneHub.tsx`, `TimelineJournal.tsx`: nächste Geschichte und Freischaltgrund aus derselben Funktion. Dafür eine gemeinsame Hilfsfunktion `nextStepInfo(save)` in `timeline.ts` mit Test.
- Handy-Querformat prüfen: Anzeige darf Uhr, Joystick und Porträts nicht überlagern.

Fertig, wenn: drei Stellen nachweislich denselben nächsten Schritt nennen und die Anzeige auf kleinem Querformat frei liegt.

### Phase 3: Reisegerüst mit Platzhaltern (braucht nur grobe Reihenfolge)

- `story.ts`: drei neue Orte mit einfachen Platzhalterbildern, `PLACES`, `SPAWNS`, `ENTITIES`, Hindernisse, Ausgänge.
- Sechs Ereignisse wie oben, `confirmed: false`, damit der Hauptfortschritt nicht blockiert.
- Neue Animation `fade` in `StoryBeat.animation` für Ausblende und Zeitsprung.
- `BusRide.tsx` prüfen: `onDone` darf nur einmal feuern, auch bei Pause, Tab-Wechsel und Überspringen. Falls nötig mit Ref absichern und testen.
- Entwickler-Schalter (nur lokal), der die Fahrt-Ereignisse als bestätigt behandelt, damit sie durchspielbar sind.
- Tests: Kette korrekt, Fortsetzen nach Neuladen in jedem Abschnitt, Wiederholen ändert Kalender und Hauptfortschritt nicht, fortgeschrittener Spielstand bekommt die Fahrt als nächstes.

Fertig, wenn: die ganze Fahrt mit Platzhaltern von Abfahrt bis Album durchspielbar und fortsetzbar ist.

### Phase 4: Gruppen und Begleitung

- Gruppenlogik aus `actors.ts` und `school-dismissal.ts` für Reisegruppen wiederverwenden, nicht neu schreiben.
- Elias folgt mit Abstand, bleibt bei Dialogen stehen, keine Wege durch Möbel.
- Türen: versetzt eintreten.
- Ansprechen in dichten Gruppen: Blickrichtung vor reiner Nähe. Test mit vier eng stehenden Figuren.

### Phase 5: Persönliche Inhalte (braucht deine Angaben)

- Dialoge, Antworten, Albumstücke für die bestätigten Momente.
- Alles Unbestätigte bekommt `source: "staged"` und bleibt als Inszenierung gekennzeichnet.
- Danach Ereignisse auf `confirmed: true` mit echtem Datum.

### Phase 6: Grafik und Atmosphäre

- Erst Layout (Laufzonen, Türen, Sitzplätze, Kamera) mit Platzhaltern abnehmen, dann finale Bilder.
- Neue Bilder als WebP, gleiche Konventionen wie bisher (`asset-prompts.jsonl`, Vordergrundmasken in `foreground.ts`).
- Nur die passende Jahreszeit, keine vier Varianten, solange die Orte nicht frei besuchbar sind.
- Ton: Pause und Stummschaltung gelten auch für Reise und Video.

### Phase 7: Abnahme und Release

- Die 15 Punkte aus Abschnitt 11 des Konzepts abarbeiten, Ergebnisse protokollieren.
- `package.json` auf `0.95.0`, README und Versionsanzeige anpassen, Pages-Build prüfen.

## 5. Reihenfolge und Abhängigkeiten

| Phase | Kann starten | Wartet auf |
| --- | --- | --- |
| 0 Ausgangslage | sofort | nichts |
| 1 Export/Import | sofort | nichts |
| 2 Orientierung | sofort | nichts |
| 3 Reisegerüst | nach 0 | grobe Reihenfolge der Tage |
| 4 Gruppen | nach 3 | nichts |
| 5 Inhalte | nach 3 | deine Angaben |
| 6 Grafik | nach 4 | Referenzen, abgenommene Layouts |
| 7 Release | zuletzt | alles |

Kürzen bei Zeitdruck, in dieser Reihenfolge: Nebenaktionen, Minispiele, Reisevideo, zweiter Raum im Hotel. Nicht kürzen: Phasen 0 bis 3 und die Abnahme.

## 6. Was ich von dir brauche

1. **Datum oder Zeitraum** der Fahrt. Das entscheidet, ob es eine normale Einordnung ist oder eine Rückblende.
2. **Reihenfolge der Tage**: an welchem Tag Straßburg, an welchem Europa-Park, wann der Hotelabend.
3. **Anreise**: Bus oder Zug.
4. **Wer soll sichtbar sein**: Freunde, Lehrkräfte.
5. **3 bis 5 Momente**, die unbedingt rein müssen, und im Europa-Park: was habt ihr wirklich gemacht?
6. **Referenzen**: Fotos vom Hotel, Orten oder Gegenständen, falls vorhanden.

Phasen 0 bis 2 brauchen nichts davon und können direkt losgehen.
