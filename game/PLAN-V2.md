# Entwurf Version 2.0

Stand: 14.10.2026, Basis `main` nach PR 24 (Version 1.1). Das ist ein Entwurf zum Abstimmen. Nichts davon ist umgesetzt. Punkte, die deine Entscheidung brauchen, sind mit **[Frage]** markiert und stehen gesammelt in Abschnitt 9.

## 1. Worum es in 2.0 geht

1.x hat die Geschichte vollständig gemacht. 2.0 soll sie **gut** machen: Dialoge, die nach euch klingen, eine Oberfläche, die man nicht erklären muss, und Orte, die alle gleich aussehen und alle einen Zweck haben.

Ausdrücklich nicht Teil von 2.0: neue Kapitel, Mehrspieler, Online-Funktionen, ein neues Kampf- oder Punktesystem.

## 2. Ehrliche Bestandsaufnahme

### Dialoge

- **Sie klingen nicht nach euch.** Fast alle Zeilen sind vorsichtig, allgemein und erwachsen formuliert. Beispiel Valentinstag, Elias: „Was macht unsere gemeinsame Zeit für dich schön?“ So redet kein Jugendlicher mit seiner Freundin. Das liegt an der Regel „nichts erfinden“: Wo Fakten fehlen, wurden die Sätze so neutral wie möglich gemacht. Ergebnis: sicher, aber leblos.
- **Antworten haben keine Wirkung.** Wählt man in einer Szene eine Antwort, wiederholt Felice nur den gewählten Text mit einem Punkt dahinter (`Game.tsx`, Behandlung von `dialogue.choices` bei `action: "sequence"`). Elias reagiert nicht, nichts wird gespeichert, nichts ändert sich.
- **Chatabende sind zu kurz.** Jedes der sieben Themen hat genau drei Zeilen, und die dritte ist meist eine Bewertung („Ich mag, dass wir zusammen darüber nachdenken können“) statt ein Gespräch.
- **Die Nebenfiguren sind besser als die Hauptfiguren.** Paul mit seinem Döner, Jason mit Fachabi: kurz, konkret, witzig. Daran sollte sich alles andere orientieren.
- Umfang: 62 Szenenzeilen in `timeline.ts`, 7 Chatthemen mit je 3 Zeilen, rund 10 Gespräche in `conversations.ts`, dazu Objekttexte in `story.ts`.

### Oberfläche

- **Drei Namen für dasselbe:** Oben rechts steht „Erinnerungsbuch“, in der Tastenleiste „J · Album“, im Buch selbst „Unsere Geschichte“. Im Handy gibt es zusätzlich „Dein Erinnerungsalbum“ mit Link aufs „ganze Album“. Das sind zwei Einstiege und vier Namen.
- **Zu viele Panels gleichzeitig:** Ortsname, Uhr mit „Als Nächstes“, Gedankenbox, Tagesliste, Handy-Knopf, Taschen-Knopf, Buch-Knopf, Ton, Pause, Tastenleiste, Aktionskarte. Auf dem Desktop bis zu elf Elemente um das Spielbild.
- **CSS in Schichten:** 861 Zeilen CSS, verteilt auf acht Versionsklassen (`version-five`, `version-six`, `version-061` bis `version-095`), die sich gegenseitig überschreiben. Jede Änderung am HUD braucht Detektivarbeit, und genau so entstehen Fehler wie die überlappenden Namensschilder aus PR 24.
- `Game.tsx` ist 83 KB groß, fast alles hängt daran.

### Orte

19 Orte. Davon:

| Zustand | Orte |
| --- | --- |
| Gemalter Stil, passt | Felices Zimmer, Wohnzimmer, Küche, Garten, Radegast Weg, Bushaltestelle, Zörbig Markt, Schulweg, Pausenhof, Turnhalle, Gölzau Weg, Schießstand, Spielplatz, Elias’ Zimmer |
| Schlichte Pixelgrafik, passt nicht | Weihnachtsmarkt (SVG), Hotelzimmer, Jungszimmer, Europa-Park, Parlament |
| Keine einzige Story-Szene | Bushaltestelle, Zörbig Markt, Turnhalle, Gölzau Weg, Schießstand (nur Altkapitel aus V0.8) |

Fünf Orte sind reine Durchgangsstationen oder hängen nur an alten Kapiteln. Man läuft durch, ohne dass dort etwas passiert.

## 3. Was bleibt (nicht verhandelbar)

1. **Nichts Erfundenes als Tatsache.** `source` (`historical`, `staged`, `future`) bleibt Pflicht. Lockerere Dialoge heißt nicht erfundene Fakten.
2. **Stabile Ereignis-IDs.** Keine Szene wird umbenannt, sonst brechen Spielstände.
3. **Alte Spielstände laufen weiter.** 1.x-Stand wird beim ersten Start migriert, vorher automatisch exportiert.
4. Keine expliziten Inhalte.

## 4. Dialoge neu

### 4.1 Neue Stimme

Regeln für alle Texte, als kurzer Styleguide in `game/STIMME.md`:

- **Kurz.** Eine Zeile, höchstens zwei Sätze. Lange Gedanken werden zu mehreren Zeilen.
- **Konkret statt allgemein.** Lieber „Hast du noch Schokolade?“ als „Ich genieße die Zeit mit dir.“
- **Wie ihr wirklich schreibt.** Umgangssprache, Abkürzungen, Insider. Dafür brauche ich Material von dir. **[Frage 1]**
- **Gefühle zeigen, nicht ansagen.** Keine Sätze, die beschreiben, wie schön ein Moment ist. Die Szene soll das zeigen.
- **Erzähler nur, wo nötig.** „Erzählung“ höchstens einmal pro Szene, z.B. für Zeitsprünge.

**Stilprobe** (nur zur Abstimmung, Sommerszene, die als Inszenierung markiert ist):

| Vorher | Nachher (Vorschlag) |
| --- | --- |
| Elias: „So ein heller Sommertag. Lass uns ein bisschen draußen bleiben.“ | Elias: „Viel zu heiß für drinnen. Raus?“ |
| Elias: „Wir können einfach gehen und schauen, wohin unsere Gedanken führen.“ Antwort: „Über Schule und Zukunft sprechen“ | Elias: „Und, wohin?“ Antworten: „Einfach los.“ / „Eis holen.“ |
| Felice (Antwort wiederholt): „Über Schule und Zukunft sprechen.“ | Elias reagiert je nach Antwort: „Okay, du führst.“ / „Beste Idee heute.“ |
| Elias: „Nicht jeder schöne Augenblick braucht eine große Geschichte. Manchmal reicht, zusammen zu lachen.“ | (fällt weg, die Szene endet mit der Animation) |

### 4.2 Antworten mit Wirkung

- Jede Antwort bekommt eine **eigene Reaktion** (eine bis zwei Zeilen) statt der Wiederholung.
- Die gewählte Antwort wird im Fortschritt gespeichert (neues Feld `EventProgress.answers`, STORY-V09 hatte das schon vorgesehen, gebaut wurde es nie). Das Album zeigt sie später („Du hast gesagt: Eis holen“).
- **Kleine Spätfolgen**, nur bei Inszenierungen: Eine Antwort im Januar kann eine Zeile im Mai ändern. Keine verzweigte Story, nur Wiedererkennung.
- Historische Kernmomente (Geständnis, „Ich liebe dich“, erster Kuss) bekommen **keine** Wahlmöglichkeiten, die den Ablauf ändern. Was passiert ist, ist passiert.

### 4.3 Chatabende

- Pro Thema 6 bis 10 Zeilen statt 3, mit Tippanzeige, Pausen und einer Rückfrage, auf die man antwortet.
- Originalzeilen von dir werden mit `original: true` markiert und im Handy entsprechend angezeigt. **[Frage 2]**
- Die Themen bleiben (Computer, Weltall, Leben und Tod, Zukunft, Schießen, Collin, gemeinsame Interessen), solange du nichts anderes sagst.

### 4.4 Umfang pro Szene

| Szene | Vorschlag |
| --- | --- |
| Der Beginn, Alltag 10. bis 12.11. | Neu schreiben, kürzer, mehr Felice-Gedanken mit Humor |
| 12 Chatabende | Ausbauen nach 4.3 |
| Schokolade, Geständnis, Händchenhalten, „Ich liebe dich“ | Nur sprachlich überarbeiten, Kern bleibt wortgleich |
| Spielplatz, Weihnachtsmarkt, erster Kuss, Morgen danach | Überarbeiten, Familienessen bekommt echte Gesprächsfetzen, falls du welche hast |
| Neujahr, Januar, Valentinstag, März | Komplett neu schreiben, sind derzeit am leblosesten |
| Klassenfahrt (6 Szenen) | Überarbeiten, Paul und Justin bekommen mehr Text, sie funktionieren gut |
| Mai, Sommer, Herbst | Komplett neu, mit Antwortfolgen aus 4.2 |
| 08.10. und Finale | Überarbeiten. Der Schlusssatz „Unsere Geschichte ist noch lange nicht zu Ende. ❤️“ bleibt |
| Nebenfiguren (`conversations.ts`) | Behalten, pro Figur zwei bis drei Gespräche je Jahreszeit ergänzen |
| Objekttexte (`story.ts`) | Alle durchgehen, kürzen, in Felices Stimme |

## 5. Oberfläche neu

### 5.1 Ein Name, ein Ort

- **Das Handy wird die Zentrale.** Reiter: Nachrichten, Erinnerungen (das bisherige Album, voll), Tasche, Karte, Spielstand. Passt zur Geschichte, weil fast alles über Nachrichten lief.
- Das separate Buch fällt weg, die Taste **J** öffnet direkt den Reiter Erinnerungen. Überall heißt es dann nur noch **„Erinnerungen“**.
- Alte Tasten bleiben: **J** Erinnerungen, **I** Tasche, **Esc** Pause. Neu: **H** Handy.

### 5.2 Schlankes HUD

Statt bis zu elf Elementen nur noch vier:

| Position | Inhalt |
| --- | --- |
| Oben links | Eine Zeile: Ort · Datum · Uhrzeit. Tag und Jahreszeit nur im Handy |
| Über Felice | **Gedankenblase** direkt im Spielbild statt Seitenpanel, blendet nach ein paar Sekunden auf ein kleines 💭 aus, antippen holt sie zurück |
| Oben rechts | Handy, Pause (Ton ins Pausenmenü) |
| Unten rechts | Aktionskarte, nur wenn es etwas zu tun gibt |

- „Als Nächstes“ und die Tagesliste wandern ins Handy (Startseite). Die Gedankenblase sagt ohnehin dasselbe.
- Die Tastenleiste unten erscheint nur in den ersten Minuten und danach im Pausenmenü.

### 5.3 Einheitlicher Look

- Ein Satz Design-Variablen (Farben, Abstände, Schrift, Rahmen) in einer Datei `game/ui.css`, alle Panels und Dialoge benutzen nur diese.
- Die acht Versionsschichten werden abgelöst. Ziel: unter 400 Zeilen CSS, ohne `version-*`-Klassen.
- Ein Look für alle Panels, abgeleitet vom Dialogfenster, damit Handy, Pause, Tasche und Dialog sichtbar zusammengehören.

## 6. Orte neu

### 6.1 Alle im selben Stil

Die fünf Orte im schlichten Pixelstil (Weihnachtsmarkt, Hotelzimmer, Jungszimmer, Europa-Park, Parlament) brauchen neue Hintergrundbilder im gemalten Stil von Felices Zimmer und Pausenhof. Vorgehen:

1. Das alte Bild als Vorlage für Grundriss, Türen und Wege, damit Hindernisse und Ausgänge in `story.ts` stimmen.
2. Stilvorlage: `felice-bedroom-v10.webp` (innen) und `school-court-autumn-v092.webp` (außen).
3. Nach dem Einbau jeden Raum ablaufen und Hindernisse nachziehen.

Woher die Bilder kommen, ist offen: Higgsfield hat aktuell 0 Credits (grob 30 bis 40 Credits nötig), alternativ ChatGPT mit fertigen Prompts von mir. **[Frage 3]**

### 6.2 Jeder Ort hat einen Zweck

| Ort | Vorschlag |
| --- | --- |
| Radegast Weg + Bushaltestelle | **Zusammenlegen** zu einem Ort „Radegast“. Zwei Bildschirme für denselben Weg sind nur Laufarbeit |
| Zörbig Markt + Schulweg | Markt behalten als Knotenpunkt, Schulweg **zusammenlegen** oder mit einer Alltagsszene füllen **[Frage 4]** |
| Turnhalle | Behalten, Abschlussfeier fest in Kapitel 7 einordnen statt nur Altkapitel |
| Gölzau Weg + Schießstand | Weg **zusammenlegen** mit Schießstand. Schießen als freie Aktivität jederzeit, mit Bestwert |
| Spielplatz, Weihnachtsmarkt | Außerhalb der Story je eine kleine Aktivität (Schaukel, Glühweinstand mit Kinderpunsch) |
| Hotel, Jungszimmer, Parlament, Europa-Park | Nur während der Klassenfahrt erreichbar, danach über Erinnerungen wiederholbar. Kein freier Besuch, weil man 2026 ja nicht mal eben nach Straßburg fährt |
| Alle Innenräume | Pro Raum mindestens zwei Dinge, die man anschauen kann, mit Text in Felices Stimme |

Ergebnis: von 19 auf 16 Orte, dafür ohne leere Durchgänge. Zusammenlegen heißt neue Hintergrundbilder für die zusammengelegten Orte oder ein Ausschnitt aus dem vorhandenen Bild. **[Frage 4]**

## 7. Technik

1. **`Game.tsx` aufteilen**: Dialogsteuerung, Szenenablauf, HUD, Eingabe in eigene Dateien. Ohne das wird jede der Änderungen oben riskant.
2. **Dialoge als Daten**: alle Texte aus `timeline.ts`, `story.ts` und `conversations.ts` in eine Datei pro Kapitel unter `game/texte/`. Dann kann man Texte ändern, ohne Code anzufassen, und du kannst sie direkt gegenlesen.
3. **Speicherstand-Migration** `timeline.v09` → `v2`: neue Felder (`answers`, zusammengelegte Orte auf neue Orte abbilden). Alter Schlüssel bleibt unangetastet, Export wird vorher automatisch angeboten.
4. **Tests**: jede Szene hat für jede Antwort eine Reaktion, keine Zeile über zwei Sätze, kein Ort ohne Zweck, Migration mit echtem 1.1-Spielstand.
5. **Lint**: die 7 bestehenden Fehler in `Game.tsx` verschwinden mit dem Aufteilen.

## 8. Reihenfolge

| Phase | Inhalt | Braucht |
| --- | --- | --- |
| 1 | Technik 7.1 und 7.2 (Aufteilen, Texte als Daten), ohne sichtbare Änderung | nichts |
| 2 | Oberfläche 5.1 bis 5.3 | Abnahme der HUD-Skizze |
| 3 | Dialoge Kapitel für Kapitel, jeweils mit dir gegengelesen | Frage 1 und 2 |
| 4 | Orte 6.2 zusammenlegen und füllen | Frage 4 |
| 5 | Neue Bilder 6.1 | Frage 3 |
| 6 | Migration, Tests, Durchlauf am Handy, Version 2.0 | alles |

Wenn die Zeit knapp wird, in dieser Reihenfolge streichen: Spätfolgen von Antworten (4.2), Nebenfiguren-Gespräche je Jahreszeit, freie Aktivitäten auf Spielplatz und Weihnachtsmarkt. Nicht streichen: Phase 1, die neue Stimme für die Hauptszenen, das schlanke HUD, Migration.

## 9. Risiken

- **Dialoge klingen nur anders, nicht besser.** Ohne echtes Material von euch schreibe ich nur eine andere Sorte allgemeiner Sätze. Das ist das größte Risiko des ganzen Plans. Gegenmittel: Frage 1, und jedes Kapitel liest du gegen, bevor es reinkommt.
- **Spielstandbruch** durch zusammengelegte Orte. Gegenmittel: Migration mit Test und automatischem Export.
- **Bildaufwand** für fünf neue Orte plus zusammengelegte Orte. Gegenmittel: Orte erst mit vorhandenen Bildern zusammenlegen, neue Bilder ganz am Ende.
- **Großer Umbau, wenig sichtbarer Fortschritt am Anfang.** Phase 1 ändert nichts, was man sieht. Lohnt sich trotzdem, weil sonst jede spätere Phase doppelt so lange dauert.

## 10. Offene Fragen

1. **Eure Sprache:** Kannst du mir echte Beispiele geben, wie ihr schreibt und redet? Ein paar Chatzeilen, Insider, Spitznamen, typische Sprüche von Elias. Ohne das wird die neue Stimme geraten.
2. **Originalnachrichten:** Darf ich echte Chatzeilen ins Spiel übernehmen (mit `original: true`)? Wenn ja, welche?
3. **Bilder:** Higgsfield-Credits kaufen, ChatGPT mit meinen Prompts, oder vorerst bei den schlichten Bildern bleiben?
4. **Orte zusammenlegen:** Okay für Radegast (Weg + Haltestelle) und Gölzau (Weg + Schießstand)? Was soll mit dem Schulweg passieren?
5. **Handy als Zentrale:** Passt das für dich, oder soll das Buch als eigenes Ding bleiben?
6. **Termin:** Gibt es ein Datum, bis wann 2.0 fertig sein soll? Der 02.11.2026 (Ende des Kalenders im Spiel) wäre in knapp drei Wochen.
