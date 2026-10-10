# V0.6 – Grafikdateien und Generierungsvorgaben

Alle neuen Rasterbilder wurden mit dem eingebauten Imagegen-Werkzeug erzeugt. Stilreferenzen sind `public/rooms/felice-bedroom-v9.png` und Felices vorhandener Figurenatlas. Die gelieferten persönlichen Fotos dienten ausschließlich als Referenzen für Elias; sie wurden nicht in `public/` übernommen. Unveränderte vorhandene Grafiken bleiben Eigentum des bestehenden Projekts.

## Dateien und Raster

| Datei unter `public/` | Verwendung |
| --- | --- |
| `characters/elias-walk-v06-fixed.png` | Elias: 4 Spalten × 3 Reihen; vorne, links, hinten, rechts; Stand, Schritt 1, Schritt 2 |
| `characters/elias-portrait-v06.png` | Transparentes Dialogporträt von Elias |
| `characters/neighbors-v06.png` | 4 × 2 transparente Standfiguren: Mutter, Stiefvater, Halbschwester, deren Freund; Tochter des Stiefvaters, deren Freund, Schulfreund, Gastgeber am Schießstand |
| `characters/portraits-v06.png` | 4 × 2 Dialogporträts in derselben Reihenfolge |
| `characters/anuk-v06.png` | Anuk anhand der bisherigen Tan-/Creme-Darstellung, dunkler Maske und eingerolltem Schwanz |
| `rooms/home-v06.png` | Wohnzimmer |
| `rooms/garden-v06.png` | Garten |
| `rooms/bus-v06.png` | Haltestelle |
| `rooms/school-v06.png` | Schulhof |
| `rooms/range-v06.png` | Begehbarer Schießstand |
| `rooms/home-winter-v06.png` | Festliches Wohnzimmer am Weihnachtsabend |
| `rooms/garden-winter-v06.png` | Verschneiter Garten |
| `rooms/bus-winter-v06.png` | Winterliche Haltestelle |
| `rooms/school-winter-v06.png` | Winterlicher Schulhof |

`characters/elias-walk-v06.png` ist die erste Generierung vor Korrektur der zweiten Schrittphase; das Spiel verwendet ausschließlich die korrigierte Datei. Atlaszellen sind quadratisch. Die Figuren werden seit dem V0.61-Review auf eine gemeinsame Fußlinie mit Anker `(0.5, 1)` ausgerichtet. Die verbindlichen Größen, Zellen und Masken stehen im typisierten Katalog `graphics.ts`.

## Generierungsbrief der ursprünglichen Grafiken

Die folgenden Abschnitte halten die verwendeten Gestaltungsvorgaben zusammengefasst fest. Die wörtlichen Änderungs-/Variantenprompts stehen in [asset-prompts.jsonl](asset-prompts.jsonl).

### Elias

Transparentes Produktions-Spritesheet, vier Spalten und drei Reihen entsprechend Felices Raster. Einheitlicher Körpermaßstab und Fußstand innerhalb jeder Zelle; Kopf und Schuhe bleiben vollständig sichtbar. Hellbraune bis dunkelblonde Locken, kurze Seiten, keine Brille, kaum sichtbarer Bart, sportliche Statur. Weißer Hoodie, schwarze lange Hose, helle Sneaker. Gesicht und Haarform anhand des dritten Spiegelbilds; Hoodie anhand des gemeinsamen Fotos. Keine Telefone, Kopfhörer, Texte, Rasterlinien oder Hintergründe. Vier Richtungen in der Reihenfolge vorne, links, hinten, rechts. Zwei gegensinnige Laufphasen unter der Standreihe. Das separate Porträt zeigt dieselben Haare, Gesicht und Kleidung als freundliche Kopf-/Schulteransicht mit transparentem Hintergrund.

### Familie und Freunde

Warme, weich schattierte RPG-Figuren passend zu Felices Maßstab. Ein transparentes 4×2-Raster mit vollständig sichtbaren Körpern, Köpfen etwa bei 6% und Fußlinie etwa bei 94% jeder Zelle. Frontale neutrale Standhaltung. Unterscheidbare Gestaltung: Mutter mit braunem schulterlangem Haar und rosafarbenem Pullover; Stiefvater mit meliertem Haar und salbeifarbenem Hemd; Halbschwester mit langem rotbraunem Haar und ockerfarbener Strickjacke; deren Freund mit dunklem Haar und marineblauem Pullover. Zweite Reihe: Tochter des Stiefvaters mit dunklem Bob und pflaumenfarbenem Pullover; ihr Freund mit sandfarbenem Haar und petrolfarbener Jacke; Schulfreund mit braunem Haar und ocker-/gelber Jacke; älterer Gastgeber mit grauem Haar und grünem Poloshirt. Keine zusätzliche Person, Texte oder Trennlinien. Porträts übernehmen diese Identitäten und Reihenfolge genau.

### Anuk

Vollständige transparente Figur eines American Akita, passend zu Felices Grafikstil: tan-/cremefarbenes Fell, dunkle Gesichtsmaske, aufrechte Ohren, eingerollter Schwanz, rotes Halsband. Dreiviertelansicht nach rechts, keine Texte oder Hintergrundelemente. Persönliche Details werden in einer späteren Version anhand eigener Referenzen angepasst.

### Gemeinsame Ortsvorgaben

Ein quadratischer Produktionshintergrund pro Ort, warm und detailliert, weich gemalt, mit Holz-/Steintexturen und sanften Schatten wie im vorhandenen Zimmer. Steile orthografische 2,5D-Aufsicht, Norden oben, gesamter Ort sichtbar. Keine Horizonte, Himmel, Menschen, Hunde, UI, lesbaren Texte, Wasserzeichen oder Bildrahmen. Freie begehbare Flächen zwischen Möbeln erhalten. Keine interaktiven Bücher, Teller, Decken, Bälle, Näpfe, Hundebetten, Fotos oder Fahrpläne einzeichnen; diese rendert das Spiel separat.

- Wohnzimmer: deutsche Familienwohnung mit honigfarbenem Holzfußboden, creme-/salbeifarbenen Wänden, Sofa links oben, Tisch oben mittig und Schrank rechts oben; breite freie untere Hälfte und freie Ausgänge links/unten. Keine eingebackenen Teller.
- Garten: Hausfront oben mit Eingang bei `(50%, 19–23%)`, zwei Bäume links/rechts oben, mittlerer Steinweg und Weg nach rechts bei `(91%, 69%)`; freie Rasenfläche für Spielobjekte.
- Haltestelle: creme-/senffarbener Bus rechts oben, Wartehäuschen links oben, Straße und Bordstein oberhalb der begehbaren Pflasterfläche; freie Übergänge nach Hause links, zur Schule beim Bus und nach Gölzau rechts unten.
- Schulhof: Backsteinschule oben, mittlere Eingangstür, Bänke links/rechts, offener gepflasterter Hof und Ausgang unten mittig.
- Schießstand: helle Akustikwände, salbeigrüner Boden, Holz-/Zielträger, Fahnen und petrolfarbene Monitore im oberen Drittel. Freie Bodenfläche darunter und Ausgang unten mittig. Keine Waffen oder Personen im Hintergrund.

Generierte Möbelpositionen wurden nach Sichtprüfung im Katalog und in den bestehenden Hindernissen abgeglichen. Alle Questobjekte und Ausgänge bleiben erreichbar; die Erreichbarkeit wird im Logiktest geprüft.

## Varianten und Korrektur

Die Winterbilder bearbeiten jeweils die fertig generierte Basisszene: gleiche Kamera, Komposition, Möbel-/Baumsilhouetten, Eingänge und Wege. Schnee auf Dächern, Bäumen und Gras; Wege erkennbar frei, warmes Fensterlicht. Das Weihnachtswohnzimmer erhält Frost an den Fenstern, eine dezente Girlande und einen schlanken Baum innerhalb der rechten Schrankfläche; der Tisch bleibt ohne Teller. Die korrigierte Elias-Datei verändert die untere Laufreihe in eine entgegengesetzte Schrittphase. Die wörtlichen Prompts für diese sechs Aufträge sind in `asset-prompts.jsonl` gespeichert.

## Darstellung und Ersatzgrafiken

`WorldArt.tsx` schneidet Figuren anhand gemessener Körpergrenzen in `SPRITE_FRAMES` aus. Die transparente Umgebung und Reste benachbarter Laufbilder werden ausgeschlossen; Körperhöhe, Mitte und Fußlinie sind für alle Richtungen und Schrittphasen gleich. Hintergrund und Vordergrund sind getrennte Ebenen; geometrische Ausschnitte des identischen Raumbilds ermöglichen positionsabhängige Verdeckung. Interaktive Gegenstände bleiben einzelne SVG-Elemente aus `SceneArt.tsx`. Fehlende Raum-/Figurendateien verwenden diese bisherigen SVG-Grafiken als Ersatz.

Das vorhandene Zimmerbild und der Minispielhintergrund `goelzau-range-v1.png` bleiben erhalten. V0.6 gleicht ihre Rahmung, Beleuchtung, Figuren, Kamera bzw. Geräusche an die übrige Welt an.


## Ruheposen im V0.61-Review

`public/characters/rest-poses-v061.png` ist ein neu generierter transparenter Atlas (1254 × 1254): Felice sitzt links oben, Elias rechts oben, Felice liegt links unten. Die rechte untere Fläche bleibt frei. Die Ausschnitte sind in `REST_GRAPHICS` dokumentiert. Felices schwarzer Hoodie, schwarze Hose und lange Haare sowie Elias' weißer Hoodie und Locken übernehmen die bestehenden Figurenmerkmale.

Gestaltungsvorgabe: dieselbe warme, weich schattierte RPG-Bildsprache; vollständig sichtbare Körper; sitzend entspannte Hände auf den Knien und Füße unter den Knien; liegend Kopf oben, Füße unten, Haare auf der Unterlage und Hände am Bauch. Kein Möbelstück, Text, Raster oder Hintergrund im Atlas. Die Bettdecke wird aus der vorhandenen Zimmergrafik über die unteren Körperteile gelegt. Die Liegepose wird nicht aus einer gedrehten Standfigur zusammengesetzt.

Neue Bänke in Garten und Schießstand verwenden die ausgeschnittene gemalte Bank aus dem Schulhof. Der Wintergarten übernimmt die schneebedeckte Variante. Die bereits im Hintergrund vorhandenen Bänke an Haltestelle und Schule werden direkt benutzt.
