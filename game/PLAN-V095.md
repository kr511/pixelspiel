# Umsetzungsplan 0.95

Stand: 11.10.2026, Basis `38b4a12` (main). Grundlage ist das Konzept „Felice × Elias World – großer Entwicklungsplan für Version 0.95“. Dieses Dokument übersetzt das Konzept in konkrete Arbeitsschritte am vorhandenen Code. Nichts davon ist schon umgesetzt.

## 1. Ehrliche Einschätzung des Konzepts

Das Konzept ist inhaltlich vernünftig, aber zu breit und an einigen Stellen ungenau:

- **Datum ist geklärt: 20.04.2026 (Montag) bis 24.04.2026 (Freitag), fünf Tage.** Die Hauptgeschichte in `game/timeline.ts` ist eine automatische Kette: `mainline` wird nach Datum sortiert und jedes Ereignis bekommt `requires: [vorheriges]`. Die Fahrt landet damit in Kapitel 6 „Gemeinsame Zeit“ zwischen `spring-everyday` (01.04.) und `longer-visit-plan` (06.05.). Keine Rückblende, keine Erweiterung des Storyzeitraums nötig. Der Tagesablauf steht ebenfalls (siehe Abschnitt 3). Die Ereignisse bleiben trotzdem `confirmed: false`, bis die Inhalte drin sind.
- **Drei neue begehbare Karten plus 15 bis 25 Minuten Spielzeit ist viel.** Jede Karte braucht Bild, Kollisionen, Vordergrundmaske, Spawns, Ausgänge und Prüfung auf dem Handy. Das ist der teuerste Teil des Updates. Ankunft in Kehl wird deshalb keine eigene Karte, sondern ein Übergang ins Hotel.
- **Export/Import ist im Konzept P1, gehört aber nach vorne.** Die Klassenfahrt verändert die Ereigniskette und damit Speicherstände. Ein Export vorher ist das Sicherheitsnetz. Außerdem ist es klein und unabhängig.
- **„Orientierung“ braucht kein neues System.** `storyHint()` und `storyTrigger()` liefern schon den nächsten Schritt mit Ort und Text. Die Aufgabenanzeige wird nur eine sichtbare Fassung davon, damit Welt, Handy und Album garantiert dasselbe sagen.
- **Die Zahl 107 ist veraltet.** Aktuell laufen 111 Tests, alle grün.

## 2. Befunde aus dem Code

| Befund | Folge |
| --- | --- |
| `npm test` bricht unter Node 22.22 mit `bad option: --test-isolation=none` ab. CI nutzt Node 24 und läuft. `package.json` verspricht aber `node >= 22.13`. | Schritt 0: Skript auf `--experimental-test-isolation=none` umstellen oder `engines` auf 23+ anheben. Lokales Testen muss funktionieren. |
| `eventStatus()` sperrt alles vor `STORY_START` (10.11.2025) und nach `STORY_END` (02.11.2026). | Die Fahrt (20. bis 24.04.2026) liegt im Zeitraum, keine Änderung nötig. |
| `spring-everyday` hat `until: "2026-05-05"` und den Text „April & Anfang Mai“. | Beschreibung so anpassen, dass sie die Klassenfahrtwoche nicht überdeckt. |
| `longer-visit-plan` (06.05.) plant „mehrere Tage zusammen“. | Dialog dort darf nicht klingen, als hätten die beiden noch nie mehrere Tage miteinander verbracht. Klar als privater Besuch abgrenzen. |
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
- Mehrtägig ist kein Sonderfall: jedes Ereignis bekommt sein echtes Datum zwischen 20. und 24.04.2026. Für Tage ohne eigenen Moment springt der Kalender per Schlafübergang weiter.

Bestätigter Ablauf und geplante Ereignisse (IDs stabil):

| Tag | Datum | Ereignis | Inhalt |
| --- | --- | --- | --- |
| Mo | 20.04.2026 | `klassenfahrt-abfahrt` | Treffpunkt, Gruppe, Bus hin über `BusRide.tsx`, überspringbar. |
| Mo | 20.04.2026 | `klassenfahrt-ankunft-kehl` | Ankunft am B&B Hotel in Kehl, kurzer Innenraum, Orientierung. |
| Di | 21.04.2026 | `klassenfahrt-strassburg` | Besuch im Europäischen Parlament (bestätigt). Kompakter Bereich, 2 bis 4 Interaktionen. |
| Mi | 22.04.2026 | (Schlafübergang) | Zweiter Straßburg-Tag nur als eigenes Ereignis, wenn es einen eigenen Moment gibt. Sonst Kalender springt weiter. |
| Do | 23.04.2026 | `klassenfahrt-europapark` | Kompakter Parkbereich: gemeinsam rumlaufen, Achterbahn fahren (bestätigt). Welche Achterbahn, bleibt offen; die Fahrt wird als kurze Inszenierung gezeigt, kein Nachbau einer echten Bahn. |
| Do | 23.04.2026 | `klassenfahrt-hotelabend` | Ruhige Szene im Hotel, Ausblende, Übergang zum Morgen. Nichts Explizites, kein Albumtext dazu. |
| Di/Mi | 21./22.04.2026 | `klassenfahrt-zimmerabend` | Fußball schauen im Zimmer von Elias, Paul und Justin, Pizza bestellen, die drei klopfen als Streich an andere Türen. Felice ist im Zimmer dabei (bestätigt). Spielbar am Dienstagabend; Mittwochabend als kurze Wiederholung oder Erzählung, damit nicht zweimal dasselbe gespielt wird. |
| Fr | 24.04.2026 | `klassenfahrt-rueckkehr` | Bus zurück, Albumkarte „Unsere Klassenfahrt – Straßburg, Kehl & Europa-Park“, 20.–24.04.2026. |

Europa-Park und Hotelabend liegen am selben Tag: `staging.start` des Hotelabends muss nach dem Ende des Parkbesuchs liegen, `order` regelt die Reihenfolge. Rückweg vom Park zum Hotel nur als kurzer Übergang, keine zweite Busfahrt.

Europäisches Parlament: Das Gebäude ist bestätigt, was drinnen passiert ist, nicht. Deshalb zeigt die Szene den Außenbereich am Wasser mit dem markanten Rundbau, erkennbar, aber ohne exakte Nachbildung. Keine erfundene Führung, keine Plenarsitzung, keine Zitate, bis du mehr erzählst. Ein Innenraum kommt nur rein, wenn es dazu einen echten Moment gibt.

**Beteiligte (bestätigt):** Fahrt der beiden 10. Klassen mit Frau Kaiser und Herrn Kluger. Elias teilt sich das Zimmer mit Paul und Justin. Außerdem dabei: Wyatt, Elena, Luca, Jason, Nino, Richard und weitere Mitschüler.

| Figur | Stand im Spiel | Arbeit |
| --- | --- | --- |
| Paul, Justin, Wyatt, Elena, Luca, Jason | Sprites und Sprecherzuordnung vorhanden (`graphics.ts`) | Wiederverwenden, nur neue Dialoge |
| Nino, Richard | fehlen | Neue Sprites, Porträts, Eintrag in `speakerGraphic` |
| Frau Kaiser, Herr Kluger | fehlen | Neue Sprites und Porträts; starten die Abfahrt und sammeln die Gruppe bei Ortswechseln |
| Weitere Mitschüler | generische `friend`-Figur | 4 bis 6 Hintergrundfiguren ohne Namen, nur warten, mitgehen, sitzen |

Nicht alle Figuren stehen in jeder Szene. Pro Szene nur die, die dort wirklich etwas tun, sonst wird es auf dem Handy unübersichtlich und das Ansprechen in dichten Gruppen klappt nicht mehr. Busabfahrt und Bus sind die einzigen Szenen mit der vollen Gruppe.

**Zimmerabend:** Felice war dabei, die Szene wird also normal aus ihrer Sicht gespielt. Fußball: DFB-Pokal-Halbfinale Bayer Leverkusen gegen FC Bayern (bestätigt), laut DFB 0:2. Das Spiel kommt an den Abend, an dem es tatsächlich lief; die DFB-Quellen nennen teils den 21., teils den 22.04., daher vor dem Einbau einmal klären. Klopfstreich bleibt harmlos und lustig, keine erfundene Erwischt-Szene mit den Lehrkräften.

Busfahrt hin und zurück nutzt dieselbe Komponente. Deshalb muss die doppelte Abschlussauslösung in `BusRide.tsx` vorher sauber getestet sein.

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
| 3 Reisegerüst | nach 0 | nichts mehr, Datum und Ablauf stehen |
| 4 Gruppen | nach 3 | nichts |
| 5 Inhalte | nach 3 | deine Angaben |
| 6 Grafik | nach 4 | Referenzen, abgenommene Layouts |
| 7 Release | zuletzt | alles |

Kürzen bei Zeitdruck, in dieser Reihenfolge: Nebenaktionen, Minispiele, Reisevideo, zweiter Raum im Hotel. Nicht kürzen: Phasen 0 bis 3 und die Abnahme.

## 6. Was ich von dir brauche

1. ~~Datum~~: 20.04. bis 24.04.2026, erledigt.
2. ~~Reihenfolge~~: Mo Anreise, Di und Mi Straßburg, Do Europa-Park und Hotelabend, Fr Rückreise. Erledigt.
3. ~~Anreise~~: Bus hin und zurück. Erledigt.
4. ~~Beteiligte~~: Frau Kaiser, Herr Kluger, Paul, Justin. Erledigt.
5. **3 bis 5 Momente**, die unbedingt rein müssen, und im Europa-Park: was habt ihr wirklich gemacht?
6. **Referenzen**: Fotos vom Hotel, Orten oder Gegenständen, falls vorhanden.

Phasen 0 bis 2 brauchen nichts davon und können direkt losgehen.
