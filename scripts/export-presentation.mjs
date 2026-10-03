// Reproducible document export, not interactive browser control.
import { chromium } from '@playwright/test';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto(pathToFileURL(resolve('docs/presentation.html')).href);
  await page.emulateMedia({ media: 'print' });
  await page.evaluate(() => document.fonts.ready);
  const clipped = await page.locator('.slide').evaluateAll((slides) =>
    slides
      .filter((s) => s.scrollHeight > s.clientHeight + 1 || s.scrollWidth > s.clientWidth + 1)
      .map((s) => ({
        title: s.dataset.title,
        height: s.scrollHeight,
        width: s.scrollWidth,
        children: [...s.children].map((c) => ({
          tag: c.tagName,
          height: c.getBoundingClientRect().height,
        })),
      })),
  );
  if (clipped.length)
    throw Error(`Presentation content overflows a printed page: ${JSON.stringify(clipped)}`);
  await page.pdf({
    path: 'docs/presentation.pdf',
    preferCSSPageSize: true,
    printBackground: true,
    tagged: true,
  });
  console.log(`Exported docs/presentation.pdf (${await page.locator('.slide').count()} slides).`);
} finally {
  await browser.close();
}
