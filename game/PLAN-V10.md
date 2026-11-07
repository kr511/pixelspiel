# Plan Version 1.0

Stand: 13.10.2026, Basis `main` nach PR 19 (Version 0.91). Das ist ein Entwurf zum Abstimmen. Nichts davon ist umgesetzt. Alles, was ich nur vermute, steht unter "Offene Fragen" und ist im Text mit **[Frage]** markiert.

## 1. Was 1.0 bedeuten soll

1.0 ist die Version, in der die Geschichte vollständig ist: vom 01.11.2025 bis zum 02.11.2026 gibt es keinen Abschnitt mehr, der nach Platzhalter aussieht. Technisch heißt das:

- Jede Hauptszene hat echte Dialoge und ein fertiges Bild, keine Vorläufer.
- Jede Szene ist entweder bestätigt (`historical`) oder ehrlich als Inszenierung gekennzeichnet (`staged`, `future`). Erfunden wird nichts, was nicht als Inszenierung markiert ist.
- Der Spielstand lässt sich sichern und auf ein anderes Gerät mitnehmen.
- Man weiß jederzeit, wohin man als Nächstes gehen soll.
- Das Finale am 02.11.2026 ist ein richtiger Abschluss mit Abspann, nicht nur ein letztes Ereignis in der Liste.

Ausdrücklich nicht Teil von 1.0: neue Mechaniken, zusätzliche Orte jenseits der Story, Mehrspieler, Online-Funktionen.

## 2. Ausgangslage (aus dem Code)

| Bereich | Stand in 0.91 | Lücke für 1.0 |
| --- | --- | --- |
| Kapitel 1 (Nov 2025) | Chatabende, Schokolade, Geständnis, Händchenhalten, erstes "Ich liebe dich" | Texte sind teils Rekonstruktion, Originalnachrichten fehlen |
| Kapitel 2 (Dez 2025) | Spielplatz, Weihnachtsmarkt, erster Kuss, Morgen danach | Brief von Elias und Kraniche ohne Inhalt |
| Kapitel 3 (Jan 2026) | Neujahr und eine Alltagsszene | Dünn: nur zwei Ereignisse |
| Kapitel 4 (Feb 2026) | Valentinstag | Nur eine Szene, keine bestätigten Details |
| Kapitel 5 (Mär 2026) | Alte Nachrichten, Wochenende bei Elias | Wenig Inhalt zum Wochenende |
| Kapitel 6 (Apr bis Mai 2026) | Klassenfahrt (6 Szenen), Besuchsplanung, Mai | Fahrt hat vorläufige Bilder, offene Punkte laut PLAN-V095 Abschnitt 7 |
| Kapitel 7 (Jun bis Aug 2026) | Eine Sommer-Alltagsszene | Dünn: ein Ereignis für drei Monate |
| Kapitel 8 (Sep bis Nov 2026) | Herbstszene, Morgen am 08.10., Finale | Finale ist spielerischer Ausblick, noch ohne Abspann |
| Legacy | `legacy-*`-Szenen aus V0.8 mit `date: null` | Entscheiden: behalten, einordnen oder entfernen |
| Orientierung | `storyHint()` und `storyTrigger()` liefern den nächsten Schritt, aber nur verstreut | Gemeinsame sichtbare Anzeige fehlt (PLAN-V095 Phase 2) |
| Export/Import | nicht vorhanden | PLAN-V095 Phase 1 nie umgesetzt |
| Version | Anzeige "0.91" an drei Stellen im Code, `package.json` 0.9.1 | Alles auf 1.0 ziehen |

## 3. Inhaltlicher Rahmen

Die Regeln aus STORY-V09.md gelten weiter und sind hier der wichtigste Schutz vor Fehlern:

1. Bestätigte Kernaussagen kommen von dir. Alles andere wird nicht als Tatsache erzählt.
2. Ergänzte Dialoge sind sichtbar Rekonstruktion.
3. Stabile Ereignis-IDs werden nie umbenannt, sonst brechen Spielstände.
4. Keine expliziten Inhalte, keine erfundenen Personen mit Lebensgeschichte.

**Mein Vorschlag für den Umfang der Story in 1.0** (jeweils zur Abstimmung):

| Kapitel | Vorschlag |
| --- | --- |
| 1 | Bestätigte Chatzeilen im Originalwortlaut einbauen, wo du sie hast. Rest bleibt Rekonstruktion. |
| 2 | Brief von Elias als lesbares Erinnerungsstück, falls du den Text freigeben willst. Sonst bleibt er bewusst leer. |
| 3 | Ein bis zwei zusätzliche Szenen aus dem Januar, nur mit bestätigtem Inhalt. |
| 4 | Valentinstag um echte Details ergänzen, sonst unverändert. |
| 5 | Wochenende bei Elias mit mehr erkundbaren Momenten. |
| 6 | Klassenfahrt fertig: finale Bilder, eigene Busfahrt, Aussehen der Lehrer, Treffpunkte der Gruppen geklärt. |
| 7 | Sommer ausbauen: Zeugnisse und Abschlussfeier sind schon im Spiel (Turnhalle), hier sauber in die Kette einordnen. Weitere Szenen nur mit bestätigtem Inhalt. |
| 8 | Herbst, 08.10., Finale mit Abspann und Rückblick auf alle freigeschalteten Erinnerungen. |

**[Frage 1]** Was soll inhaltlich noch rein? Die Liste oben ist nur das Gerüst. Ohne deine Angaben zu Januar, Februar, Sommer und Herbst kann ich die Lücken nicht mit Fakten füllen.

## 4. Technische Arbeitspakete

### A. Abschlussarbeiten aus 0.95 (klein, unabhängig)

1. **Export/Import** (`game/savefile.ts`): alle Speicherschlüssel in eine versionierte JSON-Datei, Import validiert zuerst, schreibt danach. Details in PLAN-V095 Phase 1. Das ist vor allem wegen der Kettenänderungen in 1.0 wichtig, damit niemand seinen Fortschritt verliert.
2. **Orientierung**: eine sichtbare Aufgabenanzeige, gespeist nur aus `storyHint()` und `storyTrigger()`, gemeinsame Hilfsfunktion `nextStepInfo(save)`, dieselbe Aussage im Handy, im Album und auf der Karte. Details in PLAN-V095 Phase 2.

### B. Story-Inhalt

3. **Szenen ausbauen** nach dem Rahmen aus Abschnitt 3, Kapitel für Kapitel. Pro Szene: Dialoge, Antworten, Albumtext, ggf. Erinnerungsstück.
4. **Legacy-Szenen klären**: Anuks Ankunft, altes Weihnachtskapitel, Schulweg, Gölzau und Abschluss aus V0.8. Optionen: als eigene Nebenkapitel behalten, ins Hauptjahr einsortieren, oder aus der Kette nehmen. **[Frage 2]**
5. **Bestätigungsstatus bereinigen**: wo möglich `confirmed` und `source` auf den richtigen Wert, damit das Album ehrlich anzeigt, was Fakt und was Inszenierung ist.

### C. Klassenfahrt fertigstellen

6. Eigene Busfahrt-Szene (das vorhandene Video zeigt Radegast nach Zörbig und passt nicht).
7. Finale Pixelbilder für Hotel, Parlament, Europa-Park, Zimmer von Elias, Paul und Justin.
8. Eigene Aussehen für Frau Kaiser, Herrn Kluger, Nino, Richard.
9. Klären, wo sich die beiden Gruppen getroffen haben. **[Frage 3]**
10. `BusRide.tsx`: `onDone` darf nur einmal feuern, mit Test.

### D. Finale und Abspann

11. Neues Finale: Rückblick auf freigeschaltete Erinnerungen, Abspann, danach freies Spielen. Der Text "Unsere Geschichte ist noch lange nicht zu Ende." bleibt.
12. Album-Seite "Fertig gespielt" mit Statistik (Erinnerungen, Spielzeit) und Möglichkeit, jede Szene zu wiederholen.

### E. Qualität und Release

13. Alle Tests grün, Lint und TypeScript sauber, Pages-Build und `spiel/` neu bauen.
14. Spielstand-Migration: alter Spielstand aus 0.91 muss in 1.0 weiterlaufen. Test mit einem Speicherstand aus dem aktuellen Stand.
15. Durchlauf auf dem Handy im Querformat: von 01.11.2025 bis Abspann, ohne Sackgasse. Dazu eine Checkliste in `docs/`.
16. Version auf 1.0 in `package.json`, `README.md`, `README-QUELLCODE.md`, Startbildschirm, Album und `spiel/index.html`.

## 5. Reihenfolge

| Schritt | Pakete | Voraussetzung |
| --- | --- | --- |
| 1 | A (Export/Import, Orientierung) | keine |
| 2 | C6, C10 und Legacy-Entscheidung B4 | Frage 2 |
| 3 | B3, B5 pro Kapitel | deine Inhalte |
| 4 | C7, C8, C9 | Referenzen und Frage 3 |
| 5 | D Finale und Abspann | Schritt 3 fertig |
| 6 | E Abnahme und Release | alles |

Wenn die Zeit knapp wird, in dieser Reihenfolge streichen: Statistik-Seite (D12), neue Bilder statt Platzhaltern, Zusatzszenen in Kapitel 3, 4 und 7. Nicht streichen: Export/Import, Orientierung, Finale, Migration und Abnahme.

## 6. Risiken

- **Spielstandbruch**: neue Szenen in der Mitte der Kette verschieben "nächstes Ereignis". Mitigation: stabile IDs, Test mit altem Speicherstand, Export vorher.
- **Erfundene Inhalte**: der größte inhaltliche Fehler wäre, Unbestätigtes als Tatsache zu zeigen. Mitigation: `source`-Kennzeichnung bleibt Pflicht.
- **Bildaufwand**: finale Bilder für vier neue Orte sind der größte Brocken. Mitigation: Layout zuerst mit Platzhaltern abnehmen.
- **`Game.tsx` ist riesig**: neue Logik in eigene Module, nicht noch mehr in die Datei.

## 7. Offene Fragen

1. **Inhalt**: Was muss in 1.0 unbedingt noch vorkommen? Gibt es bestätigte Momente für Januar, Februar, Sommer und Herbst, die noch fehlen?
2. **Legacy-Szenen aus V0.8**: behalten, einsortieren oder entfernen?
3. **Klassenfahrt**: Wo habt ihr euch als getrennte Gruppen getroffen, im Parlament oder im Europa-Park? Was habt ihr im Europa-Park wirklich gemacht?
4. **Brief von Elias**: soll der Text ins Spiel, oder bleibt er bewusst privat?
5. **Finale**: Soll der Abspann nur Text sein, oder mit Fotos und Musik? Welche Fotos sind okay?
6. **Zeitrahmen**: Gibt es einen Termin, bis wann 1.0 fertig sein soll (zum Beispiel der 02.11.2026)? Das entscheidet, was gekürzt wird.
7. **Innenräume im Winter**: Soll es drinnen nachts auch deutlich dunkler sein? (Offen aus dem Nachtlicht-Update.)

## 8. Stand (13.10.2026)

Umgesetzt, ohne dass es Angaben von dir brauchte:

- **A1 Export/Import:** Pausenmenü → "Spielstand". Datei speichern und laden, mit Prüfung vor dem Schreiben und Rücksetzen bei Fehlern (`game/savefile.ts`).
- **A2 Orientierung:** `nextStepInfo(save)` in `game/timeline.ts` ist die eine Quelle. Sie erscheint als Zeile "Als Nächstes" in der Uhr-Box, im Handy (Kalender), im Album und als Ziel auf der Karte. Abschaltbar im Pausenmenü, gespeichert unter `felice-elias.ui.v1`.
- **C10 BusRide:** war schon über `finished`-Ref abgesichert, keine Änderung nötig.
- **D11/D12 Finale und Abspann:** Nach dem Finale folgt ein Abspann (`game/Credits.tsx`, Daten aus `game/credits.ts`) mit Statistik und allen erlebten Erinnerungen nach Kapiteln. Danach freies Weiterspielen. Im Album nach dem Finale: "Abspann ansehen". Der Abspann listet nur Erlebtes und erfindet nichts.
- **Version** steht jetzt an einer Stelle (`game/version.ts`), noch auf 0.91.
- Screenshots in `docs/screenshots/v10/`.

Bewusst noch nicht gemacht:

- **Versionssprung auf 1.0.** Nach Abschnitt 1 ist 1.0 "Geschichte vollständig, keine Platzhalter". Das stimmt noch nicht (Klassenfahrt-Bilder, dünne Kapitel 3, 4, 7). Der Sprung ist eine Zeile in `game/version.ts` plus `package.json`, README und HTML-Meta.
- **16 Lint-Fehler** aus den React-Compiler-Regeln in `Game.tsx` und `Player.tsx` (Refs im Render, Memoization). Bestehend, nicht neu; Umbau nur mit Browsertest des ganzen Spiels.
- Alles aus B und C6 bis C9: braucht die offenen Fragen aus Abschnitt 7.
