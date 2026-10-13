import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

const width = 1000, height = 620;
const pixels = Buffer.alloc(width * height * 4, 255);
const setPixel = (x, y, color, radius = 1) => {
  for (let dy = -radius; dy <= radius; dy++) for (let dx = -radius; dx <= radius; dx++) {
    const px = Math.round(x + dx), py = Math.round(y + dy);
    if (px < 0 || py < 0 || px >= width || py >= height) continue;
    const offset = (py * width + px) * 4;
    pixels[offset] = color[0]; pixels[offset + 1] = color[1]; pixels[offset + 2] = color[2];
  }
};
const line = (x1, y1, x2, y2, color = [57, 56, 53], radius = 1) => {
  const steps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    setPixel(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t, color, radius);
  }
};

// Beginner cube: the upper-left receding edge deliberately misses the vanishing point.
const reference = [
  [[290,350],[450,350]], [[450,350],[450,510]], [[450,510],[290,510]], [[290,510],[290,350]],
  [[290,350],[365,315]], [[450,350],[470,318]], [[450,510],[470,385]],
  [[365,315],[470,318]], [[470,318],[470,385]]
];
line(80,260,920,260,[222,204,188],0);
for (const [[x1,y1],[x2,y2]] of reference) line(x1,y1,x2,y2);
line(290,350,370,290,[57,56,53],1); // the intentionally incorrect perspective line
setPixel(520,260,[244,119,88],5);

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = buffer => {
  let c = 0xffffffff;
  for (const byte of buffer) c = crcTable[(c ^ byte) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (name, data) => {
  const kind = Buffer.from(name);
  const length = Buffer.alloc(4); length.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([kind, data])));
  return Buffer.concat([length, kind, data, crc]);
};
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4); ihdr[8] = 8; ihdr[9] = 6;
const raw = Buffer.alloc(height * (width * 4 + 1));
for (let y = 0; y < height; y++) pixels.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
const png = Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
const imagePath = '/tmp/corgikiki-sample-cube.png';
const payloadPath = '/tmp/corgikiki-review.json';
writeFileSync(imagePath, png);
writeFileSync(payloadPath, JSON.stringify({
  image: `data:image/png;base64,${png.toString('base64')}`,
  exerciseId: 'cube', seed: 1, strokeCount: reference.length + 1, difficulty: 'Beginner',
  instructions: [
    'Find the dotted horizon and the little vanishing point.',
    'Draw the front face as a simple square, below the horizon.',
    'Connect its corners toward the vanishing point.',
    'Close the back edge, then darken only the visible cube edges.'
  ],
  geometry: { horizonY: 260, vanishing: { x: 520, y: 260 }, reference: reference.map(([from,to]) => ({ from: { x: from[0], y: from[1] }, to: { x: to[0], y: to[1] } })) }
}));
console.log(`Wrote ${imagePath} and ${payloadPath}`);
