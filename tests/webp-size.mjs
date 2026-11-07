/** Reads [width, height] and the container signature of a WebP file (VP8X, VP8L or VP8). */
export function webpInfo(buffer) {
  const riff = buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP";
  const kind = buffer.subarray(12, 16).toString("ascii");
  let size = [0, 0];
  if (kind === "VP8X") size = [1 + buffer.readUIntLE(24, 3), 1 + buffer.readUIntLE(27, 3)];
  else if (kind === "VP8L") { const bits = buffer.readUInt32LE(21); size = [1 + (bits & 0x3fff), 1 + ((bits >> 14) & 0x3fff)]; }
  else if (kind === "VP8 ") size = [buffer.readUInt16LE(26) & 0x3fff, buffer.readUInt16LE(28) & 0x3fff];
  return { riff, size };
}
