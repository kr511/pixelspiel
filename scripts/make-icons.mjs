// Generates the PWA icons (pixel heart "F × E") as PNG without extra dependencies.
// Run: node scripts/make-icons.mjs
import { mkdirSync, writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";

const HEART = [
  "..XX...XX..",
  ".XXXX.XXXX.",
  "XXXXXXXXXXX",
  "XXXXXXXXXXX",
  "XXXXXXXXXXX",
  ".XXXXXXXXX.",
  "..XXXXXXX..",
  "...XXXXX...",
  "....XXX....",
  ".....X.....",
];
const COLORS = { bg: [29, 38, 48], ring: [217, 189, 129], heart: [184, 70, 58], shine: [255, 226, 160], violet: [109, 90, 163] };

function crc32(buffer) {
  let crc = ~0;
  for (const byte of buffer) { crc ^= byte; for (let k = 0; k < 8; k++) crc = crc >>> 1 ^ (crc & 1 ? 0xedb88320 : 0); }
  return ~crc >>> 0;
}
function chunk(type, data) {
  const length = Buffer.alloc(4); length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}
function png(size, pixel) {
  const raw = Buffer.alloc((size * 3 + 1) * size);
  for (let y = 0; y < size; y++) { raw[y * (size * 3 + 1)] = 0; for (let x = 0; x < size; x++) { const [r, g, b] = pixel(x, y); const i = y * (size * 3 + 1) + 1 + x * 3; raw[i] = r; raw[i + 1] = g; raw[i + 2] = b; } }
  const header = Buffer.alloc(13); header.writeUInt32BE(size, 0); header.writeUInt32BE(size, 4); header[8] = 8; header[9] = 2; header[10] = 0; header[11] = 0; header[12] = 0;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", header), chunk("IDAT", deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}
/** `safe` shrinks the motif for maskable icons (Android crops to a circle). */
function icon(size, safe = 1) {
  const cell = Math.floor(size * .62 * safe / HEART[0].length);
  const width = cell * HEART[0].length, height = cell * HEART.length;
  const left = Math.floor((size - width) / 2), top = Math.floor((size - height) / 2 + cell * .4);
  return png(size, (x, y) => {
    const cx = x - size / 2, cy = y - size / 2, radius = Math.hypot(cx, cy) / (size / 2);
    const gx = Math.floor((x - left) / cell), gy = Math.floor((y - top) / cell);
    if (gy >= 0 && gy < HEART.length && gx >= 0 && gx < HEART[0].length && HEART[gy][gx] === "X") return gx === 2 && gy === 2 || gx === 3 && gy === 2 || gx === 2 && gy === 3 ? COLORS.shine : COLORS.heart;
    if (safe === 1 && radius > .86 && radius < .94) return COLORS.ring;
    return radius < .86 || safe !== 1 ? (Math.floor(x / cell) + Math.floor(y / cell)) % 2 ? COLORS.bg : [33, 44, 55] : COLORS.violet;
  });
}
mkdirSync(new URL("../public/icons/", import.meta.url), { recursive: true });
writeFileSync(new URL("../public/icons/icon-192.png", import.meta.url), icon(192));
writeFileSync(new URL("../public/icons/icon-512.png", import.meta.url), icon(512));
writeFileSync(new URL("../public/icons/icon-maskable-512.png", import.meta.url), icon(512, .72));
writeFileSync(new URL("../public/icons/apple-touch-icon.png", import.meta.url), icon(180, .9));
console.log("Icons geschrieben: public/icons/");
