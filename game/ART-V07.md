# Grafiken in V0.7

Vier transparente PNG-Atlanten ergänzen die vorhandenen Figuren um Ansichten von vorne, hinten und von der Seite. Sie wurden mit Imagegen anhand der bisherigen Nachbarfiguren erzeugt und im Spiel visuell geprüft. Die Quelldateien bleiben unverändert; `graphics07.ts` enthält die gemessenen Körperausschnitte.

| Datei unter `public/characters/` | Inhalt |
| --- | --- |
| `neighbors-front-v07.png` | 1254 × 1254, vier Spalten und sechs Reihen: acht Identitäten neutral, danach dieselben in Schrittphase A und B, jeweils über zwei Reihen verteilt. |
| `neighbors-back-v07.png` | 1254 × 1254, gleicher Aufbau mit echten Rückenansichten. |
| `neighbors-side-v07.png` | 1254 × 1254; die ersten vier Reihen enthalten acht linke Profilansichten neutral und in Schrittphase A. |
| `neighbors-side-step-v07.png` | 1774 × 887, vier Spalten und zwei Reihen: acht linke Profilansichten in der Gegenphase B. |

Der Gestaltungsbrief behält Kleidung, Haarfarben und Gesichter der acht bisherigen Identitäten bei: Mutter mit braunem Haar und rosa Pullover; grauhaariger Mann mit Bart und salbeifarbenem Hemd; junge Frau mit langem rotbraunem Haar und heller Strickjacke; dunkelhaariger Junge mit blauem Pullover; junge Frau mit dunklem Bob und violettem Pullover; Junge mit hellem Haar und graublauer Jacke; junge Frau mit braunem Bob und gelbem Hoodie; grauhaariger Mann mit grünem Polo. Keine Möbel, Texte oder Bodenschatten.

`WorldArt.tsx` stellt alle Ausschnitte zentriert auf dieselbe Fußlinie und Höhe. Die rechte Ansicht spiegelt ausschließlich den Körper der linken Ansicht; Namen werden nicht gespiegelt. Die neutrale Ansicht stammt aus derselben Richtungsserie wie die Schritte. Felice und Elias behalten ihre eigenen Laufzeichnungen; Sitzen und Liegen verwenden weiterhin die Ruhezeichnungen aus V0.65. Das Bett bleibt die genaue gemalte Variante mit Felice unter der Decke.

Die neun Freunde teilen weiterhin die vorhandenen acht Platzhalteridentitäten. Persönliche Aussehensangaben sind noch offen. Im Spiel ergänzte Namen ändern die Figurengrafik und ihre dauerhafte ID nicht.
