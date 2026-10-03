// Update document-only preview files without touching the active actor build.
import { readFileSync, writeFileSync, copyFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
const sha = (v) => createHash('sha256').update(v).digest('hex');
const presentation = readFileSync('docs/presentation.html', 'utf8').replace(
  /data:font\/woff2;base64,([A-Za-z0-9+/=]+)/g,
  (_, data) => {
    const font = Buffer.from(data, 'base64'),
      name = `presentation-${sha(font).slice(0, 16)}.woff2`;
    if (
      !existsSync(`dist/assets/${name}`) ||
      sha(readFileSync(`dist/assets/${name}`)) !== sha(font)
    )
      throw Error('Font assets differ; do a full build only when no benchmark is running.');
    return `./assets/${name}`;
  },
);
const controls = presentation.match(/<script>([\s\S]*?)<\/script>/);
if (!controls) throw Error('Presentation controls missing.');
writeFileSync('dist/presentation-controls.js', controls[1]);
writeFileSync(
  'dist/presentation.html',
  presentation.replace(controls[0], '<script src="./presentation-controls.js"></script>'),
);
if (existsSync('docs/presentation.pdf'))
  copyFileSync('docs/presentation.pdf', 'dist/presentation.pdf');
