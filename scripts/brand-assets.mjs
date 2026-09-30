// Optional design-time export only; shipped assets need no image dependency.
// Use a local sharp installation, or pass its absolute package.json path.
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync } from 'node:fs';
const sharp = createRequire(process.argv[2] ?? import.meta.url)('sharp');
const asset = (name) => new URL(`../src/assets/${name}`, import.meta.url);
const source = readFileSync(asset('relay-mark.svg'));
const sizes = [16, 32];
const pngs = await Promise.all(sizes.map((size) => sharp(source).resize(size).png().toBuffer()));
const header = Buffer.alloc(6 + 16 * sizes.length);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(sizes.length, 4);
let offset = header.length;
for (let i = 0; i < sizes.length; i++) {
  const entry = 6 + i * 16;
  header[entry] = sizes[i];
  header[entry + 1] = sizes[i];
  header.writeUInt16LE(1, entry + 4);
  header.writeUInt16LE(32, entry + 6);
  header.writeUInt32LE(pngs[i].length, entry + 8);
  header.writeUInt32LE(offset, entry + 12);
  offset += pngs[i].length;
}
writeFileSync(asset('relay-favicon.ico'), Buffer.concat([header, ...pngs]));
await sharp(source).resize(180).png().toFile(asset('relay-touch.png').pathname);
console.log('Exported Relay 16/32px favicon and 180px touch icon from relay-mark.svg.');
