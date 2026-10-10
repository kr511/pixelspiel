# Grafiken in V0.65

Die fünf neuen PNG-Dateien wurden mit Imagegen erzeugt und visuell geprüft. Die bisherigen Räume und Figuren dienten als Stil- und Identitätsreferenzen. Die PNGs bleiben unverändert; die Darstellung schneidet transparente Atlasränder anhand gemessener Körpergrenzen aus.

| Datei unter `public/` | Verwendung und Gestaltungsbrief |
| --- | --- |
| `rooms/felice-bedroom-rest-v065.png` | Bearbeitung des vorhandenen Zimmers: gleiche Kamera, Einrichtung und Beleuchtung. Felice liegt flach auf dem linken Kissen; Haare liegen auf dem Kissen, Schultern, Arme, Körper und Füße verschwinden unter der vorhandenen braunen Decke. Der ganze Raum wird als passende Bettvariante dargestellt, damit kein stehender Körper aus der Decke ragt. |
| `rooms/kitchen-v065.png` | Küche im Stil des Wohnzimmers, orthografische Aufsicht. Honigfarbener Holzboden, salbeifarbene Schränke, Herd mit Wasserkocher, Spüle unter dem Fenster, Kühlschrank, Frühstückstisch mit zwei Stühlen. Die linke Mitte und untere Hälfte bleiben begehbar. |
| `characters/rest-poses-v065.png` | Transparenter 2 × 2-Atlas: oben Felice und Elias sitzend mit gebeugten Knien; unten beide flach auf dem Rücken liegend, von oben gesehen. Felice trägt Schwarz, Elias einen weißen Hoodie. Keine Möbel, Bettwäsche oder Texte. |
| `characters/neighbors-poses-v065.png` | Transparenter 4 × 4-Atlas. Reihen 1–2: die acht vorhandenen Identitäten sitzend; Reihen 3–4: dieselben Identitäten flach liegend. Kleidung, Haarfarbe und Gesichter bleiben den bisherigen Platzhaltern zugeordnet. |
| `characters/neighbors-walk-v065.png` | Transparenter 4 × 4-Atlas. Reihen 1–2: acht Identitäten in Schrittphase A; Reihen 3–4: dieselben in Gegenphase B. Das vorhandene Standbild dient als neutraler Zwischenschritt. |

Die vermessenen Ausschnitte stehen in `POSE_ATLASES` und `REST_GRAPHICS` in `graphics.ts`. Die unteren beiden Ruhezeilen sind eigene Liegezeichnungen. Elias verwendet seine eigene Liegefigur.

Die Stoffdecken sind separate SVG-Objekte mit einem einfachen Karomuster. Sie liegen unter den Figuren. Bestehende Bänke, das Sofa und die Küchenstühle werden an ihren gemalten Positionen genutzt. Neue Raumhindernisse und Vordergrundmasken folgen den tatsächlich erzeugten Möbeln. Dampf und Glanz sind kurze CSS-Animationen; sie pausieren mit dem Spiel und werden bei reduzierter Bewegung abgeschaltet.

Die persönlichen Aussehensangaben der neun Freunde fehlen weiterhin. Deshalb übernimmt V0.65 die bisherigen acht Platzhalteridentitäten auch für die neuen Haltungen und Schritte.
