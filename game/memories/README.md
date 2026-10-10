# Felices Erinnerungen

Der aktive Raum bleibt in `game/Game.tsx`. Bewegung, Kollisionen, Kamera und die vorhandenen Charakter-Sprites werden weiterverwendet. Das Erinnerungssystem ergänzt nur Interaktion, Szenenwechsel und Fortschritt. Die älteren Three.js-Komponenten sind unberührt.

## Spielen

1. Zimmer betreten; mit WASD, Pfeilen oder dem Touch-Joystick zum Foto am rechten Regal gehen.
2. In der Nähe `E` drücken oder **Anschauen** antippen.
3. **In Ruhe anfangen**: pro markierter Scheibe drei Schüsse, insgesamt neun.
4. Mit Maus oder Pfeilen/WASD zielen, mit Klick oder Leertaste schießen. Auf Touchgeräten direkt die Scheibe antippen. Ein leichtes, sichtbares Schwanken macht das Zielen lebendig.
5. Zehn Ringe ergeben 1–10 Punkte; außerhalb der aktiven Scheibe gibt es 0. Ein kurzes Nachladeintervall verhindert versehentliche Doppelschüsse. Es gibt weder Zeitlimit noch Mindestpunktzahl.
6. Im Ergebnis **Erinnerung mit nach Hause nehmen** wählen. Das speichert den Abschluss und zeigt eine Medaille neben dem Foto. Erneutes Spielen ist über dasselbe Objekt möglich.

`Esc` und die Pausetaste sperren Bewegung und Schüsse. **Verlassen** bzw. **Zurück ins Zimmer** vor dem Ergebnis verändern keinen Fortschritt. Felices Position und Blickrichtung im Zimmer bleiben beim Szenenwechsel erhalten. Sehr kurze Richtungstastendrücke führen nun ebenfalls einen Schritt aus; gehaltene Tasten verwenden den bisherigen Bewegungstakt.

## Kleine, wiederverwendbare Bausteine

- `catalog.ts`: ID, Name, Objektposition, erreichbarer Interaktionspunkt, Radius, Szene und Zimmer-Effekt. Abschlussdaten stehen getrennt im Spielstand.
- `store.ts`: Zustand mit `room → entering → memory → leaving → room`; lädt und speichert Fortschritt, blockiert mehrfache Übergänge und leert Bewegungseingaben.
- `MemoryTransition.tsx`: weicher Fade/Blur mit Überschrift. Bewegungsreduzierung des Betriebssystems wird berücksichtigt.
- `RoomMemories.tsx`: Erinnerungsobjekte und ihre sichtbaren Belohnungen.
- `ShootingMemory.tsx`: die vollständige Luftgewehr-Erinnerung; feste Koordinaten im SVG sorgen bei jeder Bildschirmgröße für dieselbe Trefferwertung.
- `shooting.ts`: unabhängige Schuss- und Ringwertung, drei Bahnen à drei Schüsse.
- `progress.ts`: versioniertes Speicherformat, Validierung und Bestwerte.

## Weitere Erinnerungen – insbesondere der Hund

Der deaktivierte Minispiel-Eintrag `dog-arrival` bleibt eine ältere technische Vorlage. Das spielbare Anuk-Kapitel gehört seit V0.5 zum separaten Storysystem in `game/story.ts`; insgesamt gibt es vier Kapitel. Diese Vorlage aktiviert keine zusätzliche Geschichte.

Für die nächste Erinnerung:

1. Eigene Szenenkomponente mit `blocked`, `onComplete(score)` und `onLeave()` erstellen. Eine reine Story kann `onComplete(0)` verwenden.
2. Die Szene anhand von `activeMemory.scene` in `Game.tsx` einhängen. Erst danach den Katalogeintrag aktivieren.
3. Den Zimmer-Effekt anhand der abgeschlossenen Erinnerung darstellen. Für den Hund eine eigene `RoomDog`-Komponente einhängen, wenn `progress["dog-arrival"]` existiert; Schlafen, Laufen oder Folgen bleibt darin gekapselt. Den Hund nicht im dauerhaften Hintergrundbild einbauen.
4. Den Interaktionspunkt auf begehbaren Boden neben dem Gegenstand setzen. `object.x/y` ist die Darstellung, `object.approach` Felices erreichbarer Standort.

Für neue Story-Inhalte sind damit weder neue Speicherlogik noch Änderungen an Zimmerkollisionen oder Kamera nötig. Eine neue Minispielmechanik braucht lediglich ihre eigene Szenenkomponente.

## Speicherung

Der Schlüssel `felice-elias.memories.v1` in `localStorage` speichert pro ID das erste Abschlussdatum, die Anzahl abgeschlossener Besuche und den besten Punktestand. Das bleibt nach Browser-/Spielneustart erhalten, solange die Browserdaten bestehen. Es gilt für denselben Browser und dieselbe Adresse inklusive Port; es gibt keine Cloud-Synchronisierung.

Ein abgebrochener Durchgang speichert keinen Abschluss. Erneutes Spielen überschreibt keinen besseren Bestwert. Unlesbare oder unbekannte Spielstände werden nicht still überschrieben. Falls Browserdaten gesperrt oder voll sind, zeigt das Spiel einen Hinweis mit einer Möglichkeit zum erneuten Speichern; die Sitzung bleibt spielbar.

## Grafik und Ton

`public/rooms/goelzau-range-v1.png` ist eine mit dem eingebauten Imagegen-Werkzeug erzeugte Pixelinterpretation des vom Nutzer bereitgestellten Hallenfotos. Vorbild sind helle Wände, grünlicher Boden, Fahnen, Deckenmonitore und die Bahnenanordnung. Die Person und die Pistole aus dem Foto werden nicht übernommen. Das Sport-Luftgewehr im Vordergrund und die interaktiven Scheiben sind einfache SVG-Spielgrafiken. Die Darstellung ist eine persönliche Spielszene, kein maßstabsgetreuer Nachbau.

Seit V0.6 erzeugt `game/audio.ts` dezente Web-Audio-Geräusche ohne Sounddateien oder neue Abhängigkeiten. Angenommene Luftgewehrschüsse lösen den Schussklang aus; Pause, verborgene Tabs und die separat gespeicherte Stummschaltung sperren den Ton. Die Schusswertung bleibt unverändert.

Finaler Bildprompt (eingebautes Imagegen, Foto als Referenz):

> Use case: stylized-concept. Create a NEW landscape 3:2 pixel-art videogame background based on the attached reference photograph. The photo is a location reference ONLY, not an edit target. Reproduce the recognizable indoor German sport shooting hall: pale cream acoustic walls, muted sage green glossy floor, wooden horizontal target rail and wooden roof supports, high steel ceiling beams, small teal electronic monitors above, hanging regional red-white flags and blue EU flag. Nostalgic warm afternoon lighting, crisp pixel-art texture matching a cozy personal 2D memory game, detailed pixel clusters, not photorealistic. Camera from the firing line looking straight toward three target lanes. Empty light wall and target mounting rail across middle around 40 percent image height, target cards will be placed by code at x26%,50%,74%, y44%. Leave these positions clear with no baked-in targets. Foreground bottom edge has gray padded firing table. No people, NO pistol, no weapon (the game will separately show Felice's AIR RIFLE), no UI, no legible text, no watermarks. Preserve the specific bright sports-hall character of this photograph, not a wooden hunting cabin.

## Prüfen

```powershell
npm test
npx tsc --noEmit
npx eslint game/Game.tsx game/GameUI.tsx game/input.ts game/memories tests/memories.test.mjs
npm run build
```

Die Logiktests verwenden den bestehenden Node-Runtime ohne zusätzliche Pakete. Sie prüfen Ringgrenzen und Fehlschüsse, Munition/Bahnwechsel, Interaktionsreichweite, deaktivierte Erinnerungen, Speichern/Neuladen, Wiederholungen und Fehler beim Speichern. Zusätzlich den beschriebenen Gameplay-Loop im Browser durchspielen, einschließlich Pause, vorzeitigem Verlassen und Neuladen.
