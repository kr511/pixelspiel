# Storysystem V0.9 – Unsere gemeinsame Geschichte

`timeline.ts` ergänzt `story.ts`, `day.ts` und die vorhandenen Memory-Komponenten. Die spielbare Welt, Bewegung, Kollisionsprüfung, Kamera, Charakteratlanten, Ruheanimationen, vier Jahreszeiten, Audio-Stummschaltung, Namen und das Schießspiel werden weiterverwendet. Alle acht Storykapitel laufen direkt in `Game.tsx`; es gibt keine separaten Demonstrationsseiten.

## Acht Kapitel im gemeinsamen Jahr

Der Kalender reicht vom **01.11.2025 bis 02.11.2026**. Der nächste Storytag lässt sich erzählerisch erreichen, ohne jeden Zwischentag einzeln spielen zu müssen. Freies Erkunden bleibt zwischen den Erinnerungen möglich.

1. **November 2025 – Alles beginnt:** Einführung am 1. November, zwölf Chatabende vom 13. bis 24. November, Schokoladentreffen am **16. November**, kurze Schul- und Alltagsszenen, Felices Liebesgeständnis am 24. November um **17:20 Uhr**, Händchenhalten und die beiderseitigen schriftlichen Liebesnachrichten am 25. November.
2. **Dezember 2025 – Unsere ersten romantischen Momente:** Spielplatz mit Parkbank und Umarmungen am 1.–2. Dezember, Weihnachtsmarkt am 6. Dezember, Familienessen und erster richtiger Kuss am 25. Dezember, der Morgen danach mit Brief und gefalteten Kranichen am 26. Dezember.
3. **Januar 2026 – Ein neues Jahr:** Neujahrsnachricht und Wünsche um Mitternacht sowie eine ausdrücklich inszenierte Alltagsszene für den Januar.
4. **Februar 2026 – Unser erster Valentinstag:** gemeinsame Zeit am 14.–15. Februar. Unbestätigte Geschenke oder konkrete Unternehmungen werden nicht ergänzt.
5. **März 2026 – Unsere Erinnerungen:** alte Nachrichten und ein Rückblick am 18. März; ein Wochenende bei Elias am 20.–22. März mit erkundbarem Zimmer.
6. **April & Mai 2026 – Gemeinsame Zeit:** inszenierter Alltag, Planung eines längeren Besuchs am 6. Mai und spielerische Möglichkeiten für den 14.–17. Mai. Die Möglichkeit wird nicht als tatsächlich durchgeführter Besuch ausgegeben.
7. **Juni–August 2026 – Unser Sommer:** spielbare Alltagsszenen in der vorhandenen Sommerjahreszeit. Sie behaupten keine zusätzlichen belegten Ausflüge.
8. **September–November 2026 – Ein Jahr voller Erinnerungen:** inszenierte Herbstszene, ein liebevoller Morgen am 8. Oktober und ein ausdrücklich spielerischer Ausblick am 2. November. Das Finale endet mit „Unsere Geschichte ist noch lange nicht zu Ende. ❤️“ und öffnet das Album.

## Historische Angaben und Inszenierung

Die jüngsten Angaben bestimmen die historische Zuordnung. Das Schokoladentreffen liegt deshalb am **16.11.2025** statt am zuvor genannten 19. November. Die ursprüngliche Ereignis-ID `radegast-chocolate` bleibt für bestehende Speicherstände stabil. Die Begegnung wird zwischen dem Chatabend des 15. und dem des 16. November erlebt. Exakte Uhrzeit, Koppellayout, Pausen und übriger Wortlaut sind Spielgestaltung.

Bestätigte Kernaussagen stammen aus dem Auftrag. Ohne Originalnachrichten werden ergänzte Formulierungen sichtbar als Rekonstruktion behandelt. Die beiden „Ich liebe dich.“-Nachrichten tragen `original: true`; keine weiteren Chatzeilen werden als wortgetreue Originalnachrichten ausgegeben. Die zwölf Chat-Episoden teilen den belegten Zeitraum spielerisch ein; ihre Themenzuordnung pro Abend ist keine historische Behauptung. Die sieben Themen umfassen Computer, Weltall, Leben und Tod, Zukunft, Schießen, Collin und gemeinsame Interessen. Zu Collin werden keine unbekannte Identität oder Lebensumstände ergänzt.

Jedes Ereignis besitzt einen `source`:

- `historical`: bestätigte Kernaussagen und Datum beziehungsweise Zeitraum; Ablauf, Kulisse und ergänzte Dialoge bleiben als Rekonstruktion gekennzeichnet.
- `staged`: spielbare Alltagsszene. Das Datum steuert technisch den Kalender; das Album zeigt den Zeitraum und die Kennzeichnung **Inszenierung**.
- `future`: spielerischer Ausblick. Die Tage nach dem 8. Oktober werden nicht als abgeschlossene historische Meilensteine dargestellt.

Der Brief von Elias und Felices gefaltete Kraniche erscheinen als anklickbare Erinnerungsstücke. Brieftext, Farbe, Zahl und andere unbekannte Details werden nicht erfunden. Ein offizielles Beziehungsdatum wird nicht behauptet.

## Daten und Erweiterung

`StoryEvent` enthält stabile `id`, `date` / optionales `until` beziehungsweise `period`, Kapitelnummer, Schauplatz, Beteiligte, Szenentyp, `requires`, Bestätigungsstatus, Quelle, Dialogdaten, Interaktionsfolge, Illustration, Beschreibung und Inszenierungszeiten. Mehrstufige Szenen verwenden `steps: StoryBeat[]` mit Zielposition, Sprecher, Text, Emotion, möglichen Antworten, optionalem Ortswechsel und Animation. Erinnerungsstücke stehen optional in `artifacts`.

Die Szenentypen `chat`, `encounter`, `love`, `confession`, `message` und `sequence` nutzen die gemeinsame Kalender- und Speicherlogik. `sequence` verbindet tatsächliche Bewegung zu Markierungen mit Dialog und Animation, einschließlich mehrerer Innenräume beim Weihnachtsbesuch. Neue Ereignisse gehören in `STORY_EVENTS`; IDs vorhandener Erinnerungen dürfen nicht umbenannt werden. Die Sortierung verwendet Datum und `order` für Ereignisse am selben Tag. Der chronologische Vorgänger bestimmt die Freischaltung. Bereits gespeicherte Abschlüsse bleiben auch erhalten, wenn früher liegende Ereignisse später ergänzt werden.

Der Abschlusszustand steht separat in `TimelineSave.progress[id]` mit Checkpoint, gewählten Themen, Nachrichtenschritt, Texteingabefortschritt, Antworten, erstem tatsächlichen Spielabschluss und Besuchszähler. Historische Daten werden niemals aus `completedAt` abgeleitet. Unbekannte gültige Ereignis-IDs in gespeicherten Fortschritten bleiben erhalten.

## Dialog, Handy und Erinnerungsalbum

`DialogueBox.tsx` und `dialogue.ts` übernehmen Typografie, Schreibmaschinenanimation, Antworten sowie Enter, Leertaste, Mausklick und Touch. Der erste Eingabeschritt zeigt einen noch laufenden Text vollständig; danach wird weitergeschaltet. Das jeweilige Pixelporträt steht links oberhalb der unteren Dialogbox. `PixelPortrait.tsx` verwendet vorhandene Charaktergrafiken und acht unterscheidbare Emotionen: neutral, glücklich, verliebt, verlegen, traurig, lachend, nachdenklich und überrascht. Weitere NPCs erhalten eigene stabile Porträtvarianten.

`StoryPhone.tsx` verbindet interaktive Chat-Episoden und geskriptete Nachrichten mit dem vorhandenen Sitzsystem. `PhoneHub.tsx` öffnet das Handy auch außerhalb einer Chat-Erinnerung. Nachrichten, Verlauf, Kalender und Erinnerungen sind bedienbare Tabs. Der Verlauf zeigt die tatsächlich bereits gelesenen Zeilen. Weitere Storyereignisse können eine laufende Szene nicht gleichzeitig ersetzen.

`TimelineJournal.tsx` erweitert das vorhandene Buch unter dem Titel **Unsere Geschichte**. Alle acht Kapitel zeigen ihre Erinnerungen chronologisch mit Datum oder Zeitraum, Illustration, persönlichem Text, Quelle und Status. Gesperrte Bilder erscheinen als Silhouetten. Abgeschlossene Erinnerungen besitzen eine Wiederholungsfunktion. Bestehender Ortsplan, Namensverwaltung und alte Kapitel bleiben im Album erhalten.

## Getrennte Zeiten und lokale Speicherung

- **Aktuelle Spielzeit:** `TimelineSave.clock` mit vorhandener `DaySave`-Struktur. Neuer Start am 01.11.2025 um 5 Uhr. Aktionen und Schlaf bleiben innerhalb des Story-Zeitraums. Die vier bestehenden Jahreszeiten werden automatisch aus dem Kalender synchronisiert; die bisherigen Licht- und Wintergrafiken bleiben erhalten.
- **Historischer Szenenzeitpunkt:** `StoryEvent.date` und eigene szenische Uhrzeit. Während einer Erinnerung ist der normale Kalender pausiert. Der erste Abschluss kann die aktuelle Spielzeit bis zum Ende des Ereignisses vorwärts bringen; er dreht sie niemals zurück.
- **Wiederholung:** flüchtiger eigener Zustand mit Ausgangsposition und Blickrichtung. Kein Checkpoint einer Wiederholung überschreibt den echten laufenden Fortschritt oder die aktuelle Uhrzeit. Abschluss erhöht nur den Besuchszähler und behält den ersten Abschluss bei.
- **Fortsetzen:** die aktive erste Erinnerung und ihre Checkpoints werden im Kalender-Schlüssel atomar mit dem Fortschritt gespeichert. Neuladen setzt die Dialog-, Themen- oder Schrittfolge fort. Unterbrechen behält den Checkpoint; ein abgebrochener Durchgang erhält keinen Abschluss.
- **Migration:** alte Kapitelabschlüsse und die bestehende Schießmedaille werden mit dem Marker `legacy` übernommen. Alte Schlüssel werden nicht gelöscht. Der alte Tages-Schlüssel bleibt unverändert; ab V0.9 ist `felice-elias.timeline.v09` maßgeblich. Kalenderdaten innerhalb des erlaubten Zeitraums bleiben erhalten, während die Saison daraus abgeleitet wird. Namen, Kapitelaktionen und Schießbestwerte benutzen ihre bestehenden Speicherfunktionen.

Gespeicherte Kalender werden strikt validiert. Unlesbare oder unbekannte Versionen bleiben unangetastet. Bei gesperrtem oder vollem Browser-Speicher bleibt die Sitzung spielbar und zeigt einen Hinweis mit erneutem Speicherversuch.

## Bestehende Kapitel und Welt

Anuks Ankunft, das ursprüngliche Weihnachtskapitel, der gemeinsame Schulweg, Gölzau und der Abschluss aus V0.8 bleiben als `legacy-*`-Szenen mit `date: null` erhalten. Bereits vorhandene Spielabschlüsse gelten weiterhin als erhaltene Entwurfsabschlüsse und begründen kein historisches Datum. Der bekannte grobe Zeitraum **Sommer 2026** beim Abschluss bleibt erhalten. Der alte Weihnachtsabschluss setzt den neu bestätigten ersten Kuss nicht automatisch auf abgeschlossen.

Die zwölf vorhandenen Orte behalten ihre Verbindungen und Mechaniken. Spielplatz, Weihnachtsmarkt und Elias’ Zimmer ergänzen die Welt mit Hin- und Rückwegen. Ihre Karten und Einrichtungen sind Spielinterpretationen. Die neuen drei Orte sind auch außerhalb der Story erkundbar und im bestehenden Ortsplan sichtbar. Persönliche Gespräche, Hundekissen-Migration und die drei Abschlussfotos aus V0.8 bleiben erhalten.

## Audio und Assets

Die vorhandenen Zimmer-, Welt- und Charakterdateien werden weiterverwendet. `StoryWorldArt.tsx` ergänzt Pixelillustrationen für Koppel, Pferde, Fahrrad, Schokolade und Handy. Die neuen SVG-Szenen unter `public/rooms/story-*-v09.svg` ergänzen Spielplatz, winterlichen Spielplatz, Weihnachtsmarkt und Elias’ Zimmer. `resolveStoryIllustration` in `PhoneHub.tsx` löst symbolische Illustrationsnamen gemeinsam für Handy und Album auf.

`StorySequence.tsx` inszeniert Begegnungen, Umarmung, Händchenhalten, Sitzen, Feuerwerk, Rückblick und den ersten Kuss. Rückblicke zeigen nur tatsächlich freigeschaltete Erinnerungen. `WorldAudio` verwendet die vorhandene synthetische Atmosphäre mit leisen Abend- und Liebesmelodien; es gibt keine neuen Musikdateien oder Abhängigkeiten. Vorhandene Pause-, Hintergrund- und Stummschaltungsregeln gelten weiterhin.
