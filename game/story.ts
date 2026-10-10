export type Place = "bedroom" | "home" | "kitchen" | "garden" | "radegast" | "bus" | "zoerbig" | "schoolway" | "school" | "gym" | "goelzau" | "range" | "playground" | "christmasmarket" | "eliasroom";
export type Point = { x: number; y: number };
export const SCHOOL_WAY_CROP = { x: .08, y: .30, width: .84, height: .70 };
const schoolWayPoint = (x: number, y: number): Point => ({ x: (x-.08)/.84, y: (y-.30)/.70 });
export type ChapterId = "dog" | "christmas" | "school" | "shooting" | "graduation";
export type Step = { id: string; place: Place; target: string; label: string; speaker: string; text: string; item?: string };
export type Chapter = { id: ChapterId; title: string; date: string; icon: string; intro: string; ending: string; reward: string; steps: Step[] };
export type Entity = Point & { id: string; name: string; kind: "person" | "dog" | "item"; art: string; text: string; display?: Point };
export type Exit = Point & { to: Place; label: string; spawn: Point };
export type Obstacle = { left: number; right: number; top: number; bottom: number };
export const PLACES: Record<Place, { name: string; subtitle: string; exits: Exit[]; obstacles: Obstacle[] }> = {
  bedroom: { name: "Felices Zimmer", subtitle: "Hier beginnt eure Geschichte", exits: [{ x: .9, y: .68, to: "home", label: "Ins Wohnzimmer", spawn: { x: .2, y: .72 } }], obstacles: [
    { left: .12, right: .495, top: .085, bottom: .43 }, { left: .49, right: .745, top: .14, bottom: .3 }, { left: .57, right: .66, top: .24, bottom: .34 }, { left: .11, right: .215, top: .43, bottom: .595 }, { left: .84, right: .95, top: .33, bottom: .585 }, { left: .53, right: .96, top: .81, bottom: 1 },
  ] },
  home: { name: "Bei Felice zu Hause", subtitle: "Ein Platz für uns", exits: [
    { x: .12, y: .72, to: "bedroom", label: "Felices Zimmer", spawn: { x: .84, y: .68 } }, { x: .5, y: .9, to: "garden", label: "In den Garten", spawn: { x: .5, y: .35 } },
    { x: .925, y: .52, to: "kitchen", label: "In Felices Küche", spawn: { x: .5, y: .85 } },
    { x: .11, y: .52, to: "radegast", label: "Vor die Wohnung", spawn: { x: .435, y: .28 } },
  ], obstacles: [{ left: .46, right: .73, top: .235, bottom: .48 }, { left: .12, right: .40, top: .17, bottom: .43 }, { left: .84, right: .96, top: .12, bottom: .46 }] },
  kitchen: { name: "Felices Küche", subtitle: "Ein kleiner Moment im Alltag", exits: [{ x: .5, y: .9, to: "home", label: "Ins Wohnzimmer", spawn: { x: .89, y: .54 } }], obstacles: [
    { left: .087, right: .914, top: .09, bottom: .284 }, { left: .576, right: .854, top: .36, bottom: .585 },
  ] },
  garden: { name: "Der Garten", subtitle: "Kleine Pfoten, große Welt", exits: [
    { x: .5, y: .23, to: "home", label: "Ins Haus", spawn: { x: .5, y: .8 } }, { x: .91, y: .69, to: "radegast", label: "Auf den Weg zur Haltestelle", spawn: { x: .46, y: .42 } },
  ], obstacles: [{ left: .27, right: .7, top: .04, bottom: .19 }, { left: .07, right: .2, top: .23, bottom: .42 }, { left: .73, right: .9, top: .2, bottom: .4 }, { left: .15, right: .35, top: .52, bottom: .60 }] },
  bus: { name: "Radegast · Bushaltestelle", subtitle: "Mit dem Bus nach Zörbig", exits: [
    { x: .18, y: .68, to: "radegast", label: "Zurück zur Wohnung", spawn: { x: .71, y: .85 } }, { x: .735, y: .445, to: "zoerbig", label: "Bus nach Zörbig · Markt", spawn: { x: .43, y: .275 } }, { x: .835, y: .73, to: "goelzau", label: "Auf den Weg nach Gölzau", spawn: { x: .86, y: .63 } },
  ], obstacles: [{ left: 0, right: 1, top: 0, bottom: .245 }, { left: .50, right: .895, top: .26, bottom: .40 }, { left: .235, right: .435, top: .30, bottom: .43 }, { left: 0, right: .12, top: .57, bottom: 1 }, { left: .87, right: 1, top: .60, bottom: 1 }, { left: .16, right: .30, top: .71, bottom: .86 }, { left: .34, right: .53, top: .88, bottom: 1 }, { left: .67, right: 1, top: .89, bottom: 1 }] },
  radegast: { name: "Radegast · Weg zur Haltestelle", subtitle: "Von Felices Wohnung durch den Ort", exits: [
    { x: .38, y: .21, to: "home", label: "In Felices Wohnung", spawn: { x: .17, y: .52 } },
    { x: .46, y: .42, to: "garden", label: "In den Garten", spawn: { x: .82, y: .69 } },
    { x: .71, y: .89, to: "bus", label: "Zur Bushaltestelle", spawn: { x: .20, y: .68 } },
    { x: .61, y: .70, to: "playground", label: "Zum Spielplatz · verkürzter Spielweg", spawn: { x: .50, y: .86 } },
  ], obstacles: [] },
  zoerbig: { name: "Zörbig · Markt", subtitle: "Löwen-Apotheke, Rathaus und Brunnen", exits: [
    { x: .397, y: .255, to: "bus", label: "Bus zurück nach Radegast", spawn: { x: .74, y: .47 } },
    { x: .205, y: .74, to: "schoolway", label: "Auf den Schulweg", spawn: schoolWayPoint(.35,.43) },
    { x: .67, y: .47, to: "christmasmarket", label: "Zum Weihnachtsmarkt · Spielweg", spawn: { x: .50, y: .87 } },
    { x: .70, y: .29, to: "eliasroom", label: "Zu Elias · verkürzter Spielweg", spawn: { x: .50, y: .85 } },
  ], obstacles: [
    { left: .463, right: .535, top: .34, bottom: .385 },
    { left: .408, right: .592, top: .592, bottom: .677 },
    { left: .32, right: .34, top: .55, bottom: .57 },
    { left: .30, right: .32, top: .69, bottom: .71 },
    { left: .64, right: .66, top: .57, bottom: .59 },
    { left: .67, right: .69, top: .71, bottom: .73 },
  ] },
  schoolway: { name: "Zörbig · Schulweg", subtitle: "An St. Mauritius vorbei zur Grünstraße", exits: [
    { ...schoolWayPoint(.34,.43), to: "zoerbig", label: "Zurück zum Markt", spawn: { x: .24, y: .70 } },
    { ...schoolWayPoint(.17,.76), to: "school", label: "Zum Pausenhof", spawn: { x: .52, y: .92 } },
  ], obstacles: [] },
  school: { name: "Sekundarschule Zörbig · Pausenhof", subtitle: "Treffpunkt an den Fenstergittern", exits: [{ x: .88, y: .72, to: "gym", label: "In die kleine Turnhalle", spawn: { x: .5, y: .85 } }, { x: .515, y: .95, to: "schoolway", label: "Zurück zum Schulweg", spawn: schoolWayPoint(.20,.75) }], obstacles: [] },
  gym: { name: "Zörbig · Kleine Turnhalle", subtitle: "Abschlusszeugnisse · Sommer 2026", exits: [{ x: .5, y: .90, to: "school", label: "Zurück auf den Schulhof", spawn: { x: .84, y: .73 } }], obstacles: [
    { left: .36, right: .65, top: .18, bottom: .25 },
    { left: .687, right: .74, top: .17, bottom: .25 },
    { left: .11, right: .32, top: .373, bottom: .557 },
    { left: .685, right: .887, top: .373, bottom: .557 },
  ] },
  goelzau: { name: "Gölzau · Weg zum Schützenhaus", subtitle: "Ankommen, Freunde treffen, zusammen schießen", exits: [
    { x: .90, y: .65, to: "bus", label: "Zurück nach Radegast", spawn: { x: .82, y: .76 } },
    { x: .265, y: .285, to: "range", label: "Ins Schützenhaus", spawn: { x: .5, y: .82 } },
  ], obstacles: [{ left: .05, right: .63, top: 0, bottom: .245 }, { left: .71, right: 1, top: 0, bottom: .43 }, { left: .505, right: .635, top: .26, bottom: .305 }] },
  range: { name: "Schießstand · Gölzau", subtitle: "Einmal tief durchatmen", exits: [{ x: .5, y: .9, to: "goelzau", label: "Vor das Schützenhaus", spawn: { x: .275, y: .32 } }], obstacles: [{ left: .1, right: .9, top: .04, bottom: .34 }, { left: .66, right: .86, top: .76, bottom: .835 }] },
  playground: { name: "Spielplatz · Ein Platz für uns", subtitle: "Parkbank, leise Gespräche und Zeit draußen", exits: [{ x: .50, y: .90, to: "radegast", label: "Zurück nach Radegast", spawn: { x: .61, y: .70 } }], obstacles: [
    { left: .25, right: .32, top: .15, bottom: .36 }, { left: .16, right: .25, top: .31, bottom: .39 },
    { left: .68, right: .85, top: .34, bottom: .46 }, { left: .35, right: .52, top: .47, bottom: .52 },
    { left: .80, right: .85, top: .62, bottom: .68 }, { left: .105, right: .18, top: .59, bottom: .63 },
  ] },
  christmasmarket: { name: "Unser Weihnachtsmarkt", subtitle: "Lichter, Winterluft und ein gemeinsamer Spaziergang", exits: [{ x: .50, y: .91, to: "zoerbig", label: "Zurück zum Zörbiger Markt", spawn: { x: .66, y: .47 } }], obstacles: [
    { left: .11, right: .31, top: .23, bottom: .365 }, { left: .67, right: .88, top: .23, bottom: .365 },
    { left: .10, right: .29, top: .56, bottom: .695 }, { left: .755, right: .865, top: .69, bottom: .72 },
    { left: .455, right: .55, top: .30, bottom: .37 },
  ] },
  eliasroom: { name: "Elias’ Zimmer", subtitle: "Ein wiederkehrender Ort · Einrichtung als Spielinterpretation", exits: [{ x: .50, y: .90, to: "zoerbig", label: "Nach draußen · verkürzter Spielweg", spawn: { x: .69, y: .29 } }], obstacles: [
    { left: .15, right: .40, top: .19, bottom: .335 }, { left: .60, right: .86, top: .16, bottom: .465 },
    { left: .075, right: .16, top: .49, bottom: .65 }, { left: .74, right: .90, top: .73, bottom: .82 },
    { left: .44, right: .565, top: .12, bottom: .265 },
  ] },
};

// Bestätigt: acht Personen beim Weihnachtsessen; Namen noch offen.
// Dialoge, Kleidung und genaue Szenengestaltung sind spielerische Entwürfe.
export const ENTITIES: Record<Place, Entity[]> = {
  playground: [
    { id: "playground-elias", name: "Elias", x: .53, y: .63, kind: "person", art: "elias", text: "Sollen wir uns einen Moment auf die Bank setzen? Hier können wir in Ruhe reden. Dieses Gespräch ist eine freie Rekonstruktion." },
    { id: "playground-swings", name: "Schaukeln", x: .70, y: .51, display: { x: .75, y: .37 }, kind: "item", art: "landmark", text: "Die Schaukeln bewegen sich leise im Wind. Der Spielplatz ist eine atmosphärische Interpretation, kein maßstabsgetreuer Ortsplan." },
    { id: "playground-leaves", name: "Ein kleiner Weg", x: .29, y: .70, kind: "item", art: "landmark", text: "Ein kurzer Spaziergang, eine Pause auf der Bank. Hier darf der Alltag einfach langsam sein." },
  ],
  christmasmarket: [
    { id: "market-elias", name: "Elias", x: .58, y: .74, kind: "person", art: "elias", text: "Die Lichter sehen schön aus. Wollen wir noch eine kleine Runde zusammen gehen? Freie Dialogrekonstruktion." },
    { id: "market-lights", name: "Lichterketten", x: .56, y: .45, display: { x: .61, y: .185 }, kind: "item", art: "star", text: "Warme Lichter über dem Weg. Der Aufbau der Stände ist für das Spiel gestaltet; er behauptet keine historischen Einzelheiten." },
    { id: "market-tree", name: "Weihnachtsbaum", x: .49, y: .425, display: { x: .51, y: .225 }, kind: "item", art: "star", text: "Ein beleuchteter Baum, kalte Winterluft und Zeit zu zweit. Euer Besuch am 06.12.2025 gehört zur gemeinsamen Geschichte." },
    { id: "market-stall", name: "Ein warmer Stand", x: .32, y: .42, display: { x: .20, y: .295 }, kind: "item", art: "landmark", text: "An den Ständen wird es warm und gemütlich. Was ihr damals gegessen oder gekauft habt, bleibt offen." },
  ],
  eliasroom: [
    { id: "elias-room-elias", name: "Elias", x: .49, y: .56, kind: "person", art: "elias", text: "Schön, dass du hier bist. Wir können reden, den Computer ansehen oder uns einfach hinsetzen. Freie Dialogrekonstruktion." },
    { id: "elias-computer", name: "Elias’ Computer", x: .29, y: .38, display: { x: .275, y: .255 }, kind: "item", art: "landmark", text: "Computer und Programmieren waren schon am Anfang gemeinsame Gesprächsthemen. Die Einrichtung dieses Zimmers ist eine Spielinterpretation." },
    { id: "elias-shelf", name: "Regal", x: .22, y: .57, display: { x: .12, y: .52 }, kind: "item", art: "book", text: "Ein paar Bücher und freie Plätze im Regal. Diese Gegenstände gestalten den Raum, ohne weitere biografische Tatsachen zu behaupten." },
    { id: "elias-notes", name: "Platz für Gedanken", x: .67, y: .76, display: { x: .80, y: .745 }, kind: "item", art: "book", text: "Wünsche, Ideen, gemeinsame Erinnerungen. Manche Gespräche brauchen keine große Unternehmung." },
  ],
  radegast: [{ id: "radegast-way", name: "Weg zur Bushaltestelle", x: .56, y: .61, kind: "item", art: "sign", text: "Von Felices Wohnung geht es entlang der Häuser und am Grün vorbei zur Haltestelle. Der Weg ist für das Spiel verkürzt." }],
  zoerbig: [
    { id: "zoerbig-stop", name: "Zörbig · Markt", x: .60, y: .26, display: { x: .60, y: .19 }, kind: "item", art: "landmark", text: "Am Markt kommt ihr mit dem Bus an. Links oben liegt die Löwen-Apotheke, rechts das Rathaus. Unten links beginnt der Schulweg." },
    { id: "zoerbig-pharmacy", name: "Löwen-Apotheke", x: .255, y: .285, display: { x: .17, y: .165 }, kind: "item", art: "landmark", text: "Die Löwen-Apotheke steht an der oberen linken Ecke des Marktes." },
    { id: "zoerbig-townhall", name: "Rathaus Zörbig", x: .715, y: .42, display: { x: .827, y: .315 }, kind: "item", art: "landmark", text: "Das Rathaus mit seinem Uhrturm liegt an der rechten Marktseite." },
  ],
  schoolway: [
    { id: "zoerbig-church", name: "St. Mauritius", ...schoolWayPoint(.37,.60), display: schoolWayPoint(.70,.50), kind: "item", art: "landmark", text: "Am Weg zwischen Markt und Schule liegt St. Mauritius. Weiter südwestlich geht es zum Pausenhof." },
  ],
  gym: [
    { id: "graduation-elias", name: "Elias", x: .42, y: .76, kind: "person", art: "elias", text: "Jetzt haben wir beide unser Abschlusszeugnis. Komm, ein Foto von uns zwei muss sein." },
    { id: "paul", name: "Paul", x: .35, y: .62, kind: "person", art: "paul", text: "Also, ich hätte da eine Idee: Wir vier gehen Döner essen. Nur mal so als Vorschlag." },
    { id: "justin", name: "Justin", x: .64, y: .62, kind: "person", art: "justin", text: "Paul hat wieder seine Döneridee. Elias, Felice, ihr habt das auch gehört, oder?" },
    { id: "graduation-principal", name: "Schulleiter", x: .42, y: .31, kind: "person", art: "host", text: "Herzlichen Glückwunsch zu euren Abschlüssen. Heute bekommt ihr eure Zeugnisse." },
    { id: "graduation-mayor", name: "Bürgermeister", x: .60, y: .31, kind: "person", art: "stepfather", text: "Alles Gute für euren nächsten Schritt. Schön, heute mit euch zu feiern." },
    { id: "graduation-guest-one", name: "Ehrengast", x: .29, y: .33, kind: "person", art: "mother", text: "Herzlichen Glückwunsch euch beiden." },
    { id: "graduation-guest-two", name: "Ehrengast", x: .80, y: .33, kind: "person", art: "partner-two", text: "Genießt euren gemeinsamen Abschlussmoment." },
    { id: "graduation-certificates", name: "Eure Abschlusszeugnisse", x: .52, y: .32, display: { x: .52, y: .23 }, kind: "item", art: "certificate", text: "Elias und Felice haben beide ihr Abschlusszeugnis bekommen. Sommer 2026 – dieser Tag bleibt." },
    { id: "graduation-photo", name: "Ein Foto von euch beiden", x: .55, y: .76, display: { x: .63, y: .79 }, kind: "item", art: "camera", text: "Kurz zusammenstellen. Ein heller Blitz, dann die Schnappschüsse von Elias und Felice." },
  ],
  goelzau: [{ id: "goelzau-sign", name: "Schützenhaus Gölzau", x: .43, y: .35, display: { x: .40, y: .24 }, kind: "item", art: "landmark", text: "Am Schützenhaus in Weißandt-Gölzau trefft ihr eure Schießfreunde. Durch den Eingang geht es zur Bahn." }],
  bedroom: [{ id: "album", name: "Unser Erinnerungsbuch", x: .77, y: .32, display: { x: .68, y: .23 }, kind: "item", art: "book", text: "Der Anfang eurer Geschichte und Platz für weitere Erinnerungen. Öffne das Buch oben rechts: historische Daten, Fortschritt und erneutes Erleben." }, { id: "photo", name: "Foto aus Gölzau", x: .79, y: .52, display: { x: .885, y: .45 }, kind: "item", art: "photo", text: "Das Foto führt dich direkt zum Schießen in Gölzau." }],
  kitchen: [
    { id: "breakfast", name: "Frühstück vorbereiten", x: .535, y: .465, display: { x: .65, y: .465 }, kind: "item", art: "action", text: "Du bereitest ein kleines Frühstück vor und deckst den Küchentisch. Ein ruhiger Start in den Tag." },
    { id: "warm-drink", name: "Warmes Getränk machen", x: .21, y: .33, display: { x: .18, y: .17 }, kind: "item", art: "action", text: "Der Wasserkocher wird warm. Du machst dir ein warmes Getränk und nimmst dir einen kleinen Moment Zeit." },
    { id: "tidy-kitchen", name: "Küche aufräumen", x: .89, y: .48, display: { x: .8, y: .46 }, kind: "item", art: "action", text: "Du räumst das Geschirr weg und wischst den Tisch ab. Jetzt ist die Küche wieder gemütlich und ordentlich." },
    { id: "elias-kitchen", name: "Elias", x: .43, y: .58, kind: "person", art: "elias", text: "Ein Frühstück mit dir klingt gut. Wollen wir uns zusammen an den Tisch setzen?" },
  ],
  home: [
    { id: "family", name: "Felices Mutter", x: .28, y: .5, kind: "person", art: "mother", text: "Schön, dass ihr da seid. Hier ist immer Platz für euch." },
    { id: "stepfather", name: "Felices Stiefvater", x: .75, y: .47, kind: "person", art: "stepfather", text: "Kommt herein. Wir machen es uns heute alle zusammen gemütlich." },
    { id: "halfsister", name: "Felices Halbschwester", x: .32, y: .7, kind: "person", art: "halfsister", text: "Schön, heute Zeit miteinander zu verbringen." },
    { id: "halfsister-partner", name: "Freund der Halbschwester", x: .18, y: .62, kind: "person", art: "partner-one", text: "Hallo ihr beiden! Macht es euch gemütlich." },
    { id: "stepsister", name: "Tochter des Stiefvaters", x: .76, y: .8, kind: "person", art: "stepsister", text: "Heute sind wir zu acht. Das wird ein schöner gemeinsamer Abend." },
    { id: "stepsister-partner", name: "Ihr Freund", x: .86, y: .65, kind: "person", art: "partner-two", text: "Schön, dass wir heute alle zusammen hier sind." },
    { id: "elias-home", name: "Elias", x: .57, y: .77, kind: "person", art: "elias", text: "Am schönsten ist es, wenn wir gemeinsam hier sind." },
    { id: "dishes", name: "Geschirr", x: .77, y: .35, display: { x: .685, y: .345 }, kind: "item", art: "plates", text: "Teller, Besteck und Gläser für einen gemeinsamen Abend." },
    { id: "table", name: "Esstisch", x: .57, y: .53, display: { x: .57, y: .44 }, kind: "item", art: "star", text: "Ein Tisch voller kleiner Dinge, an die man sich später erinnert." },
    { id: "blanket", name: "Hundekissen", x: .3, y: .48, display: { x: .235, y: .325 }, kind: "item", art: "cushion", text: "Ein weiches Kissen für Anuks neuen Lieblingsplatz." },
  ],
  garden: [
    { id: "anuk", name: "Anuk", x: .58, y: .53, kind: "dog", art: "dog", text: "Anuk, euer American Akita, schnuppert an deiner Hand. Sein eingerollter Schwanz wippt zufrieden." },
    { id: "bowl", name: "Wassernapf", x: .32, y: .46, kind: "item", art: "bowl", text: "Frisches Wasser steht bereit." },
    { id: "ball", name: "Spielball", x: .74, y: .69, kind: "item", art: "ball", text: "Ein kleiner Ball, bereit für eine große Freundschaft." },
    { id: "dog-bed", name: "Anuks Platz", x: .35, y: .72, kind: "item", art: "bed", text: "Hier kann Anuk in Ruhe ankommen." },
  ],
  bus: [
    { id: "elias-bus", name: "Elias", x: .485, y: .49, kind: "person", art: "elias", text: "Ein gewöhnlicher Weg fühlt sich zusammen gleich anders an." },
    { id: "timetable", name: "Fahrplan · Radegast–Zörbig", x: .45, y: .455, display: { x: .45, y: .32 }, kind: "item", art: "sign", text: "Radegast ↔ Zörbig. Euer Schulbus verbindet die Haltestelle mit der Sekundarschule Zörbig. Rechts führt der Spielweg nach Gölzau." },
    { id: "ticket", name: "Fahrkarte", x: .39, y: .48, display: { x: .405, y: .40 }, kind: "item", art: "ticket", text: "Eine Fahrkarte für den gemeinsamen Weg." },
  ],
  school: [
    { id: "school-grille", name: "Treffpunkt am Fenstergitter", x: .225, y: .35, display: { x: .20, y: .51 }, kind: "item", art: "landmark", text: "Die niedrigen Gitter sitzen vor den unteren Fenstern des grauen Schulgebäudes. Hier stehen Elena, Jason, Luca und Wyatt in der Pause." },
    { id: "friends", name: "Elena", x: .18, y: .295, kind: "person", art: "elena", text: "Hey Felice! Wir treffen uns am Gitter beim Schulgebäude. Bleibst du noch ein bisschen bei mir?" },
    { id: "jason", name: "Jason", x: .25, y: .295, kind: "person", art: "jason", text: "Ich mache Fachabi. Neuer Abschnitt, aber unsere Sprüche bleiben natürlich dieselben." },
    { id: "luca", name: "Luca", x: .18, y: .39, kind: "person", art: "luca", text: "Hallo Felice. Heute ist es hier ziemlich ruhig. Das mag ich." },
    { id: "wyatt", name: "Wyatt", x: .25, y: .39, kind: "person", art: "wyatt", text: "Hey Felice! Schön, dass du da bist." },
    { id: "notebook", name: "Vergessenes Heft", x: .60, y: .80, kind: "item", art: "book", text: "Jemand hat ein Heft liegen gelassen." },
    { id: "school-door", name: "Eingang der Sekundarschule", x: .50, y: .28, display: { x: .50, y: .18 }, kind: "item", art: "bell", text: "Der Unterricht ist vorbei. Zeit für den gemeinsamen Heimweg." },
  ],
  range: [{ id: "range-host", name: "Trainer Hans", x: .32, y: .57, kind: "person", art: "hans", text: "Hallo Felice! Die Bahn ist bereit. Neun Schüsse, drei Scheiben. Nimm dir Zeit." }, { id: "shoot", name: "Schießbahn", x: .5, y: .44, kind: "item", art: "target", text: "Bereit für deine Runde?" },
    { id: "ida", name: "Ida", x: .19, y: .68, kind: "person", art: "ida", text: "Hallo Felice! Schön, dich beim Schießen zu sehen." },
    { id: "helena", name: "Helena", x: .32, y: .78, kind: "person", art: "helena", text: "Hi Felice! Wollen wir uns nach der Runde kurz zusammensetzen?" },
    { id: "alexander", name: "Alexander", x: .18, y: .50, kind: "person", art: "alexander", text: "Hey Felice! Schön, dass wir heute zusammen beim Schießen sind." },
    { id: "magdalena", name: "Magdalena", x: .45, y: .64, kind: "person", art: "magdalena", text: "Hallo Felice! Nach der Runde ist noch Zeit für eine gemeinsame Pause." },
    { id: "trainer-fritz", name: "Trainer Fritz", x: .64, y: .50, kind: "person", art: "fritz", text: "Hallo Felice! Hans und ich sind heute für euch da. Wenn du eine Frage zum Training hast, sprich uns an." },
    { id: "linda", name: "Linda", x: .78, y: .57, kind: "person", art: "linda", text: "Hallo! Die nächste Runde wartet schon auf uns." },
    { id: "lina", name: "Lina", x: .65, y: .68, kind: "person", art: "lina", text: "Hey Felice, wie läuft dein Tag bisher?" },
    { id: "alexandra", name: "Alexandra", x: .82, y: .70, kind: "person", art: "alexandra", text: "Schön, dass wir uns hier treffen. Viel Spaß bei deiner Runde!" },
  ],
};

export const CHAPTERS: Chapter[] = [
  { id: "dog", title: "Willkommen, Anuk", date: "Der Tag, an dem Anuk kam", icon: "♥", intro: "Anuk, ein American Akita, kommt an. Bereite ihm einen gemütlichen Platz vor und lerne ihn in Ruhe kennen.", ending: "Ein Napf, ein Kissen, ein gemeinsames Spiel. Aus einem neuen Ort wird für Anuk ein Zuhause.", reward: "Anuk begleitet dich im Garten", steps: [
    { id: "dog-family", place: "home", target: "family", label: "Sprich zu Hause mit Felices Mutter", speaker: "Felices Mutter", text: "Heute kommt Anuk. Lass uns seinen Platz vorbereiten, bevor wir ihn begrüßen." },
    { id: "dog-blanket", place: "home", target: "blanket", label: "Hol das Hundekissen", speaker: "Felice", text: "Die ist schön weich. Genau richtig für Anuks neuen Platz.", item: "Hundekissen" },
    { id: "dog-bed", place: "garden", target: "dog-bed", label: "Lege das Kissen auf Anuks Platz im Garten", speaker: "Felice", text: "So. Ein gemütlicher Rückzugsort, ganz für dich.", item: "-Hundekissen" },
    { id: "dog-water", place: "garden", target: "bowl", label: "Fülle Anuks Wassernapf", speaker: "Felice", text: "Frisches Wasser steht bereit. Jetzt darfst du erst einmal ankommen." },
    { id: "dog-hello", place: "garden", target: "anuk", label: "Begrüße Anuk ganz vorsichtig", speaker: "Anuk", text: "Eine feuchte Nase an deiner Hand. Anuk schnuppert, wartet kurz – und wedelt." },
    { id: "dog-ball", place: "garden", target: "ball", label: "Hol den Spielball", speaker: "Felice", text: "Ob du Lust auf eine kleine Runde hast?", item: "Spielball" },
    { id: "dog-play", place: "garden", target: "anuk", label: "Spiele mit Anuk", speaker: "Felice", text: "Anuk flitzt dem Ball hinterher und kommt zu dir zurück. Willkommen zu Hause, kleiner Freund.", item: "-Spielball" },
  ] },
  { id: "christmas", title: "Das erste Weihnachtsessen", date: "Historisches Datum noch offen", icon: "✦", intro: "Elias ist zum ersten Mal bei Felice zu Hause zum Weihnachtsessen. Der vorhandene Ablauf ist ein fiktionalisierter Szenenentwurf.", ending: "Zum ersten Mal Elias bei Felice zu Hause, gemeinsam am Weihnachtstisch. Das historische Datum und der genaue Ablauf werden noch ergänzt.", reward: "Weihnachtsstern im Erinnerungsbuch", steps: [
    { id: "xmas-meet", place: "bus", target: "elias-bus", label: "Begrüße Elias an der Haltestelle", speaker: "Elias", text: "Unser erstes Weihnachtsessen bei dir zu Hause. Ich freue mich darauf. Gehen wir zusammen?" },
    { id: "xmas-family", place: "home", target: "family", label: "Begrüßt Felices Mutter im Wohnzimmer", speaker: "Felices Mutter", text: "Frohe Weihnachten! Schön, dass du heute zum ersten Mal mit uns hier isst, Elias." },
    { id: "xmas-stepfather", place: "home", target: "stepfather", label: "Begrüßt Felices Stiefvater", speaker: "Felices Stiefvater", text: "Willkommen, Elias. Wir sind heute zu acht am Tisch. Macht es euch gemütlich." },
    { id: "xmas-halfsister", place: "home", target: "halfsister", label: "Sprecht mit Felices Halbschwester", speaker: "Felices Halbschwester", text: "Frohe Weihnachten! Schön, dass du dieses Jahr dabei bist, Elias." },
    { id: "xmas-halfpartner", place: "home", target: "halfsister-partner", label: "Begrüßt den Freund der Halbschwester", speaker: "Freund der Halbschwester", text: "Hallo ihr beiden! Ich freue mich auf den gemeinsamen Abend." },
    { id: "xmas-stepsister", place: "home", target: "stepsister", label: "Sprecht mit der Tochter des Stiefvaters", speaker: "Tochter des Stiefvaters", text: "Schön, euch zu sehen. Mein Freund und ich freuen uns, mit euch zu feiern." },
    { id: "xmas-steppartner", place: "home", target: "stepsister-partner", label: "Begrüßt ihren Freund", speaker: "Ihr Freund", text: "Frohe Weihnachten! Jetzt fehlt nur noch das gemeinsame Essen." },
    { id: "xmas-dishes", place: "home", target: "dishes", label: "Hol das Geschirr für den Weihnachtstisch", speaker: "Felice", text: "Wir helfen noch kurz beim Decken.", item: "Festtagsgeschirr" },
    { id: "xmas-table", place: "home", target: "table", label: "Decke den Weihnachtstisch", speaker: "Felice", text: "Alles steht bereit. Für Elias ist natürlich auch ein Platz frei.", item: "-Festtagsgeschirr" },
    { id: "xmas-elias", place: "home", target: "elias-home", label: "Sprich vor dem Essen mit Elias", speaker: "Elias", text: "Danke, dass ich heute hier sein darf. Es fühlt sich schön an, diesen Abend mit dir zu verbringen." },
    { id: "xmas-dinner", place: "home", target: "table", label: "Setzt euch zum gemeinsamen Weihnachtsessen", speaker: "Felice & Elias", text: "Das Essen beginnt. Stimmen am Tisch, warmes Licht und ein neuer gemeinsamer Moment." },
  ] },
  { id: "school", title: "Unser gemeinsamer Weg", date: "Radegast ↔ Zörbig", icon: "☀", intro: "Mit dem Bus von Radegast zur Sekundarschule Zörbig. Triff Elias an der Haltestelle, fahr mit ihm zur Schule und hilf euren Freunden.", ending: "Ein wiedergefundenes Heft, vertraute Gesichter und der Bus von Zörbig zurück nach Radegast. Ein kleiner Tag, der euch gehört.", reward: "Fahrkarte Radegast–Zörbig im Erinnerungsbuch", steps: [
    { id: "school-ticket", place: "bus", target: "ticket", label: "Nimm die Fahrkarte an der Haltestelle mit", speaker: "Felice", text: "Die Fahrkarte ist da. Jetzt fehlt nur noch Elias.", item: "Fahrkarte" },
    { id: "school-elias", place: "bus", target: "elias-bus", label: "Triff Elias an der Haltestelle", speaker: "Elias", text: "Da bist du! Schauen wir kurz nach dem Bus." },
    { id: "school-bus", place: "bus", target: "timetable", label: "Schau auf den Fahrplan nach Zörbig", speaker: "Felice", text: "Radegast nach Zörbig – unser Bus ist bereit. Über den Ausgang beim Bus fahren wir zum Markt in Zörbig. Von dort gehen wir zur Sekundarschule." },
    { id: "school-friends", place: "school", target: "friends", label: "Fahrt zur Sekundarschule Zörbig und begrüßt eure Freunde", speaker: "Freunde", text: "Hey! Habt ihr ein Heft gesehen? Es muss hier irgendwo liegen." },
    { id: "school-book", place: "school", target: "notebook", label: "Finde das vergessene Heft auf dem Schulhof", speaker: "Felice", text: "Da liegt es ja! Wir bringen es gleich zurück.", item: "Vergessenes Heft" },
    { id: "school-return", place: "school", target: "friends", label: "Gib das Heft zurück", speaker: "Freunde", text: "Danke euch! Das hätte ich morgen wirklich vermisst.", item: "-Vergessenes Heft" },
    { id: "school-home", place: "home", target: "elias-home", label: "Fahrt zurück und trefft euch zu Hause", speaker: "Elias", text: "Wieder da. Mit dir mag ich sogar den Weg nach Hause." },
  ] },
  { id: "shooting", title: "Schießen in Gölzau", date: "Ein Moment voller Konzentration", icon: "◎", intro: "Mach dich durch Radegast über die Haltestelle auf den Weg zum Schützenhaus in Gölzau. Auf der Bahn warten neun Schüsse auf dich.", ending: "Neun Schüsse, ein tiefer Atemzug und eine Erinnerung für euer Zimmer.", reward: "Erinnerungsmedaille und persönlicher Bestwert", steps: [
    { id: "range-welcome", place: "range", target: "range-host", label: "Begrüße Trainer Hans am Schießstand", speaker: "Trainer Hans", text: "Schön, dass du da bist. An der markierten Schießbahn geht es los. Die Punkte sind nicht alles – genieße den Moment." },
    { id: "range-play", place: "range", target: "shoot", label: "Spiele die neun Schüsse und bewahre die Erinnerung", speaker: "Felice", text: "Die Bahn ist frei. Los geht’s." },
  ] },
  { id: "graduation", title: "Unser Abschluss", date: "Sommer 2026", icon: "✧", intro: "Eine kleine Turnhalle, vertraute Gesichter und eure Abschlusszeugnisse. Paul, Justin und Elias sind da. Am Ende bleibt ein Fotomoment von euch beiden.", ending: "Zwei Abschlusszeugnisse, Pauls Döneridee und gemeinsame Schnappschüsse. Sommer 2026 – ein neuer Abschnitt für Elias und Felice.", reward: "Eure Schnappschüsse beim Fotopunkt in der Turnhalle", steps: [
    { id: "graduation-arrive", place: "gym", target: "graduation-elias", label: "Triff Elias in der kleinen Turnhalle", speaker: "Elias", text: "Da sind wir. Heute bekommen wir beide unser Abschlusszeugnis. Schon ein besonderer Moment, oder?" },
    { id: "graduation-principal-step", place: "gym", target: "graduation-principal", label: "Begrüße den Schulleiter", speaker: "Schulleiter", text: "Herzlich willkommen zur Zeugnisübergabe. Schön, diesen Abschluss gemeinsam mit euch zu feiern." },
    { id: "graduation-mayor-step", place: "gym", target: "graduation-mayor", label: "Sprich mit dem Bürgermeister", speaker: "Bürgermeister", text: "Herzlichen Glückwunsch und alles Gute für das, was jetzt kommt." },
    { id: "graduation-receive", place: "gym", target: "graduation-certificates", label: "Nehmt eure Abschlusszeugnisse entgegen", speaker: "Felice & Elias", text: "Jetzt halten wir beide unser Abschlusszeugnis in der Hand. Geschafft. Sommer 2026.", item: "Eure Abschlusszeugnisse" },
    { id: "graduation-doner", place: "gym", target: "paul", label: "Hör dir Pauls Idee an", speaker: "Paul", text: "Also, hört zu: Elias, Justin, Felice und ich – einfach Döner essen gehen. Was sagt ihr? Ich wollte die Idee nur mal wieder in den Raum werfen." },
    { id: "graduation-justin", place: "gym", target: "justin", label: "Sprich mit Justin", speaker: "Justin", text: "Paul schafft es sogar bei der Zeugnisübergabe, Döner vorzuschlagen. Erst mal Fotos, würde ich sagen." },
    { id: "graduation-snapshots", place: "gym", target: "graduation-photo", label: "Macht die Schnappschüsse von Elias und Felice", speaker: "Felice & Elias", text: "Ein kurzer weißer Blitz. Ein paar Bilder von uns beiden. Genau so bleibt dieser Moment." },
  ] },
];

export type StorySave = { version: 1; chapter: ChapterId | null; step: number; completed: ChapterId[]; place: Place; bag: string[] };
export const STORY_KEY = "felice-elias.story.v05";
export const EMPTY_STORY: StorySave = { version: 1, chapter: null, step: 0, completed: [], place: "bedroom", bag: [] };
export function currentStep(save: StorySave) { return CHAPTERS.find(c => c.id === save.chapter)?.steps[save.step]; }
export function beginChapter(save: StorySave, id: ChapterId): StorySave {
  const chapter = CHAPTERS.find(c => c.id === id)!;
  return { ...save, chapter: id, step: 0, bag: [], place: id === "shooting" ? "bedroom" : chapter.steps[0].place };
}
export function advanceStory(save: StorySave, target: string): StorySave {
  const step = currentStep(save);
  if (!step || step.place !== save.place || step.target !== target) return save;
  const bag = step.item?.startsWith("-") ? save.bag.filter(i => i !== step.item!.slice(1)) : step.item ? [...save.bag, step.item] : save.bag;
  const next = { ...save, step: save.step + 1, bag };
  if (!currentStep(next) && save.chapter && !save.completed.includes(save.chapter)) next.completed = [...save.completed, save.chapter];
  return next;
}
export function parseStory(raw: string | null): StorySave {
  if (!raw) return { ...EMPTY_STORY, completed: [], bag: [] };
  const s = JSON.parse(raw);
  const chapter = CHAPTERS.find(c => c.id === s?.chapter);
  if (s?.version !== 1 || !Object.hasOwn(PLACES, s.place) || (s.chapter !== null && !chapter) || !Number.isInteger(s.step) || s.step < 0 || s.step > (chapter?.steps.length ?? 0) || !Array.isArray(s.completed) || !s.completed.every((id: unknown) => CHAPTERS.some(c => c.id === id)) || !Array.isArray(s.bag) || !s.bag.every((i: unknown) => typeof i === "string")) throw new Error("Unbekannter Spielstand");
  return { version: 1, chapter: s.chapter, step: s.step, completed: [...new Set<ChapterId>(s.completed)], place: s.place, bag: s.bag.map((item: string) => item === "Kuscheldecke" ? "Hundekissen" : item) };
}
// Ground corridors measured against the V0.75 paintings. Their edges keep
// walkers on the pavement, including the curves between Markt and school.
const WALK_AREAS: Partial<Record<Place, Point[][]>> = {
  radegast: [[{x:.35,y:.16},{x:.39,y:.30},{x:.44,y:.44},{x:.50,y:.58},{x:.56,y:.72},{x:.645,y:.90},{x:.66,y:.94},{x:.80,y:.94},{x:.69,y:.72},{x:.625,y:.58},{x:.56,y:.44},{x:.50,y:.30},{x:.435,y:.16}]],
  zoerbig: [[{x:.245,y:.17},{x:.74,y:.17},{x:.755,y:.745},{x:.30,y:.78},{x:.18,y:.76},{x:.225,y:.41}]],
  schoolway: [[{x:.33,y:.40},{x:.315,y:.47},{x:.31,y:.55},{x:.32,y:.60},{x:.25,y:.67},{x:.14,y:.73},{x:.12,y:.77},{x:.18,y:.80},{x:.31,y:.71},{x:.38,y:.65},{x:.40,y:.61},{x:.37,y:.54},{x:.37,y:.46},{x:.39,y:.40}].map(p => schoolWayPoint(p.x,p.y))],
  goelzau: [[{x:.09,y:.26},{x:.61,y:.24},{x:.65,y:.32},{x:.69,y:.43},{x:.77,y:.50},{x:.83,y:.59},{x:.95,y:.59},{x:.95,y:.70},{x:.83,y:.73},{x:.79,y:.63},{x:.72,y:.55},{x:.66,y:.49},{x:.52,y:.45},{x:.35,y:.43},{x:.20,y:.42},{x:.09,y:.35}]],
};
// Secondary-school facade and centered entrance at the back of the courtyard.
// The primary school is outside this scene; only a planting strip bounds the right.
const SOLID_AREAS: Partial<Record<Place, Point[][]>> = {
  school: [
    [{x:0,y:0},{x:1,y:0},{x:1,y:0.223},{x:0,y:0.223}],
    [{x:0.421,y:0.176},{x:0.578,y:0.176},{x:0.578,y:0.25},{x:0.421,y:0.25}],
    [{x:0.019,y:0.061},{x:0.136,y:0.061},{x:0.136,y:0.233},{x:0.107,y:0.252},{x:0.022,y:0.239}],
    [{x:0.325,y:0.402},{x:0.373,y:0.386},{x:0.45,y:0.403},{x:0.457,y:0.415},{x:0.384,y:0.455},{x:0.323,y:0.426}],
    [{x:0.605,y:0.421},{x:0.646,y:0.398},{x:0.72,y:0.422},{x:0.74,y:0.439},{x:0.671,y:0.478},{x:0.598,y:0.44}],
    [{x:0.409,y:0.582},{x:0.46,y:0.56},{x:0.538,y:0.584},{x:0.557,y:0.605},{x:0.49,y:0.645},{x:0.402,y:0.604}],
    [{x:0.676,y:0.611},{x:0.722,y:0.589},{x:0.799,y:0.61},{x:0.821,y:0.636},{x:0.752,y:0.683},{x:0.667,y:0.644}],
    [{x:0,y:0.242},{x:0.119,y:0.239},{x:0.13,y:0.256},{x:0.057,y:0.267},{x:0,y:0.267}],
    [{x:0,y:0.276},{x:0.083,y:0.279},{x:0.114,y:0.296},{x:0.093,y:0.34},{x:0,y:0.34}],
    [{x:0,y:0.55},{x:0.083,y:0.55},{x:0.117,y:0.577},{x:0.088,y:0.63},{x:0,y:0.63}],
    [{x:0,y:0.759},{x:0.158,y:0.759},{x:0.19,y:0.783},{x:0.16,y:0.797},{x:0,y:0.797}],
    [{x:0.183,y:0.726},{x:0.339,y:0.765},{x:0.344,y:0.787},{x:0.317,y:0.824},{x:0.296,y:0.819},{x:0.32,y:0.774},{x:0.176,y:0.751}],
    [{x:0.301,y:0.811},{x:0.415,y:0.86},{x:0.429,y:0.921},{x:0.415,y:0.931},{x:0.398,y:0.879},{x:0.296,y:0.835}],
    [{x:0.082,y:0.847},{x:0.276,y:0.88},{x:0.305,y:0.904},{x:0.295,y:0.926},{x:0.277,y:0.917},{x:0.274,y:0.901},{x:0.08,y:0.87}],
    [{x:0.476,y:0.796},{x:0.49,y:0.789},{x:0.557,y:0.86},{x:0.531,y:0.885},{x:0.522,y:0.88},{x:0.464,y:0.815}],
    [{x:0,y:0.885},{x:0.286,y:0.927},{x:0.362,y:0.964},{x:0.393,y:1},{x:0,y:1}],
    [{x:0.622,y:0.921},{x:0.717,y:0.921},{x:0.79,y:1},{x:0.622,y:1}],
    [{x:0.944,y:0.25},{x:1,y:0.25},{x:1,y:1},{x:0.98,y:0.875},{x:0.956,y:0.591}],
    [{x:0.443,y:0.923},{x:0.479,y:0.923},{x:0.479,y:1},{x:0.443,y:1}],
    [{x:0.557,y:0.923},{x:0.588,y:0.923},{x:0.588,y:1},{x:0.557,y:1}],
  ],
};
function insideArea(x: number, y: number, points: Point[]) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const a = points[i], b = points[j];
    if ((a.y > y) !== (b.y > y) && x < (b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x) inside = !inside;
  }
  return inside;
}
export function canWalk(place: Place, x: number, y: number) {
  return (!SOLID_AREAS[place] || !SOLID_AREAS[place]!.some(points => insideArea(x,y,points))) && (!WALK_AREAS[place] || WALK_AREAS[place]!.some(points => insideArea(x,y,points))) && x >= .075 && x <= .94 && y >= .16 && y <= (place === "school" ? .96 : .92) && !PLACES[place].obstacles.some(o => x > o.left - .02 && x < o.right + .02 && y > o.top - .015 && y < o.bottom + .015);
}
export const SPAWNS: Record<Place, Point> = { bedroom: { x: .5, y: .7 }, home: { x: .5, y: .78 }, kitchen: { x: .5, y: .85 }, garden: { x: .5, y: .38 }, radegast: { x: .435, y: .28 }, bus: { x: .5, y: .72 }, zoerbig: { x: .43, y: .275 }, schoolway: schoolWayPoint(.35,.43), school: { x: .52, y: .92 }, gym: { x: .5, y: .85 }, goelzau: { x: .86, y: .63 }, range: { x: .5, y: .8 }, playground: { x: .50, y: .86 }, christmasmarket: { x: .50, y: .87 }, eliasroom: { x: .50, y: .85 } };

/** Story-pasture collisions match the fence rails, horses, barn and tree trunks. */
export function storyCanWalk(place: Place, x: number, y: number, options: { pasture?: boolean } = {}) {
  if (place !== "radegast" || !options.pasture) return canWalk(place, x, y);
  if (x < .075 || x > .94 || y < .16 || y > .92) return false;
  const solids = [
    { left: .045, right: .080, top: .18, bottom: .70 },
    { left: .06, right: .365, top: .185, bottom: .285 },
    { left: .06, right: .49, top: .58, bottom: .70 },
    { left: .105, right: .265, top: .34, bottom: .45 },
    { left: .245, right: .41, top: .47, bottom: .58 },
    { left: .69, right: .91, top: .275, bottom: .45 },
    ...[{ x:.10,y:.19 },{ x:.26,y:.16 },{ x:.615,y:.19 },{ x:.865,y:.24 },{ x:.865,y:.685 },{ x:.125,y:.92 }].map(p => ({ left:p.x-.015,right:p.x+.015,top:p.y-.06,bottom:p.y })),
  ];
  return !solids.some(o => x > o.left-.02 && x < o.right+.02 && y > o.top-.015 && y < o.bottom+.015);
}
export function routeTo(from: Place, to: Place): Exit | undefined {
  const queue: { place: Place; first?: Exit }[] = [{ place: from }];
  const seen = new Set<Place>([from]);
  while (queue.length) {
    const current = queue.shift()!;
    if (current.place === to) return current.first;
    for (const exit of PLACES[current.place].exits) if (!seen.has(exit.to)) { seen.add(exit.to); queue.push({ place: exit.to, first: current.first ?? exit }); }
  }
}
