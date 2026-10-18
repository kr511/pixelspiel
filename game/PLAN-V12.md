# Plan Version 1.2: alle Bugs aus dem Testbericht

Stand: 18.10.2026, Basis `main` nach PR 27. Grundlage ist `game/TEST-V12.md`. Das ist ein Entwurf zum Abstimmen, nichts davon ist umgesetzt. Die Entscheidungen zu den offenen Fragen stehen in Abschnitt 10.

Jeder Punkt hat eine Nummer (B-01 …), damit Commits und Rückfragen darauf zeigen können. Aufwand: **S** = unter einer Stunde, **M** = halber Tag, **L** = mehr, oder es braucht neue Bilder.

## 0. Grundregeln

1. **Stabile Ereignis-IDs** bleiben, alte Spielstände laufen weiter. Wo sich Spielstand-Felder ändern, gibt es einen Test mit einem echten 1.1-Spielstand.
2. **Nichts Erfundenes als Tatsache.** Wenn Entwicklerhinweise aus dem Text fliegen (Phase 5), bleibt die Kennzeichnung trotzdem sichtbar, nur gebündelt an einer Stelle.
3. **Pro Phase ein PR**, jeder mit grünen Tests, sauberem TypeScript, Browser-Check und neu gebautem `spiel/`.
4. **Neue Tests zuerst** bei Logik-Bugs: Test schreiben, der den Fehler zeigt, dann fixen.

## 1. Phase 1: Textfehler (alles S, zusammen etwa 1 Stunde)

Reine Textänderungen in `game/timeline.ts`, `game/story.ts` und `game/conversations.ts`. Keine Logik, kein Risiko.

| Nr. | Wo | Änderung |
| --- | --- | --- |
| B-01 | Finale, `timeline.ts:398` | „Deine drei Reihen Punkte und mein ‚Ich liebe dich auch‘.“ |
| B-02 | Wochenende bei Elias, `timeline.ts:293` | „**Meine** Eltern lieben dich jetzt schon. Seit Sekunde eins.“ |
| B-03 | Valentinstag, `timeline.ts:279` | Die Frage geht an Elias: Elias „Und, wohin?“, Antworten bleiben bei Felice. |
| B-04 | Spielplatz, `timeline.ts:238` | Elias: „Naaa. Da bist du ja.“ |
| B-05 | Morgen danach, `timeline.ts:264` | „Die kleinen Kraniche in deiner Jacke …“, und Elias' erster Satz ohne Erzählerton, z. B. „Morgen. Gut geschlafen?“ |
| B-06 | Finale, `timeline.ts:399` | „Das Wochenende bei dir.“ |
| B-07 | Valentinstag, `timeline.ts:278` | „Kleine“ groß. |
| B-08 | Heimreise, `timeline.ts:349` | Antwort „Wir schreiben später“ statt „Bis morgen schreiben wir“. |
| B-09 | 06.05., `timeline.ts:353` | Antwort „Offene Details im Plan lassen“ wird z. B. „Erst mal schauen, wann es passt“. |
| B-10 | Beschreibungen | Chatabende 5–12 bekommen je eine eigene Ein-Satz-Beschreibung aus ihren Thread-Titeln (die gibt es schon in `game/texte/kapitel-1.ts`). Die drei Schulhof-Szenen bekommen eigene Beschreibungen. |
| B-11 | Weihnachten | „Kein großes Wort davor. Nur wir beide, ganz nah. Dann unser erster richtiger Kuss.“ wird eine Erzählzeile statt Felice-Satz. |

**Test:** Erweiterung von `tests/texte.test.mjs`: Kein Sprecher sagt „dein Ich liebe dich auch“, keine Beschreibung kommt doppelt vor.

## 2. Phase 2: Zeit und Logik

### B-12 Uhr während Szenen zeigt die Szenenzeit (M)

**Problem:** Neujahr läuft mit „Uhrzeit 5:50“, Weihnachten bleibt bei „12:15“, obwohl Licht und Text Mitternacht bzw. Nacht meinen. Für das Licht rechnet `Game.tsx:204` schon eine `sceneMinute` aus den Szenendaten, die HUD-Uhr zeigt aber die eingefrorene Spieluhr.

**Lösung:**
- Während einer Szene zeigt die Uhr `sceneMinute` mit dem Zusatz „Szenenzeit“ statt „Aktuelle Spielzeit · während der Szene pausiert“.
- Nach dem Abschluss springt die Spieluhr auf `max(jetzt, staging.end)`. Nach Weihnachten ist es also Abend, nach Neujahr 0:30.
- Neujahr: `staging` bleibt bei 0:00–0:30, und `sleepToStoryDay` lässt Felice am 31.12. um 23:30 aufwachen statt am 01.01. um 5:30, wenn die nächste Szene vor der Aufwachzeit beginnt. Allgemein: aufwachen um `min(WAKE_MINUTE, staging.start - 30)`.

**Dateien:** `game/Game.tsx` (Uhranzeige, Abschluss), `game/timeline.ts` (`sleepToStoryDay`, `completeEvent`).
**Test:** `tests/timeline.test.mjs`: Schlafen am 26.12. führt zu 31.12. 23:30; nach Abschluss von Weihnachten ist die Uhr ≥ 23:00.

### B-13 Story-Tage lassen sich nicht mehr verschlafen (S)

**Problem:** Am Morgen eines Tages mit Abendszene kann man schlafen gehen. Der Tag wird übersprungen, die Szene läuft am nächsten Morgen um 5:30.

**Lösung:** `goToSleep` (`Game.tsx:676`) prüft wie bei den Alltagsaufgaben: Steht `nextEvent` heute noch an, sagt Felice „Heute Abend schreibt mir noch jemand. Ich bleib noch wach.“ und schläft nicht. Statt „Schlafen gehen“ zeigt die Ruheaktion „Warten bis 17:00 Uhr“.

**Test:** `tests/timeline.test.mjs` bzw. ein neuer Helfer `canSleep(save)` mit Test für 14.11. 5:30 (nein) und 14.11. 23:10 nach dem Abend (ja).

### B-14 Morgenszenen auf dem Schulhof pünktlich erreichbar (S)

**Problem:** „Heute ab 06:40 Uhr“ plus ~50 Minuten Weg bedeutet Ankunft 7:40 mitten im Unterricht.

**Lösung:** `staging.start` der drei Schulhof-Szenen (17., 19., 21.11.) auf 6:00 bis 7:15. Zusätzlich bietet „Warten bis“ für Szenen an einem anderen Ort die Abfahrtszeit an: Zielzeit minus `travelMinutes`-Summe der Route (`routeTo` gibt es schon).

**Test:** Unit-Test für die Wartezeit-Berechnung mit Ziel Schulhof.

### B-15 Schule nach dem 12.11. (M) **[Frage 2]**

**Problem:** Ab dem 13.11. gibt es keinen Unterricht mehr. Felice besucht am Montag den Schulhof und geht heim. Nach dem Abschluss heißt es an der Tür wieder „Du gehst in den Unterricht“.

**Lösung, je nach Antwort:**
- *Variante A (klein):* Nach einer Schulhof-Szene folgt automatisch „Unterricht besuchen“ bis 13:00, wie an den Alltagstagen. Nach dem Abschluss sagt die Tür „Die Schule ist geschafft.“.
- *Variante B:* An Werktagen ohne Story gilt der normale Schulalltag weiter. Das ist größer, weil es viele leere Tage spielbar macht.

### B-16 „Weitergehen · X Min.“ mit echter Zeit (S)

**Lösung:** Der Knopf (`Game.tsx:894`) zeigt `travelMinutes(save.place, exit.to)` statt der festen 30.
**Test:** Snapshot in einem bestehenden Test: Zimmer→Wohnzimmer zeigt 5 Min., Haltestelle→Markt 20 Min.

### B-17 Turnhalle erst ab Sommer 2026 (S)

**Lösung:** Neue Konstante `GRADUATION_DAY` in `game/routines.ts`. Vorher filtert `routineEntities` alle Abschluss-Figuren und -Gegenstände in `gym` heraus. Die Uhr-Zeile „Abschlusszeugnisse · Sommer 2026“ (`activityAt` in `day.ts`) heißt vorher „Kleine Turnhalle“. Nach dem Abschlusstag wird aus „Heute bekommt ihr eure Zeugnisse“ ein Rückblick.

**[Frage 4]** Welches Datum hatte die Zeugnisübergabe?

### B-18 Weihnachtsmarkt nur im Dezember (S)

**Lösung:** `exitOpen` (`routines.ts`) öffnet den Markt nur vom 06.12. bis 26.12. jedes Jahres. Danach ist der Ausgang weg, und im Album bleibt die Erinnerung wiederholbar.

### B-19 Klassenfahrt nicht mittendrin verlassen (S)

**Lösung:** In `exitOpen`: Solange `onTrip` gilt, ist „Mit dem Reisebus nach Hause“ (`hotel → zoerbig`) geschlossen. Der Ausgang erscheint erst mit der Heimreise-Szene.
**Test:** `tests/trip.test.mjs` erweitern.

### B-20 Kleinere Logik (alles S)

- **Schlafen ab 20 Uhr:** Vor 20:00 sagt Felice „Noch zu früh zum Schlafen.“, außer an Tagen mit erledigtem Tagesablauf ist „Ausruhen bis 20:00 Uhr“ möglich. Damit verschwindet auch das „ausgeschlafen nach 14 Stunden“.
- **Freunde auf dem Hof:** Elena, Jason, Luca, Wyatt sind zwischen 7:15 und 13:00 nicht auf dem Hof (`routineEntities`, wie bei den Morgengruppen).
- **Familie zu Hause:** Mutter und Stiefvater bekommen Alltagssätze. Die Weihnachtssätze („Kommt herein“, „Heute sind wir zu acht“) gibt es nur noch in der Weihnachtsszene.
- **Jason:** Bis Sommer 2026 ein anderer Satz, „Fachabi“ erst danach.
- **Chat-Themen in Reihenfolge:** Threads eines Abends werden nach ihrer ersten Uhrzeit sortiert angeboten, und nur das nächste ist anklickbar. Oder alle frei, aber dann ohne Uhrzeit im Kopf. **[Frage 5]**
- **Einleitung Schokolade:** `dialogue[0]` erscheint beim Ankommen von Elias als Erzählzeile (`Game.tsx:417`, Index um eins verschieben).

## 3. Phase 3: Bedienung und Inszenierung

### B-21 Antworten mit Reaktion statt Echo (M)

**Problem:** `Game.tsx:486` lässt Felice den Wahltext mit Punkt sagen („Seine Hand nehmen.“, „„Du sollst mir nix kaufen“.“). Am 17.11. sagt sie dadurch denselben Satz zweimal.

**Lösung:**
- Neues optionales Feld an `StoryBeat`: `reactions?: Record<string, { speaker: string; text: string }>`. Gibt es eine Reaktion, wird sie gezeigt. Gibt es keine, wird gar nichts wiederholt.
- Wahltexte, die Handlungen sind („Seine Hand nehmen“), werden nie als Satz gezeigt.
- Die gewählte Antwort wird in `EventProgress.answers` gespeichert (das Feld gibt es schon für Chats) und im Album angezeigt.
- Reaktionen für alle 19 Auswahlstellen schreiben, je ein kurzer Satz.

**Test:** Für jede Auswahl gibt es entweder eine Reaktion oder keine Wiederholung; kein Wahltext erscheint als Felice-Zeile.

### B-22 Erzähler ohne Elias-Gesicht (S)

**Lösung:** `beat()` (`timeline.ts:155`) setzt `art` nur, wenn der Sprecher Elias ist. Für „Erzählung“ zeigt das Dialogfenster kein Porträt, sondern ein neutrales Symbol. Gleichzeitig behebt `timeline.ts:164` das Umbenennen von Nebenfiguren zu „Erzählung“: der echte Sprecher bleibt erhalten.
**Test:** Kein Schritt mit Sprecher „Erzählung“ hat `art: "elias"`.

### B-23 Figuren nicht hinter dem Dialog (M)

**Problem:** Auf dem Schulhof und auf dem Handy stehen die Sprechenden genau unter dem Dialogfenster.

**Lösung:** Solange ein Dialog offen ist, verschiebt die Kamera den Fokus (`cameraFor` in `camera.ts`) so, dass Sprecher und Felice im oberen Bilddrittel liegen. Am Desktop reicht das, wenn die Kamera nicht zoomt: dann rücken die Zielpunkte der Szenen-Schritte (`target`) etwas nach oben, wo sie am unteren Rand liegen.
**Test:** Browser-Check: Bei offenem Dialog liegt der Felice-Punkt oberhalb der Dialogkante (1280×800 und 667×375).

### B-24 Schulsachen und Foto aus dem Weg (S)

- Die „Schulsachen“ gibt es nur an Alltagstagen (`isRoutineDay`), danach nicht mehr. Damit ist der Schreibtischstuhl frei.
- Das „Foto aus Gölzau“ wandert weg von der Tür (z. B. an die Wand über der Kommode), damit E an der Tür nicht das Minispiel startet.
- Bett: Die Aktionskarte bevorzugt „Hinlegen“ vor „Bettkante“, wenn Felice in der Mitte des Bettes steht. Wenn das nicht reicht, wird die Bettkante nur noch abends angeboten.

### B-25 Wegweiser für den Alltag (S)

**Lösung:** An Alltagstagen nutzt der markierte Ausgang (`quest-exit`) die nächste offene Aufgabe: Frischmachen → Wohnzimmer, Schule → Haltestelle und Markt, Hausaufgaben → Zimmer. Dafür gibt es `routeTo` schon.

### B-26 Kleinkram (alles S)

- Die Floskel „Ein bisschen Zeit für eine Pause?“ hängt nur noch an, wenn der Satz der Person keine Frage ist, und nie bei Elias.
- Sprecher „Schule“ an der Tür ohne Personen-Porträt, mit einem Glocken-Symbol.
- Namensschilder von Felice und Elias während Szenen versetzt (Elias' Schild links, Felices rechts) oder Felices Schild in Szenen ausblenden.
- Klassenfahrt-Abfahrt: Bus als Objekt auf den Schulhof stellen oder den Schritt in „Elias am Treffpunkt treffen“ umbenennen.
- Session-Leiste: Datum ein Tag, Untertitel kurz („Kapitel 1 · 17.11.2025“).

## 4. Phase 4: Handy und Desktop

### B-27 Hinweis „Erinnerung bewahrt“ nicht über den Bedienelementen (S)

**Lösung:** In `mobile.css` sitzt der Hinweis oben mittig über dem Spielbild statt unten, schmaler und blendet nach 5 Sekunden von selbst aus.

### B-28 Chat am Desktop (S)

**Lösung:** Das einspaltige Messenger-Layout aus PR 26 gilt auch am Desktop. Das Handy-Fenster ist dort höher (bis 90 % der Bildschirmhöhe), damit mehr als zwei Nachrichten zu sehen sind.

### B-29 Tastaturhinweise nur am Desktop (S)

- Album unten, Tutorial am Anfang: Touch-Variante „Joystick zum Laufen, Aktionsknopf zum Sprechen“.
- Tutorial-Satz in drei kurze Zeilen auf drei Schritte verteilen.

### B-30 WhatsApp-Reiter online (S)

**Lösung:** Online steht nur noch „Der ganze Chatverlauf ist nur in der Version auf deinem PC.“ Ohne Befehl. Den Befehl gibt es in der README.

## 5. Phase 5: Entwicklersprache raus, Kennzeichnung bündeln (M) **[Frage 3]**

**Ziel:** Kein Hinweis für Entwickler mehr im Spieltext, aber jede Szene bleibt erkennbar als Original oder nachgestellt.

1. **Ein Symbol pro Szene** im Album und in der Session-Leiste: ❝ = Originalnachrichten, ✎ = nachgestellt, ☆ = Ausblick. Erklärung einmal im Album-Kopf.
2. **Alles andere raus.** Die Liste aus dem Testbericht (Abschnitt 5) wird abgearbeitet:
   - „Freie Dialogrekonstruktion.“ hinten an Sätzen (`story.ts`, 5 Stellen).
   - Objekttexte (Schaukeln, Regal, Achterbahn, Weg, Fahrplan, Marktstand, Parlament).
   - Album-Beschreibungen (Beziehungsdatum, Geschenke, Brief, Kraniche, Mai, Januar, Frühling, Herbst, Finale).
   - Menütexte (Tasche, Karte, Untertitel Elias' Zimmer, Handy-Hinweis, Session-Leiste).
   - Dialog-Etiketten „FIKTIONALISIERTE REKONSTRUKTION“ und „SPIELDIALOG · GESTALTETE WORTE“ werden das Symbol bzw. fallen bei Systemmeldungen weg.
3. **Test:** `tests/texte.test.mjs` verbietet Wörter wie „Rekonstruktion“, „Spielinterpretation“, „nicht erfunden“, „Spielkulisse“, „behauptet“ in allen Spielertexten außer dem einen Album-Hinweis.

## 6. Phase 6: Album, Namen, Abspann

### B-31 Keine Spoiler (S)

**Lösung:** Gesperrte Karten zeigen nur Kapitel und „Noch nicht erlebt“, kein Titel, keine Beschreibung. „Als Nächstes“ verrät weiter nur die nächste Szene.

### B-32 Ein Name überall (S) **[Frage 6]**

**Vorschlag:** „Erinnerungen“ im HUD, Pausenmenü, Album-Titel und Handy-Reiter. „Handy“ statt „Smartphone“. Das passt zum V2-Plan.

### B-33 Abspann (M)

- Rollt langsam von selbst, mit Musik (vorhandene Tonspur leise).
- Pro Kapitel ein Szenenbild (die Album-Bilder gibt es schon).
- Am Ende groß: „Also für immer?“ – „Genau so.“
- Version aus `game/version.ts`, also 1.2.

### B-34 Kleinkram (S)

- Chatabende im Handy-Reiter „Erinnerungen“ bekommen ein Mond-Symbol statt fünfmal dasselbe Zimmerbild.
- „Zum nächsten Storytag →“ nicht anzeigen, wenn heute selbst einer ist.
- Mehr Erinnerungsstücke: z. B. Pizzakarton vom Pokalabend, Bändchen vom Europa-Park. **[Frage 7]**

## 7. Phase 7: Orte und Bilder (L, braucht neue Bilder)

| Nr. | Was | Vorgehen |
| --- | --- | --- |
| B-35 | Jahreszeiten fehlen | Spielplatz Sommer/Winter gemalt, Radegast- und Schulweg-Luftbild in Winter. Bis die Bilder da sind: im Juli kein Herbstlaub, sondern die Sommer-Variante des Gartens als Platzhalter-Farbe. |
| B-36 | Stilbruch | Weihnachtsmarkt, Hotel, Jungszimmer, Parlament, Europa-Park neu im gemalten Stil (steht schon im V2-Plan). |
| B-37 | Kulisse passt nicht | Pool, See und Zelt: eigene kleine Kulissen oder die Szenen umbenennen („Nachmittag bei Elias“). |
| B-38 | Maßstab Luftbilder | Kamera-Zoom für Radegast und Schulweg erhöhen, damit Felice dort nicht als Punkt läuft. Ohne neue Bilder machbar (S). |
| B-39 | Altlasten | „Vergessenes Heft“ vom Schulhof entfernen. Schießstand-Gruppe nur am Wochenende oder abends. |

## 8. Tests, Abnahme, Release

- **Spieltest-Bot ins Repo:** Den Bot aus dem Testlauf als `scripts/playtest-bot.py` aufnehmen. Er spielt die Story über die echte Oberfläche durch und meldet Fehler, Hänger und doppelte Sätze. Laufzeit mit vier parallelen Abschnitten ~1 Stunde. Damit lässt sich jede Phase gegen Rückschritte prüfen.
- **Browser-Check** (`scripts/check-game-browser.py`) um B-23 (Dialog verdeckt nichts) und B-27 (Hinweis überlappt nichts) erweitern.
- **Version:** `game/version.ts`, `package.json`, README und HTML-Meta auf 1.2. Die stehen noch auf 0.91.
- **Abnahme:** Ein Durchlauf auf einem echten Handy im Querformat, vom Intro bis zum Abspann.

## 9. Reihenfolge

| Schritt | Inhalt | Aufwand | Braucht |
| --- | --- | --- | --- |
| 1 | Phase 1 Textfehler | ~1 Std. | nichts |
| 2 | Phase 2 Zeit und Logik ohne B-15 | ~1 Tag | Frage 4, 5 |
| 3 | Phase 3 Bedienung | ~1 Tag | nichts |
| 4 | Phase 4 Handy/Desktop | ~½ Tag | nichts |
| 5 | Phase 5 Entwicklersprache | ~½ Tag | Frage 3 |
| 6 | Phase 6 Album, Abspann | ~½ Tag | Frage 6, 7 |
| 7 | B-15, Bot, Version 1.2, Abnahme | ~½ Tag | Frage 2 |
| später | Phase 7 Bilder | offen | Bildquelle (V2-Plan Frage 3) |

Wenn die Zeit knapp wird, in dieser Reihenfolge streichen: B-33 Abspann-Ausbau, B-34, B-25 Wegweiser, B-26. Nicht streichen: Phase 1, B-12, B-13, B-21, B-22, B-23.

## 10. Entscheidungen (18.10.2026)

1. **Herbst 2026:** Ihr seid in Halle, nicht mehr an der Sekundarschule. Die Herbstszene (01.09.2026) bekommt einen neuen Ort. Bis ein Halle-Bild da ist, spielt sie an einem neutralen vorhandenen Ort (z. B. Zörbig Markt, auf dem Heimweg) und die Texte nennen Halle. **Offen:** Was macht ihr in Halle (Schule, Ausbildung)? Ein Ort dort für ein Bild?
2. **Schule:** Variante B. Jeder Werktag bis zum 26.06.2026 ist Schultag mit Unterricht 7:15–13:00, Story-Szenen gehen vor. Die drei Alltagstage am Anfang bleiben.
3. **Kennzeichnung:** Ein Symbol pro Szene im Album, alle anderen Hinweise raus.
4. **Zeugnisübergabe:** 26.06.2026. `GRADUATION_DAY = "2026-06-26"`. Danach ist die Sekundarschule vorbei (Turnhalle als Rückblick, Schultür „geschafft“).
5. **Chat-Themen:** Feste Reihenfolge nach Uhrzeit.
6. **Name:** Überall „Erinnerungen“.
7. **Erinnerungsstücke:** Es gibt echte. **Offen:** welche, mit Datum und kurzer Beschreibung.
