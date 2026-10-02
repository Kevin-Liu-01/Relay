// Design-time export only. Pass an existing sharp/package.json, then six id=PNG
// arguments. Generated originals stay untouched; production only ships WebP.
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const sharp = createRequire(process.argv[2] ?? import.meta.url)('sharp');
const ids = ['alex', 'maya', 'jordan', 'sam', 'priya', 'leo'];
const sources = Object.fromEntries(
  process.argv.slice(3).map((arg) => {
    const split = arg.indexOf('=');
    return [arg.slice(0, split), arg.slice(split + 1)];
  }),
);
if (ids.some((id) => !sources[id]) || Object.keys(sources).length !== ids.length)
  throw Error('Provide exactly alex=PNG maya=PNG jordan=PNG sam=PNG priya=PNG leo=PNG.');
const directory = new URL('../src/assets/portraits/', import.meta.url);
mkdirSync(directory, { recursive: true });
const sha256 = (buffer) => createHash('sha256').update(buffer).digest('hex');
const assets = [];
for (const id of ids) {
  const original = readFileSync(sources[id]);
  const output = await sharp(original)
    .resize(256, 256, { fit: 'cover' })
    .webp({ quality: 82 })
    .toBuffer();
  writeFileSync(new URL(`${id}.webp`, directory), output);
  assets.push({
    id,
    file: `${id}.webp`,
    width: 256,
    height: 256,
    bytes: output.length,
    sha256: sha256(output),
    originalSha256: sha256(original),
  });
}
writeFileSync(
  new URL('provenance.json', directory),
  `${JSON.stringify(
    {
      generatedOn: '2026-10-02',
      origin: 'OpenAI built-in image generation; six separate fictional adult portraits',
      prompts: '../../../docs/portraits.md',
      transform: '256×256 WebP, quality 82; no creative edits',
      assets,
    },
    null,
    2,
  )}\n`,
);
console.log(
  `Exported ${assets.length} portraits (${assets.reduce((sum, a) => sum + a.bytes, 0)} bytes total).`,
);
