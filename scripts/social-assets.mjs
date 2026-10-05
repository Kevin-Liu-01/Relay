// Design-time document renderer. No provider calls or trial data mutations.
import { readFileSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright-core';
import { createHash } from 'node:crypto';

const root = new URL('../', import.meta.url);
const read = (path) => readFileSync(new URL(path, root));
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const assets = {};
function asset(path) {
  const bytes = read(path);
  assets[path] = sha(bytes);
  return bytes;
}
const innerMark = (path) =>
  asset(path)
    .toString('utf8')
    .replace(/<svg[^>]*>|<\/svg>/g, '')
    .trim();
const fields = {
  RELAY_MARK: innerMark('src/assets/relay-mark.svg'),
  NORTHSTAR_MARK: innerMark('src/assets/northstar-mark.svg'),
  ALEX: `data:image/webp;base64,${asset('src/assets/portraits/alex.webp').toString('base64')}`,
  MAYA: `data:image/webp;base64,${asset('src/assets/portraits/maya.webp').toString('base64')}`,
  FONTS: [
    ['Relay Camber', 400, 'camber-regular.woff2'],
    ['Relay Camber', 500, 'camber-medium.woff2'],
    ['Relay Camber', 600, 'camber-semibold.woff2'],
    ['Relay Lato', 400, 'slack-lato-regular.woff2'],
    ['Relay Lato', 700, 'slack-lato-bold.woff2'],
  ]
    .map(
      ([family, weight, file]) =>
        `@font-face{font-family:'${family}';font-weight:${weight};src:url(data:font/woff2;base64,${asset(`src/assets/fonts/${file}`).toString('base64')}) format('woff2');}`,
    )
    .join('\n'),
};
const template = read('docs/social-card.template.svg').toString('utf8');
const svg = template.replace(/\{\{([A-Z_]+)\}\}/g, (_, name) => {
  if (!(name in fields)) throw Error(`Unknown social-card field: ${name}`);
  return fields[name];
});
writeFileSync(new URL('docs/architecture.svg', root), svg);
const browser = await chromium.launch({ headless: true });
try {
  for (const scale of [1, 2]) {
    const page = await browser.newPage({
      viewport: { width: 1200, height: 630 },
      deviceScaleFactor: scale,
    });
    await page.route('**/*', (route) => route.abort());
    await page.setContent(`<style>body{margin:0}svg{display:block}</style>${svg}`);
    await page.evaluate(() => document.fonts.ready);
    const errors = await page.evaluate(() => {
      const problems = [];
      for (const node of document.querySelectorAll('text')) {
        const rect = node.getBoundingClientRect();
        if (rect.x < 0 || rect.y < 0 || rect.right > 1200 || rect.bottom > 630)
          problems.push(node.textContent);
      }
      for (const font of ['600 66px "Relay Camber"', '700 21px "Relay Lato"'])
        if (!document.fonts.check(font)) problems.push(`Missing font: ${font}`);
      return problems;
    });
    if (errors.length) throw Error(`Social-card layout failed: ${JSON.stringify(errors)}`);
    await page.screenshot({
      path: new URL(`docs/relay-social${scale === 2 ? '@2x' : ''}.png`, root).pathname,
    });
    await page.close();
  }
} finally {
  await browser.close();
}
writeFileSync(
  new URL('docs/social-card-provenance.json', root),
  JSON.stringify(
    {
      kind: 'editable-product-illustration-not-agent-evidence',
      width: 1200,
      height: 630,
      templateSha256: sha(read('docs/social-card.template.svg')),
      assets,
      exports: Object.fromEntries(
        ['docs/architecture.svg', 'docs/relay-social.png', 'docs/relay-social@2x.png'].map(
          (path) => [path, sha(read(path))],
        ),
      ),
    },
    null,
    2,
  ) + '\n',
);
console.log('Rendered editable SVG, 1200×630 and 2400×1260 PNG social cards. No model inference.');
