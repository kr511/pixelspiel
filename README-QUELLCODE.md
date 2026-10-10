# Felice × Elias World

Version **0.9** erweitert das vorhandene mobile 2D-Pixelspiel zu einer zusammenhängenden Geschichte vom **01.11.2025 bis 02.11.2026**: acht Kapitel, die zwölf vorhandenen Orte plus Spielplatz, Weihnachtsmarkt und Elias’ Zimmer sowie alle vier bestehenden Jahreszeiten.

## Neu in V0.9

- **Acht spielbare Kapitel:** Novemberanfang und Chats, erste romantische Dezembermomente, Neujahr, Valentinstag, alte Nachrichten und Besuche im März, gemeinsame Frühlingszeit, Sommeralltag sowie Herbst und Finale am 02.11.2026. Bewegung, Dialoge und Interaktionen finden direkt in der vorhandenen Welt statt.
- **November:** zwölf Chat-Episoden vom 13.–24.11., das gemäß den neuesten Angaben auf **16.11.2025** datierte Schokoladentreffen, kurze Schulszenen, Felices Liebesgeständnis am **24.11. um 17:20 Uhr**, Händchenhalten und die beiden „Ich liebe dich.“-Nachrichten am 25.11. Ein offizielles Beziehungsdatum wird nicht ergänzt.
- **Dezember:** Spielplatz am 01.–02.12., Weihnachtsmarkt am 06.12., Familienessen und erster richtiger Kuss am 25.12. sowie Brief und gefaltete Kraniche am 26.12. Der unbekannte Brieftext wird nicht erfunden.
- **Neues Dialogsystem:** untere Pixel-Dialogbox, links darüber wechselnde Sprecherporträts, acht Emotionen für Felice und Elias, NPC-Porträts, Schreibmaschinenanimation und Antwortmöglichkeiten. Enter, Leertaste, Klick oder Touch zeigen zunächst den Text und schalten danach weiter.
- **Interaktives Handy:** Nachrichten, gespeicherter Chatverlauf, Kalender und Erinnerungen. Sieben Gesprächsthemen stehen zur Wahl; mindestens zwei bewahren einen Chatabend. Ohne Originalnachrichten sind ergänzte Dialoge sichtbar als Rekonstruktion gekennzeichnet. Collin erhält keine erfundene Biografie.
- **Unsere Geschichte:** das erweiterte Album zeigt alle acht Kapitel chronologisch mit Datum beziehungsweise Zeitraum, Status, Illustration, Silhouetten für gesperrte Bilder, anklickbaren Erinnerungsstücken und Wiederholung.
- **Kalender und Jahreszeiten:** Datum, Uhrzeit und Story-Fortschritt erscheinen automatisch. Erzählerische Zeitsprünge führen zum nächsten wichtigen Moment; bestehende Frühlings-, Sommer-, Herbst- und Winterdarstellung folgt dem Kalender. Wiederholungen besitzen eine eigene Szenenzeit und verändern die aktuelle Spielzeit nicht.
- **Echte Ereignisse und Spielgestaltung:** spätere Alltagsszenen sind ausdrücklich inszenierte Möglichkeiten. Unbekannte Geschenke und Unternehmungen werden nicht als Tatsachen ergänzt. Nach dem 08.10.2026 führt ein spielerischer Ausblick zum Finale: „Unsere Geschichte ist noch lange nicht zu Ende. ❤️“
- **Bisherige Funktionen bleiben erhalten:** Anuk, Weihnachtsentwurf, Schulweg, Gölzau, Abschlussfeier mit drei Fotos, Namen und Schießbestwerte. Alte Abschlüsse bleiben erhalten; die neu bestätigten Hauptmeilensteine werden separat erlebt.

[Datenmodell und Erweiterung](game/STORY-V09.md) · [Prüfung des vollständigen Jahres](qa/v09-year/README.md) · [Prüfbericht der früheren Novemberfassung](qa/v09/REVIEW.md)

## Auf GitHub Pages spielen

Der statische Einstieg [index.html](index.html) lädt dieselbe Spielwelt wie die
bisherige Serverfassung. Der separate Vite-Build enthält das Spiel und sämtliche
Grafiken; es werden weder Node-Server noch Datenbank auf GitHub Pages benötigt.
Die vorhandenen Sites-Buildbefehle bleiben erhalten.

Einmalig in [Settings → Pages](https://github.com/kr511/pixelgame/settings/pages)
als **Source: GitHub Actions** auswählen. Anschließend unter
[Actions → Deploy GitHub Pages](https://github.com/kr511/pixelgame/actions/workflows/github-pages.yml)
**Run workflow** starten. Weitere Pushes auf `main` bauen und veröffentlichen
automatisch. Solange Pages nicht aktiviert ist, erzeugt der Workflow bereits
das herunterladbare `github-pages`-Artefakt und zeigt die Einrichtungshinweise.
Der Workflow verwendet Node 24, passend zu den Optionen des bestehenden Testskripts.
Bei privaten Repositories muss der GitHub-Tarif Pages unterstützen; die
Repository-Sichtbarkeit wird durch diesen Workflow nicht geändert.

Die erwartete Spieladresse ist **https://kr511.github.io/pixelgame/**.
Die `.html`-Datei im Repository ist der Build-Einstieg. Veröffentlicht wird
**der gesamte Inhalt von `dist-pages/`**, einschließlich der gebauten
`index.html`, Skripte, Styles und Grafiken; nur die Quelldatei hochzuladen reicht
nicht aus.

```sh
npm run build:pages
npm run preview:pages -- --port 4174
```

Die lokale statische Vorschau liegt dann unter
`http://localhost:4174/pixelgame/`. Für andere Repositorynamen oder eine eigene
Domain lässt sich `PAGES_BASE_PATH` setzen; der Workflow übernimmt den Pfad aus
der Pages-Konfiguration. Alle dynamisch geladenen Grafiken berücksichtigen
diesen Pfad, während Grafik-IDs und Speicherformate unverändert bleiben.

Spielstände bleiben lokal pro Browser und Website-Adresse gespeichert. Ein
Stand von der bisherigen Website wird deshalb nicht automatisch auf
`github.io` übertragen. Smartphones verwenden weiterhin Querformat.

## Noch offene persönliche Inhalte

Originalnachrichten und Elias’ Brieftext liegen noch nicht vor. Einige frühere
Erinnerungen, insbesondere Anuks Ankunft, der ursprüngliche Schulweg und das
Schießen, benötigen bestätigte historische Daten. Bestimmte Freunde und
Familienmitglieder verwenden weiterhin vorhandene Grafikvarianten; eigene
Aussehensangaben und umfangreichere Tagesroutinen können später ergänzt werden.
Die acht Hauptkapitel sind spielbar; unbekannte Angaben werden nicht erfunden.

### V0.9 spielen

**Welt betreten** → im Album oder im Story-Hinweis **Geschichte erleben** beziehungsweise **Zeit weiterblättern**. Folge in mehrstufigen Szenen der Markierung und benutze **E** / den Aktionsknopf. Für Chatabende in Felices Zimmer am Schreibtisch oder auf der Bettkante Platz nehmen und **Handy öffnen** wählen. Auf Elias zulaufen, um Gespräche und gemeinsame Aktionen auszulösen. Das Handy öffnet sich außerdem über seinen Weltknopf, das Album mit **J** oder dem Buchknopf. Abgeschlossene Erinnerungen lassen sich im Album erneut erleben. Smartphones verwenden den vorhandenen Touch-Joystick im Querformat.

Der Schlüssel `felice-elias.timeline.v09` speichert Kalender, Ereignisabschlüsse und laufende Chat-/Szenenfortschritte gemeinsam. Alte Tages- und Erinnerungsdaten bleiben erhalten; Kapitel- und Namensfunktionen verwenden ihre vorhandenen Schlüssel. Der erste Abschlusszeitpunkt bleibt bei Wiederholung erhalten; ein erfolgreicher weiterer Durchgang erhöht den Besuchszähler. Beschädigte oder unbekannte Speicherformate werden nicht überschrieben; blockiertes Speichern wird sichtbar gemeldet.

## Neu in V0.8

- **Unser Abschluss · Sommer 2026:** kleine Turnhalle, Schulleiter, Bürgermeister, zwei Ehrengäste, Paul, Justin und Elias. Felice und Elias erhalten beide ein Abschlusszeugnis.
- Pauls Döneridee bleibt ein Gespräch bei der Zeugnisübergabe. Es gibt keinen Döner-Ausflug.
- Ein weißer Übergang führt automatisch zu drei Schnappschüssen von Elias und Felice. Der Fotopunkt spielt den Moment nach Abschluss erneut ab.
- Persönliche Gespräche mit den Freunden, insbesondere Pauls Insider und Jasons Fachabi.
- Liegen ausschließlich im Bett; alle Decken entfernt. Sitzen auf Sofa, Stühlen und Bänken bleibt möglich. Anuks Decke ist jetzt ein Hundekissen; alte Spielstände werden migriert.

## Bisher in V0.75

- **Schießgruppe:** Helena und Ida sind mit Alexander und Magdalena am Schießstand ansprechbar. Die Trainer Hans und Fritz haben eigene Namen, Figuren und Gespräche. Hans begrüßt Felice im Schießkapitel; seine bisherige Figuren-ID bleibt für gespeicherte Namen und Kapitel erhalten. Alexander und Magdalena können die vorhandenen Sitz- und Liegeplätze nutzen. Die neuen Figuren verwenden zunächst vorhandene Atlasgrafiken, bis persönliche Aussehensangaben vorliegen.
- **Radegast:** Von Felices Wohnung führt ein verkürzter, wiedererkennbarer Weg entlang der Hausreihen und Gärten zur neu gestalteten Bushaltestelle.
- **Zörbig:** Der Bus kommt am Markt an. Von dort geht es zu Fuß an der Kirche vorbei zur Sekundarschule und auf den Pausenhof. Markt, Kirche und Schule folgen der Anordnung im bereitgestellten Luftbild.
- **Pausenhof:** Aus der Vogelperspektive liegt die graue Sekundarschule im Hintergrund. Ihr mittiger Eingang mit Treppe ist sichtbar und dient als Unterrichtszugang. Die Grundschule rechts bleibt außerhalb der Ansicht. Die Schulhof-Fotos bestimmen das graue Pflaster, den roten Querweg, Baumbeete mit Sitzrändern und die grüne Ecke mit Sitzmauern. Elena, Jason, Luca und Wyatt bewegen sich an den blau markierten Fenstergittern. Elias gehört nicht zu dieser Gruppe; Felice kann ihn separat zum Sitzen am Baum oder auf der Sitzmauer einladen.
- **Gölzau:** Der neue Weg führt über die Zufahrt zum Schützenhaus und weiter in den vorhandenen Schießstand. Alle neuen Wege besitzen Rückwege, angepasste Hindernisse und Vordergrundmasken.
- **Ortsplan:** Das Erinnerungsbuch zeigt die Verbindungen zwischen Wohnung, Radegast, Zörbig und Gölzau sowie den aktuellen Ort. Tagesregeln, Kapitel und bestehende Spielstände bleiben erhalten.

Die Ortsanordnung nutzt die persönlichen Luftbilder, die vier Schulhof-Fotos und öffentliche Quellen. Wege und Abstände sind für das Spiel verkürzt; einzelne Details sind zeichnerisch ergänzt. Die Gölzauer Außenansicht ist eine Spielinterpretation. [Quellen und Genauigkeit](qa/v075/SOURCES.md).

[Browserprüfung und Szenenbilder von V0.75](qa/v075/REVIEW.md) · [Grafikvorgaben](game/ART-V075.md)

## Neu in V0.7

- Freunde schauen beim Laufen nach vorne, hinten, links oder rechts. Jede Richtung verwendet eine neutrale Haltung und zwei wechselnde Schrittbilder auf derselben Fußlinie. Gerade Laufwege enthalten weniger Zwischenstopps.
- Felice geht zum Sitz- oder Liegeplatz und tritt beim Aufstehen zurück auf den Boden. Elias läuft auf Einladung zum Nachbarplatz, steht mit ihr auf und bleibt anschließend ansprechbar in der Szene. Haltungswechsel lassen sich unterwegs ändern oder abbrechen, ohne im Möbel hängen zu bleiben.
- Namen sind auf Desktop und Handy größer. Beim Sitzen stehen Felices und Elias' Namen unter den Figuren, damit Tischaktionen sie nicht verdecken; Felices Name erscheint im Bett am Kopfteil.
- Im Erinnerungsbuch gibt es eine Figurenübersicht mit den neun benannten Freunden und den bisherigen Familien-/Gastgeberrollen. Fehlende Namen lassen sich dort ergänzen, speichern und durch ein leeres Feld zurücksetzen. Die Anzeige ist wählbar: immer, beim Nähern oder Freunde immer. Angepasste Namen erscheinen auch in Gesprächen mit dem passenden Porträt.
- Namen werden separat unter `felice-elias.names.v07` gespeichert. Kapitel und Tagesstand bleiben kompatibel. Die konkret zusätzlich gewünschten Namen und persönlichen Aussehensangaben stehen noch aus; die vorhandenen Rollen werden bis dahin beibehalten.

[Browserprüfung und Szenenbilder von V0.7](qa/v07/REVIEW.md) · [Grafikvorgaben](game/ART-V07.md)

## Neu in V0.65

- **Felices Küche** ist vom Wohnzimmer aus erreichbar: Frühstück vorbereiten, ein warmes Getränk machen und aufräumen kosten jeweils zehn Minuten. Die Aktionen zeigen kurz Rückmeldung und passende Dampf-/Glanzanimationen. Am Küchentisch können Felice und Elias zusammen sitzen.
- **Felice liegt unter der Decke, mit dem Kopf auf dem Kissen.** Die bewohnte Bettvariante übernimmt die genaue Kamera und Einrichtung des Zimmers; die frühere Deckenüberlagerung entfällt.
- **Elena, Jason, Luca und Wyatt laufen auf dem Schulhof.** Jason und Luca gehen langsamer und pausieren länger. Die Figuren verwenden echte wechselnde Schrittbilder und begehbare Wege.
- Freunde und Elias können sich an verfügbaren Sitzplätzen hinsetzen und wieder aufstehen. Liegen ist nur in Felices Bett möglich. Persönliche Gespräche werden als eigene Gesprächsauswahl angeboten.
- Bewegung pausiert in Dialogen, im Buch, bei Pause und bei verborgenem Tab. Automatisches Laufen kostet keine Spielminuten. Kapitel, Uhrzeit und Jahreszeit verwenden weiterhin die bestehenden Speicherstände; Haltungen bleiben vorübergehend.

[Browserprüfung und Szenenbilder von V0.65](qa/v065/REVIEW.md) · [Grafikvorgaben](game/ART-V065.md)

## Neu in V0.61

- Der Tag beginnt um **5:00 Uhr**. Gespräche, Hinsetzen, Hinlegen, Aufstehen und Ausruhen kosten **10 Minuten**, Ortswechsel **30 Minuten**. Laufen, Pause und das Erinnerungsbuch verbrauchen keine Spielzeit.
- Die Uhr bleibt oben sichtbar. Um **8, 12, 15, 18, 21 und 24 Uhr** erscheint für 4,5 Sekunden ein Hinweis mit Uhrzeit und Ort/Aktivität. Überschreitet eine Aktion mehrere Uhrzeiten, folgen die Hinweise nacheinander; während Dialogen, Pause und Erinnerungen warten sie.
- An der Schultür lässt sich Unterricht von **7:15 bis 13:00 Uhr** besuchen. Wer früher kommt, wartet bis zum Unterricht. Danach ist der Schulhof weiter frei begehbar.
- **Frühling, Sommer, Herbst und Winter** sind über die Uhr auswählbar und werden gespeichert. Die Jahreszeit steuert weiche Dämmerung, Tageslänge und winterliche Außenbilder. Sommerabende bleiben deutlich länger hell als Winterabende. Das Weihnachtskapitel behält seine winterliche Gestaltung.
- **Elena, Jason, Luca und Wyatt** stehen auf dem Schulhof. **Ida, Helena, Linda, Lina und Alexandra** sind am Schießstand. Elena ist Felice näher befreundet; Jason und Luca haben ruhigere Dialoge. Die Figuren verwenden vorläufig vorhandene Atlasgrafiken, bis persönliche Aussehensangaben vorliegen.
- Bänke in Garten, Haltestelle, Schulhof und Schießstand sind mit **E oder dem Aktionsknopf** benutzbar. **Mit Elias sitzen** lädt Elias auf den freien Platz ein. **Aufstehen** beendet die Sitzposition.
- In Felices Zimmer führt **Hinlegen** ins Bett, zunächst wach. **Schlafen bis 5:00 Uhr** überspringt alle verbleibenden Hinweise bis zum nächsten Morgen; Schlaf vor 21 Uhr löst somit keine 21-/24-Uhr-Meldung aus. Nach Mitternacht führt Schlaf zu 5 Uhr desselben Morgens.

Der Tagesstand wird getrennt unter `felice-elias.day.v061` gespeichert. Bestehende Kapitel- und Erinnerungsstände bleiben kompatibel. Sitz-/Liegepositionen sind vorübergehend; nach Neuladen steht Felice wieder am Ortseingang.

## Szenenreview und Verfeinerung in V0.61

Alle sechs Orte wurden anhand von Browseraufnahmen überarbeitet: echte Sitz- und Liegeposen, Bettdecke aus dem vorhandenen Zimmerbild, ausgerichtete Laufbilder, gleichmäßige Bewegung, vollständige Szenenansicht, passende Möbelpositionen und seitliche Bedienung. Der [vollständige Reviewbericht mit Vorher-/Nachher-Bildern](qa/review-v061/REVIEW.md) enthält die Einzelprüfung jedes Ortes und der Schieß-Erinnerung.

## Die Welt in V0.6

Zimmer, Wohnzimmer, Garten, Haltestelle, Schulhof und Schießstand teilen eine warme, detaillierte Bildsprache. Elias trägt einen weißen Hoodie, schwarze lange Hose und helle Sneaker; seine Locken und sein Gesicht wurden anhand der persönlichen Bildreferenzen gestaltet. Die Fotos selbst sind keine Spielgrafiken. Felices vorhandene Figur bleibt die Stilreferenz. Familie und Freunde haben eigene Standbilder und Dialogporträts; Anuks persönliche Gestaltung folgt später.

Ein typisierter Grafikkatalog in `game/graphics.ts` trennt Darstellung und Spielstand. Vordergrundmasken verdecken Figuren anhand ihrer Fußposition. Alle Orte verwenden eine vollständige, ruhige Szenenansicht mit Zoom 1; eine Markierung weist auf Aufgabenziele außerhalb des Bildes. Weihnachten nutzt winterliche Außenbilder und ein festliches Wohnzimmer. Lampen, Blätter, Schnee pausieren mit dem Spiel; reduzierte Bewegung schaltet dekorative Animationen ab.

Der zentrale Web-Audio-Dienst erzeugt leise Raum-/Windgeräusche, Schritte, Interaktionen und Luftgewehrgeräusche ohne Audiodateien. Ton wird erst nach **Welt betreten** freigeschaltet und stoppt bei Pause, verborgenem Tab, Hochformat und Szenenübergängen. Die Lautsprechertaste speichert die Stummschaltung separat. Blockiertes Audio und fehlende Bilder lassen das Spiel mit stummer bzw. einfacher Ersatzdarstellung weiterlaufen.

## Steuerung und Speicherung

- WASD/Pfeile oder Touch-Joystick: laufen; `E`: sprechen/benutzen/Ortswechsel.
- `J`: Erinnerungsbuch; `Esc` oder Pausetaste: Pause. Auf dem Handy im Querformat spielen.
- Vier Kapitel: **Willkommen, Anuk**, **Das erste Weihnachtsessen**, **Unser gemeinsamer Weg**, **Schießen in Gölzau**. Über das Buch wiederholbar.
- Bestehende Speicherformate bleiben erhalten: `felice-elias.story.v05` (Version 1) und `felice-elias.memories.v1`. Ton nutzt `felice-elias.audio.v1`. Gespeichert wird lokal für Browser und Adresse; keine Cloud-Speicherung.

Grafikdateien und Generierungsvorgaben sind in [game/ART-V06.md](game/ART-V06.md) dokumentiert.

## Prüfen

```powershell
npm test
npx tsc --noEmit
npx eslint game/SceneArt.tsx game/graphics.ts game/Game.tsx game/GameUI.tsx game/WorldArt.tsx game/NamesPanel.tsx game/actors.ts game/rest.ts game/names.ts game/graphics07.ts tests/actors.test.mjs tests/rest.test.mjs tests/names.test.mjs tests/motion.test.mjs tests/world.test.mjs game/WorldMap.tsx game/story.ts game/day.ts tests/routes.test.mjs qa/v075/*.mjs
npm run build
```

Die automatisierten Tests umfassen Kapitel, Speicherstände, Erreichbarkeit, Trefferwertung, Kamera, Grafikzuordnung, Ton, Tagesgrenzen, Hinweiszeiten, Schlafen, Jahreszeiten, Bewegung bei verschiedenen Bildraten, Kollisionen, NPC-Laufwege, Platzreservierungen, alle Freundesposen sowie Felices und Elias' Ruhewege und ergänzte Namen. Die Schulgruppe ohne Elias, durchgehend begehbare Wege um schmale Sitzmauern und die Rückkehr zur Gruppe nach dem Ausruhen werden ebenfalls geprüft. Browserprüfungen ergänzen sie um Darstellung und Bedienung.

## Lokal starten

```powershell
npm run dev
```

Danach läuft das Projekt unter `http://localhost:5173/`.

## Projektaufbau

- `game/`: Spiellogik, Steuerung, Kamera und Benutzeroberfläche
- `public/rooms/`: Raumgrafiken und Wintervarianten
- `public/characters/`: Figurenatlanten, Laufanimationen und Porträts
- `app/`: Next.js-Einstieg und globale Gestaltung

## Erinnerungen

Das Foto am rechten Regal und die begehbare Schießbahn starten **Schießen in Gölzau**: ein Luftgewehr-Minispiel mit neun Schüssen, Rückkehr an den Ausgangsort, Erinnerungsmedaille und lokal gespeichertem Fortschritt. Steuerung und Aufbau stehen in [game/memories/README.md](game/memories/README.md).

## Technische Basis

A clean full-stack starter running on [vinext](https://github.com/cloudflare/vinext), with optional Cloudflare D1 and Drizzle support.

## Prerequisites

- Node.js `>=22.13.0`
- Portable: Windows, macOS, or Linux; no Bash required
- Managed Linux: managed Linux runtime with Bash, `flock`, `curl`, `sha256sum`, and GNU `timeout`
- Git is required only for publishing

## Sites Lifecycle

The Sites initializer copies the shared starter and selects managed-linux only when `SITES_MANAGED_LINUX_CONTAINER=1`; otherwise it selects portable. It saves the selection only in ignored `.sites-runtime/execution-profile.json`. Both profiles copy/configure first, then use the plugin's separate `install-dependencies.mjs` step to measure installation independently. Edit source under `app/` and follow the Sites skill for installation, preview, builds, and publishing.

Whenever reopening or moving a checkout, run `node <plugin-root>/scripts/configure-execution-profile.mjs` before project commands. Profile changes do not alter tracked source or require reinstalling otherwise-valid dependencies; restart an existing preview to use the new selection. Do not commit or upload `.sites-runtime/`.

This starter does not use `wrangler.jsonc`.

`install:ci` runs `npm ci` once against the shared lockfile, disables parent-workspace discovery, and includes required dev/optional dependencies despite production/omit settings. Sharp defaults to prebuilt binaries unless explicitly configured otherwise. Do not overlap installers.

- **Portable:** Preserve host HOME, npm cache, registry, proxy, temporary paths, retry/concurrency settings, and lifecycle-script policy. Use `--prefer-offline --no-audit --no-fund`.
- **Managed Linux:** Use the existing project-local HOME/cache/tmp setup and Linux install lock, tarball preflight, and timeout. Restore the image-seeded npm cache only when its lockfile hash matches; retain network fallback. Builds keep their existing timeout. These helpers are not invoked by the portable profile.

`scripts/sites-env.mjs` preserves the caller's HOME, npm cache, proxy, XDG, and temporary-directory configuration while defaulting Wrangler and Miniflare state to the checkout. If npm reports an unwritable cache, select a writable path with `npm_config_cache` for that install. The `dev` and `start` scripts also keep Wrangler logs inside the checkout. Generated `.sites-runtime/` and `.wrangler/` directories are disposable and ignored by Git.

On portable, `npm run dev` uses `vinext dev` with HMR, starting at port 5173. Vinext records the running server in ignored `.vinext/` state, rejects an ordinary duplicate launch, and recovers stale state after a stopped process; exactly simultaneous starts can race. Pass `--port <port>` or `--hostname <host>` after `npm run dev --` when needed; keep portable previews on loopback.

For browser QA on managed Linux, use `sites-preview start`. The project's dev script runs Vite and accepts the supervisor's `--host 0.0.0.0 --port 4173 --strictPort` arguments. The internal browser uses `http://terminal.local:4173/`; it is not a user-facing URL. The supervisor owns the preview lifecycle. The ignored local profile survives the supervisor's cleared process environment.

The portable profile simulates ChatGPT sign-in only for loopback development requests. Visit `/signin-with-chatgpt?return_to=/` to sign in as `local_seedy` (`seedy@sites.test`, display name `Seedy`) and `/signout-with-chatgpt?return_to=/` to sign out. The development cookie preserves that identity across server restarts. Mock auth is disabled in the managed-linux profile and is not included in production builds; hosted authentication remains dispatch-owned.

The Worker uses `vinext/server/fetch-handler`, including Vinext's config-aware image handling. After building, `npm start` runs that Worker locally through Wrangler on `127.0.0.1`, sharing `.wrangler/state` with dev preview and local D1 migrations; it does not deploy the site or simulate sign-in. Use the URL printed by the server. Pass `npm start -- --port <port>` to select a different built-preview port.

Local previews use Miniflare's placeholder `Request.cf` metadata without a network lookup. Set `CLOUDFLARE_CF_FETCH_ENABLED=true` to opt into fetching preview metadata; this setting does not change hosted request metadata.

Local tool usage metrics are disabled by default. Set `WRANGLER_SEND_METRICS=true` to opt in.

## Included Shape

- edit site code under `app/`
- `app/chatgpt-auth.ts` provides optional dispatch-owned ChatGPT sign-in helpers
- `.openai/hosting.json` declares optional Sites D1 and R2 bindings
- `vite.config.ts` simulates declared bindings for local development
- `db/index.ts` reads the D1 binding from the Cloudflare Worker environment
- `db/schema.ts` starts intentionally empty
- `@cloudflare/workers-types` provides Worker types; `cloudflare-env.d.ts` declares optional `DB`/`BUCKET` bindings—update these declarations if binding names change
- `examples/d1/` contains an optional D1 example surface
- `drizzle.config.ts` supports local migration generation when needed

## Workspace Auth Headers

Signed-in visitors receive both `oai-authenticated-user-id` and `oai-authenticated-user-email`. Private Sites require every visitor to sign in; public Sites may also have anonymous visitors, for whom neither header is present.

The user ID is stable for the same user on the same Site and different across Sites. Use it as the durable user key; use email and name for display or contact purposes.

SIWC-authenticated workspace sites may also receive `oai-authenticated-user-full-name` when the user's SIWC profile has a non-empty `name` claim. The full-name value is percent-encoded UTF-8 and is accompanied by `oai-authenticated-user-full-name-encoding: percent-encoded-utf-8`.

Treat the full name as optional and fall back to email when it is absent:

```tsx
import { headers } from "next/headers";

export default async function Home() {
  const requestHeaders = await headers();
  const userId = requestHeaders.get("oai-authenticated-user-id");
  const email = requestHeaders.get("oai-authenticated-user-email");
  const encodedFullName = requestHeaders.get("oai-authenticated-user-full-name");
  const fullName =
    encodedFullName &&
    requestHeaders.get("oai-authenticated-user-full-name-encoding") ===
      "percent-encoded-utf-8"
      ? decodeURIComponent(encodedFullName)
      : null;

  const displayName = fullName ?? email;
  // ...
}
```

## Optional Dispatch-Owned ChatGPT Sign-In

Import the ready-to-use helpers from `app/chatgpt-auth.ts` when the site needs optional or required ChatGPT sign-in:

- Use `getChatGPTUser()` for optional signed-in UI.
- Use the returned `userId` as the stable user key for user-owned records; do not use email as a durable identifier.
- Use `requireChatGPTUser(returnTo)` for server-rendered pages that should send anonymous visitors through Sign in with ChatGPT.
- In a Server Component, start sign-in with `<a href={chatGPTSignInPath(returnTo)} target="_top">`. The auth helper module is server-only; do not import it into a Client Component.
- Do not use `fetch`, XHR, a client-side router, or a framework link that can prefetch the sign-in route. SIWC must start as a top-level navigation.
- Never request the AuthAPI authorization endpoint directly. The dispatch-owned `/signin-with-chatgpt` route must start the SIWC flow.
- Use `chatGPTSignOutPath(returnTo)` for browser sign-out links or actions.
- Pass a same-origin relative `returnTo` path for the destination after sign-in or sign-out. The helper validates and safely encodes it.
- Mark protected pages with `export const dynamic = "force-dynamic"` because they depend on per-request identity headers.

Dispatch owns `/signin-with-chatgpt`, `/signout-with-chatgpt`, `/callback`, the OAuth cookies, and identity header injection. Do not implement app routes for those reserved paths. Routes that do not import and call the helper remain anonymous-compatible.

SIWC establishes identity only; it does not prove workspace membership. Use the Sites hosting platform's access policy controls for workspace-wide restrictions, or enforce explicit server-side membership or allowlist checks.

Use SIWC for account pages, user-specific dashboards, saved records, and write actions tied to the current ChatGPT user. Leave public content anonymous.

## Local D1 migrations

For a D1-backed local preview, generate SQL with `npm run db:generate`. Build once through the Sites skill's build entrypoint (or `npm run build` for standalone use) to generate `dist/server/wrangler.json`, rebuilding if bindings change. From the project root, apply each pending migration in order:

```sh
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_example.sql
```

Replace the filename with the pending migration and `DB` with your D1 binding name if different. Use `.wrangler/state`, not `.wrangler/state/v3`; Wrangler adds the versioned directories. Do not replay migrations already applied locally. This updates only the preview database; publishing applies production migrations separately.

## Diagnostic Commands

- `npm run install:ci`: perform the one locked dependency install
- `npm run dev`: start the Vite/Vinext development server
- `npm run build`: build the deployable Sites artifact
- `npm run start`: preview the built Worker locally with D1/R2 support
- `npm run db:generate`: generate Drizzle migrations after schema changes

When using the Sites plugin, follow its skill instructions for installation, builds, and publishing. These npm commands remain available for standalone use.

The portable build runs Vinext directly without a host `timeout` command. The managed-linux build uses `scripts/build-verified.sh` and its existing `SITES_BUILD_TIMEOUT` setting.

## Learn More

- [vinext Documentation](https://github.com/cloudflare/vinext)
- [Drizzle D1 Guide](https://orm.drizzle.team/docs/get-started/d1-new)
