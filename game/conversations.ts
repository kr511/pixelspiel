// Confirmed topics: Paul suggests döner for Elias, Paul, Justin and Felice;
// Jason is doing his Fachabi. Wording and the other exchanges are game dialogue.
const CONVERSATIONS: Record<string, string> = {
  paul: "Ich sag’s ja nur: Wir vier könnten Döner essen gehen. Elias, Justin, Felice und ich. Man darf doch bei einer Zeugnisübergabe gute Ideen haben.\nFelice: Paul, du hast diese Idee diesen Sommer schon ein paar Mal gehabt.\nPaul: Eine gute Idee wird durchs Wiederholen nicht schlechter.",
  justin: "Paul hat schon wieder Döner vorgeschlagen. Irgendwann brauchen wir dafür einen eigenen Tagesordnungspunkt.\nFelice: Heute stehen erst mal Zeugnisse und Fotos auf dem Plan.\nJustin: Gut. Paul kann seine Idee so lange warmhalten.",
  jason: "Ich mache Fachabi. Neuer Abschnitt – aber keine Sorge, meine Sprüche nehme ich mit.\nFelice: Also bleibt wenigstens eine Sache beim Alten.\nJason: Genau. Ein bisschen Verlässlichkeit muss sein.",
  friends: "Manchmal besteht ein guter Schultag einfach daraus, gemeinsam über irgendwas zu lachen.\nFelice: Und danach weiß keiner mehr, warum.\nElena: Hauptsache, alle waren dabei.",
  luca: "Nur eine kurze Pause, hab ich gesagt. Jetzt stehen wir hier und reden schon wieder.\nFelice: Das zählt doch als sehr gründliche Pause.\nLuca: Dann waren wir heute richtig fleißig.",
  wyatt: "Wir sollten uns unsere besten Sprüche aufschreiben.\nFelice: Sobald man sie erklärt, sind sie nicht mehr lustig.\nWyatt: Stimmt. Dann behalten wir sie lieber einfach für uns.",
  'graduation-elias': "Jetzt haben wir beide unser Abschlusszeugnis. Und Paul denkt schon über Döner nach.\nFelice: Manche Dinge ändern sich wohl nie.\nElias: Komm, ein Foto von uns zwei. Damit wir den Moment behalten.",
  'elias-home': "Mit dir wird sogar ein ganz normaler Nachmittag zu einer Erinnerung.\nFelice: Sehr gut. Dann müssen wir heute gar nichts besonders Großes machen.\nElias: Zusammen hier sein reicht mir.",
  'elias-kitchen': "Wenn wir beide in der Küche stehen, wird wenigstens die Pause gut.\nFelice: Und das Frühstück?\nElias: Das kriegen wir auch noch hin.",
  'elias-bus': "Mit dir fühlt sich Warten an der Haltestelle ein bisschen kürzer an.\nFelice: Der Bus weiß das leider noch nicht.\nElias: Dann reden wir eben noch ein bisschen.",
  ida: "Manchmal ist die Pause zwischen zwei Runden der beste Teil.\nFelice: Weil wir dann wieder alle reden?\nIda: Genau. Konzentration schön und gut, aber zusammen lachen gehört auch dazu.",
  helena: "Erst konzentrieren, dann wieder quatschen. Das ist mein Plan.\nFelice: Und wenn das Quatschen länger dauert?\nHelena: Dann war es eben ein guter Plan mit einer längeren Pause.",
  alexander: "Ich wollte gerade etwas sehr Schlaues sagen.\nFelice: Und?\nAlexander: Jetzt hab ich’s vergessen. Zum Glück stehen wir hier unter Freunden.",
  magdalena: "Ein guter Tag braucht manchmal gar nicht viel.\nFelice: Freunde und eine Pause?\nMagdalena: Genau. Den Rest kriegen wir schon hin.",
};
export function personalConversation(id: string): string | undefined { return CONVERSATIONS[id]; }
