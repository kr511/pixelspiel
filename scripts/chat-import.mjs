// Imports the WhatsApp export into the phone's "WhatsApp" tab.
//
//   node scripts/chat-import.mjs ["WhatsApp Chat - ….zip" | _chat.txt]
//
// Writes public/chat/index.json and one file per month (public/chat/YYYY-MM.json).
// public/chat/ is git-ignored: the private chat stays on this computer and never
// reaches GitHub or the public Pages build. Intimate and sexual passages are
// replaced by a short "privat" note.
import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const source = process.argv[2] ?? readdirSync(root).find(name => /^WhatsApp Chat.*\.zip$/i.test(name));
if (!source) throw new Error("Kein WhatsApp-Export gefunden. Pfad zur .zip oder _chat.txt angeben.");
const sourcePath = /^[a-z]:|^\//i.test(source) ? source : join(root, source);
const raw = /\.zip$/i.test(sourcePath) ? unzipChat(sourcePath) : readFileSync(sourcePath, "utf8");

function unzipChat(zip) {
  const options = { maxBuffer: 64 << 20, stdio: ["ignore", "pipe", "ignore"] };
  // Windows: .NET handles the emoji file name that tar cannot open. The path travels in an env variable.
  const powershell = "Add-Type -AssemblyName System.IO.Compression.FileSystem; $z=[IO.Compression.ZipFile]::OpenRead($env:CHAT_ZIP); $s=$z.GetEntry('_chat.txt').Open(); $o=[Console]::OpenStandardOutput(); $s.CopyTo($o); $s.Close(); $z.Dispose()";
  const attempts = process.platform === "win32"
    ? [() => execFileSync("powershell", ["-NoProfile", "-Command", powershell], { ...options, env: { ...process.env, CHAT_ZIP: zip } })]
    : [() => execFileSync("unzip", ["-p", zip, "_chat.txt"], options), () => execFileSync("tar", ["-xOf", zip, "_chat.txt"], options)];
  for (const attempt of attempts) { try { return attempt().toString("utf8"); } catch { /* next */ } }
  throw new Error(`_chat.txt konnte nicht aus ${zip} gelesen werden.`);
}

const LINE = /^\u200e?\[(\d\d)\.(\d\d)\.(\d\d), (\d\d:\d\d):\d\d\] ([^:]+): (.*)$/;
const messages = [];
for (const line of raw.split(/\r?\n/)) {
  const m = line.match(LINE);
  if (m) messages.push({ date: `20${m[3]}-${m[2]}-${m[1]}`, time: m[4], who: m[5].startsWith("Felinchen") ? "F" : "E", text: m[6] });
  else if (messages.length) messages.at(-1).text += "\n" + line;
}

// Attachments and calls become short labels; system notes and deleted messages are dropped.
function clean(text) {
  text = text.replaceAll("\u200e", "").replace(/\s*<Diese Nachricht wurde bearbeitet\.>/g, "").trim();
  const attachment = text.match(/<Anhang: [^>]*?-(PHOTO|VIDEO|AUDIO|STICKER|GIF)-[^>]*>/) ?? text.match(/<Anhang: [^>]*\.(jpg|jpeg|png|webp|mp4|mov|opus|m4a|pdf|docx|vcf|was|nebo)>/i);
  if (attachment) {
    const kind = attachment[1].toUpperCase();
    const label = kind === "PHOTO" || /JPE?G|PNG/.test(kind) ? "📷 Foto" : kind === "VIDEO" || /MP4|MOV/.test(kind) ? "🎬 Video" : kind === "AUDIO" || /OPUS|M4A/.test(kind) ? "🎤 Sprachnachricht" : kind === "STICKER" || kind === "WAS" || kind === "WEBP" ? "Sticker" : kind === "GIF" ? "GIF" : "📎 Datei";
    const caption = text.replace(attachment[0], "").trim();
    return caption ? `${label}\n${caption}` : label;
  }
  if (/weggelassen$/.test(text)) return "📎 Medien";
  if (/^(Verpasster )?(Sprach|Video)anruf/.test(text)) return `📞 ${text.replace(/\.\s*/g, " · ").replace(/ · $/, "").replace(" · Zum Zurückrufen tippen", "")}`;
  if (/Ende-zu-Ende-verschlüsselt|Nachricht wurde gelöscht|hast diese Nachricht gelöscht/.test(text)) return null;
  return text;
}

// Explicit vocabulary marks a passage as private. Everything within 20 minutes of a
// marked message (chained) is hidden too, so whole intimate conversations disappear.
const EXPLICIT = /\b(fick\w*|gefickt|durchfick\w*|bums\w*|vögel\w*|blas(en|e|t)|geblasen|lutsch\w*|schwanz|schwänze|penis|pussy|muschi|titt\w*|brüste|nippel|nackt\w*|sex\w*|porn\w*|orgasm\w*|stöhn\w*|befriedig\w*|selbstbefriedig\w*|abspritz\w*|sperma|ladung|kondom\w*|dildo|vibrator|dessous|unterwäsche|tanga|doggy|reiter(stellung)?|stellung(en)?|daddy|versohl\w*|würg\w*|feucht\w*|klatschnass|nass machen|horny|erregt|erregung|ständer|steif|leck(en|st|t)|geleckt|oberschenkel|intim\w*|vorspiel|kommst du in|in meinen mund|runterschluck\w*|geil auf|geil gemacht|geil bist|geil machen|macht mich (so )?an|anmachen|zunge|notgeil|bist du geil|warst du (gestern )?geil|durch mich geil|zu geil|pille|periode|meine tage|frauenarzt\w*|verhüt\w*)\b/i;
// Word parts that also mark compounds ("Gruppen…", "Zungen…").
const EXPLICIT_PART = /sex|wichs|fick|zungenkuss|porno|orgas|sperma|blowjob|nackt|vögel|titten/i;
const explicit = text => EXPLICIT.test(text) || EXPLICIT_PART.test(text);
const WINDOW = 20;
const minutes = msg => Date.parse(`${msg.date}T${msg.time}:00Z`) / 60000;
const hidden = new Array(messages.length).fill(false);
for (let index = 0; index < messages.length; index++) {
  if (!explicit(messages[index].text)) continue;
  hidden[index] = true;
  for (let back = index - 1; back >= 0 && minutes(messages[index]) - minutes(messages[back]) <= WINDOW; back--) hidden[back] = true;
  for (let next = index + 1; next < messages.length && minutes(messages[next]) - minutes(messages[next - 1]) <= WINDOW && minutes(messages[next]) - minutes(messages[index]) <= WINDOW; next++) hidden[next] = true;
}

const months = new Map();
let shown = 0, privateCount = 0;
messages.forEach((msg, index) => {
  const month = msg.date.slice(0, 7);
  if (!months.has(month)) months.set(month, {});
  const days = months.get(month);
  days[msg.date] ??= [];
  const day = days[msg.date];
  if (hidden[index]) {
    privateCount++;
    const last = day.at(-1);
    if (last?.[1] === "P") last[2] = String(Number(last[2]) + 1);
    else day.push([msg.time, "P", "1"]);
    return;
  }
  const text = clean(msg.text);
  if (text === null) return;
  shown++;
  day.push([msg.time, msg.who, text]);
});

const out = join(root, "public", "chat");
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
const index = { title: "Felinchen❤️", messages: shown, private: privateCount, days: [] };
for (const [month, days] of months) {
  for (const [date, entries] of Object.entries(days)) if (entries.length) index.days.push({ date, count: entries.filter(entry => entry[1] !== "P").length });
  writeFileSync(join(out, `${month}.json`), JSON.stringify(days));
}
writeFileSync(join(out, "index.json"), JSON.stringify(index));
console.log(`${shown} Nachrichten an ${index.days.length} Tagen importiert, ${privateCount} private Nachrichten ausgeblendet → public/chat/`);
