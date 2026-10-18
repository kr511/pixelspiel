// What happens after Felice picks an answer in a scene. Spoken answers are already Felice's words,
// so the reaction comes from the others or from the narration; nothing is echoed back.
// Keyed by `${eventId}/${stepId}`, then by the exact choice text.
export type Reaction = { speaker: string; text: string };

const said = (speaker: string, text: string): Reaction => ({ speaker, text });
const told = (text: string): Reaction => ({ speaker: "Erzählung", text });

export const REACTIONS: Record<string, Record<string, Reaction>> = {
  "beginning-2025-11-01/wake": {
    "Sich strecken und aufstehen": said("Felice", "Okay. Aufstehen. Der Tag wartet nicht."),
    "Noch kurz aus dem Fenster schauen": told("Draußen ist es noch grau. Die Bäume vor dem Fenster sind fast kahl."),
  },
  "beginning-2025-11-01/explore": {
    "Die Welt kennenlernen": said("Felice", "Na dann. Mal sehen, was Radegast heute so hergibt."),
    "Erst einmal durchatmen": told("Einmal tief durchatmen. Dann geht es los."),
  },
  "school-first-feelings-17/question": {
    "Wir verstehen uns halt einfach": said("Elena", "Aha. Einfach verstehen. Schon klar."),
    "Nur verlegen grinsen": said("Elena", "Dein Grinsen sagt mehr als tausend Worte."),
  },
  "school-first-feelings-19/compliment": {
    "Einfach zurückgucken": told("Felice hält seinem Blick stand. Keiner von beiden guckt zuerst weg."),
    "Lachen und wegschauen": told("Felice lacht und schaut weg. Aus dem Augenwinkel sieht sie, dass er grinst."),
  },
  "school-first-feelings-21/listen": {
    "Rot werden": told("Felice merkt, wie ihr warm im Gesicht wird."),
    "„Du sahst heute echt gut aus“": said("Elias", "Ach ja? Dann hat sich das Aufstehen ja gelohnt."),
  },
  "handholding-2025-11-25/hand": {
    "Seine Hand nehmen": told("Felice nimmt seine Hand. Sie ist warm."),
    "Lächeln und die Hand reichen": said("Elias", "Na also. Passt doch perfekt."),
  },
  "playground-2025-12-01/bench": {
    "Neben ihn setzen": told("Felice setzt sich neben ihn. Der Himmel wird langsam orange."),
    "Ganz nah ranrutschen": told("Felice rutscht ganz nah an ihn ran. Die Bank ist kalt, er nicht."),
  },
  "christmas-market-2025-12-06/stalls": {
    "„Na gut, ein Kinderpunsch“": said("Elias", "Kommt sofort. Ich nehm auch einen."),
    "„Du sollst mir nix kaufen“": said("Elias", "Zu spät. Der Kinderpunsch ist schon bestellt."),
  },
  "first-kiss-christmas/family": {
    "Mit der Familie reden": told("Am Tisch wird viel gelacht. Elias erzählt, und alle hören zu."),
    "Unterm Tisch seine Hand suchen": told("Unterm Tisch findet Felice seine Hand. Er drückt sie kurz."),
  },
  "first-kiss-christmas/kiss": {
    "Den Moment zulassen": told("Für einen Moment ist alles ganz still."),
    "Näher rücken": told("Felice rückt näher. Es fühlt sich genau richtig an."),
  },
  "january-everyday/cook": {
    "Gemeinsam etwas vorbereiten": said("Elias", "Du schneidest, ich rühre. Klingt nach einem Plan."),
    "Beim Vorbereiten miteinander reden": said("Elias", "Hauptsache, wir vergessen vor lauter Reden nicht den Herd."),
  },
  "january-everyday/future": {
    "Über gemeinsame Zeit sprechen": said("Elias", "Egal, was kommt. Hauptsache, wir machen es zusammen."),
    "Noch ein Stück spazieren": said("Elias", "Gute Idee. Ich hol schnell meine Jacke."),
  },
  "first-valentine/talk": {
    "„Einfach geradeaus“": said("Elias", "Geradeaus also. Mal sehen, wo wir landen."),
    "„Egal, Hauptsache mit dir“": said("Elias", "Das ist die beste Antwort, die du geben konntest."),
  },
  "elias-room-weekend/welcome": {
    "„Quatsch, euer Haus ist schön“": said("Elias", "Wenn du das sagst, glaub ich’s fast."),
    "„Mich juckt sowas nicht“": said("Elias", "Gut. Dann bleibst du hoffentlich trotzdem länger."),
  },
  "elias-room-weekend/bed": {
    "„Die sind aber auch echt lieb“": said("Elias", "Sag ich ihnen. Dann sind sie noch stolzer."),
    "„Und euer Haus ist schön, egal was du sagst“": said("Elias", "Okay, okay. Ich geb auf."),
  },
  "spring-everyday/study": {
    "Einen Gedanken erklären": said("Elias", "Jetzt, wo du’s erklärst, ergibt das sogar Sinn."),
    "Zusammen nach einer Lösung suchen": said("Elias", "Zu zweit ist das gleich nur halb so schlimm."),
  },
  "klassenfahrt-anreise/elias": {
    "Ich mich auch": said("Elias", "Dann kann ja nichts schiefgehen."),
    "Hoffentlich wird die Fahrt nicht zu lang": said("Elias", "Ich hab Snacks und Musik dabei. Das kriegen wir hin."),
  },
  "klassenfahrt-parlament/group": {
    "Lass uns ein Foto machen": said("Elena", "Alle zusammen! Und lächeln."),
    "Komm, wir gehen näher ran": said("Elena", "Aber nicht verlaufen. Das Ding hat bestimmt tausend Eingänge."),
  },
  "klassenfahrt-pokalabend/pizza": {
    "Margherita": said("Justin", "Einmal Margherita. Klassiker."),
    "Salami": said("Justin", "Salami, gute Wahl. Ich nehm die gleiche."),
  },
  "klassenfahrt-europapark/start": {
    "Erst rumlaufen": said("Luca", "Okay, aber danach Achterbahn. Versprochen?"),
    "Direkt Achterbahn": said("Luca", "Das ist die richtige Einstellung!"),
  },
  "klassenfahrt-europapark/again": {
    "Auf jeden Fall": said("Elena", "Wusst ich’s doch. Los, bevor die Schlange länger wird."),
    "Erst mal was trinken": said("Elena", "Okay, kurze Pause. Aber dann nochmal!"),
  },
  "klassenfahrt-hotelabend/talk": {
    "Mit dir auch": said("Elias", "Dann machen wir sowas bald wieder."),
    "Ich will noch gar nicht nach Hause": said("Elias", "Ich auch nicht. Lass uns die letzte Nacht genießen."),
  },
  "klassenfahrt-heimreise/thanks": {
    "Ich auch nicht": said("Elias", "Gut. Dann haben wir beide was, woran wir denken können."),
    "Wir schreiben später": said("Elias", "Auf jeden Fall. Komm gut nach Hause."),
  },
  "longer-visit-plan/plan": {
    "Über gemeinsame Zeit sprechen": said("Elias", "Ein ganzes Wochenende zusammen. Klingt gut."),
    "Erst mal schauen, wann es passt": said("Elias", "Klar. Kein Stress, wir finden was."),
  },
  "may-everyday/talk": {
    "Über einen schönen Gedanken reden": said("Elias", "Erzähl. Ich hab Zeit."),
    "Einen ruhigen Moment teilen": told("Eine Weile sagen beide nichts. Es ist trotzdem schön."),
  },
  "summer-everyday/walk": {
    "„Ich hab nur dich“": said("Elias", "Dann pass ich eben auf dich auf."),
    "„Handylicht reicht“": said("Elias", "Solange der Akku hält."),
  },
  "summer-july/bench": {
    "Ihn trotzdem nass spritzen": said("Elias", "Hey! Na warte, das gibt Rache."),
    "Unschuldig gucken": said("Elias", "Den Blick kauf ich dir nicht ab."),
  },
  "summer-august/bench": {
    "„Ich!“ und losrennen": said("Elias", "Hey, das war unfair! Ich war noch nicht bereit!"),
    "Erst mal Zeh ins Wasser": said("Elias", "Feigling. Ich bin schon drin!"),
  },
  "autumn-everyday/school": {
    "Über Schule sprechen": said("Elias", "Erzähl. Wie läuft es bei dir gerade?"),
    "Über Training und Hobbys sprechen": said("Elias", "Und? Wie lief das letzte Training?"),
  },
};
