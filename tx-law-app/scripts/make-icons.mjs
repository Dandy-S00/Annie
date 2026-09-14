#!/usr/bin/env node
// Generates the launcher icon PNGs with no image libraries — a solid rounded
// tile with a scales-of-justice glyph drawn from pixels, encoded as PNG.
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const outDir = dirname(fileURLToPath(import.meta.url)) + "/../www/icons";
mkdirSync(outDir, { recursive: true });

const BG = [15, 23, 42, 255];
const GOLD = [240, 180, 41, 255];
const BLUE = [79, 140, 255, 255];

function crc32(buf) {
  let c, crc = 0xffff;
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = c ^ (crc >>> 8);
  }
  return (crc ^ 0xffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const t = Buffer.from(type, "ascii");
  const body = Buffer.concat([t, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function png(size, pixels) {
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      const i = y * (size * 4 + 1) + 1 + x * 4;
      const p = pixels[y * size + x];
      raw[i] = p[0]; raw[i + 1] = p[1]; raw[i + 2] = p[2]; raw[i + 3] = p[3];
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;   // bit depth
  ihdr[9] = 6;   // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function makeIcon(size) {
  const px = new Array(size * size);
  const c = (size - 1) / 2;
  const corner = size * 0.22;
  const inRounded = (x, y) => {
    const dx = Math.max(corner - x, x - (size - 1 - corner), 0);
    const dy = Math.max(corner - y, y - (size - 1 - corner), 0);
    return Math.hypot(dx, dy) <= corner * 0.999;
  };
  const cx = size / 2, cy = size / 2;
  const barW = size * 0.86, barH = Math.max(1.5, size * 0.035);
  const postW = Math.max(2, size * 0.05), postH = size * 0.46;
  const beamW = size * 0.62, beamH = Math.max(1.5, size * 0.03);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let p = [0, 0, 0, 0];
      if (inRounded(x, y)) p = BG.slice();

      if (p[3] === 255) {
        const onPost = Math.abs(x - cx) <= postW / 2 && y >= cy - postH * 0.42 && y <= cy + postH * 0.42;
        const onBase = Math.abs(y - (cy + postH * 0.42)) <= barH / 2 && Math.abs(x - cx) <= barW / 2;
        const onBeam = Math.abs(y - (cy - postH * 0.42)) <= beamH / 2 && Math.abs(x - cx) <= beamW / 2;
        if (onPost || onBase || onBeam) p = GOLD.slice();

        const panY = cy + postH * 0.10;
        const panR = size * 0.085;
        [-1, 1].forEach((side) => {
          const panX = cx + side * beamW * 0.46;
          if (Math.hypot(x - panX, y - panY) <= panR * 0.94) p = BLUE.slice();
        });
      }
      px[y * size + x] = p;
    }
  }
  return png(size, px);
}

for (const size of [192, 512]) {
  const buf = makeIcon(size);
  writeFileSync(join(outDir, `icon-${size}.png`), buf);
  console.log(`wrote www/icons/icon-${size}.png (${buf.length} bytes)`);
}
