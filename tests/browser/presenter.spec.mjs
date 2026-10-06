import { test, expect } from '@playwright/test';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const deck = (hash = '') => pathToFileURL(resolve('docs/presentation.html')).href + hash;

test('bottom dock and every navigation target stay fixed across all slide titles', async ({
  page,
}, testInfo) => {
  test.setTimeout(90000);
  await page.addInitScript(() => {
    Element.prototype.requestFullscreen = async () => {
      throw new Error('Test the dock in a fixed viewport');
    };
  });
  await page.goto(deck('#my-approach'));
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator('html')).toHaveCSS('scrollbar-gutter', 'stable');
  const geometry = () =>
    page.locator('.presenter-dock').evaluate((dock) =>
      [dock, ...dock.querySelectorAll(':scope > button')].map((node) => {
        const r = node.getBoundingClientRect();
        return { id: node.id || 'dock', x: r.x, y: r.y, width: r.width, height: r.height };
      }),
    );
  for (const size of [
    { width: 1440, height: 900 },
    { width: 800, height: 600 },
    { width: 390, height: 844 },
    { width: 320, height: 740 },
  ]) {
    await page.setViewportSize(size);
    for (const slides of [false, true]) {
      if (slides) await page.getByRole('button', { name: 'Enter slides', exact: true }).click();
      await page.keyboard.press('Home');
      await expect(page.locator('#counter')).toHaveText('1 / 20');
      const baseline = await geometry();
      await expect(page.locator('.presenter-dock')).toHaveCSS('position', 'fixed');
      expect(baseline[0].y + baseline[0].height).toBeLessThanOrEqual(size.height);
      if (!slides) expect(baseline[0].y + baseline[0].height).toBe(size.height);
      for (let n = 1; n <= 20; n++) {
        // Exercise real navigation through short/long titles and 9 -> 10 digits.
        if (n > 1) {
          if (n % 2) await page.getByRole('button', { name: 'Next slide', exact: true }).click();
          else await page.keyboard.press('ArrowRight');
        }
        await expect(page.locator('#counter')).toHaveText(`${n} / 20`);
        const actual = await geometry();
        for (const [i, rect] of actual.entries()) {
          for (const key of ['x', 'y', 'width', 'height']) {
            expect(
              Math.abs(rect[key] - baseline[i][key]),
              `${size.width}, slides=${slides}, slide=${n}, ${rect.id}.${key}`,
            ).toBeLessThan(0.5);
          }
          expect(rect.x).toBeGreaterThanOrEqual(0);
          expect(rect.x + rect.width).toBeLessThanOrEqual(size.width);
        }
      }
      await page.evaluate(() => scrollTo(0, document.body.scrollHeight));
      expect(await geometry()).toEqual(baseline);
      if (size.width === 1440)
        await page.screenshot({
          path: testInfo.outputPath(slides ? 'fixed-slide-dock.png' : 'fixed-document-dock.png'),
        });
      if (slides) await page.keyboard.press('Escape');
    }
  }
});

test('presenter overview searches all slides, jumps by title and restores focus', async ({
  page,
}, testInfo) => {
  await page.goto(deck('#interpreting-interface-results'));
  await expect(page.locator('#counter')).toHaveText('18 / 20');
  await expect(page.locator('.slide.active h2')).toHaveText(
    'Do the interface results hold across repeated attempts?',
  );
  await expect(page.locator('.slide.active .repeat-context')).toContainText(
    'one attempt per condition',
  );
  await page.getByRole('button', { name: /Open slide overview/ }).click();
  await expect(page.getByRole('dialog', { name: 'Jump to a slide' })).toBeVisible();
  await expect(page.getByRole('searchbox', { name: 'Find a slide' })).toBeFocused();
  await expect(page.locator('.slide-card')).toHaveCount(20);
  await page.getByRole('searchbox').fill('18');
  await expect(page.locator('.slide-card:visible')).toHaveCount(1);
  await page.getByRole('searchbox').fill('');
  await expect(page.locator('.slide-card[aria-current="page"]')).toContainText('repeated attempts');
  await page.screenshot({ path: testInfo.outputPath('overview.png') });
  await page.getByRole('searchbox').fill('zzzz no such slide');
  await expect(page.locator('#overview-empty')).toBeVisible();
  await page.getByRole('searchbox').press('Enter');
  await expect(page.locator('#counter')).toHaveText('18 / 20');
  await page.getByRole('searchbox').fill('highest score');
  await expect(page.locator('.slide-card:visible')).toHaveCount(1);
  await page.getByRole('searchbox').press('Enter');
  await expect(page.locator('#slide-overview')).not.toBeVisible();
  await expect(page).toHaveURL(/#main-lesson$/);
  await expect(page.locator('.slide.active h2')).toBeFocused();
  await page.keyboard.press('g');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: /Open slide overview/ })).toBeFocused();
  await page.goto(deck('#18'));
  await expect(page).toHaveURL(/#interpreting-interface-results$/);
});

test('presenter notes follow navigation and timer has explicit start pause and reset', async ({
  page,
}, testInfo) => {
  await page.goto(deck('#main-lesson'));
  await page.getByRole('button', { name: 'Show speaker notes' }).click();
  await expect(page.locator('#notes-content')).toContainText('They missed the same four');
  await expect(page.locator('#talk-time')).toHaveText('00:00');
  await page.getByRole('button', { name: 'Start timer', exact: true }).click();
  await expect(page.locator('#talk-time')).not.toHaveText('00:00');
  await page.getByRole('button', { name: 'Pause timer', exact: true }).click();
  const paused = await page.locator('#talk-time').textContent();
  await page.getByRole('button', { name: 'Next slide', exact: true }).click();
  await expect(page.locator('#notes-title')).toContainText('early interface tests');
  await expect(page.locator('#talk-time')).toHaveText(paused);
  await page.screenshot({ path: testInfo.outputPath('notes.png') });
  await page.getByRole('button', { name: 'Reset', exact: true }).click();
  await expect(page.locator('#talk-time')).toHaveText('00:00');
  await page.getByRole('button', { name: 'Close speaker notes' }).click();
  await expect(page.getByRole('button', { name: 'Show speaker notes' })).toBeFocused();
  await page.keyboard.press('Control+ArrowRight');
  await expect(page.locator('#counter')).toHaveText('16 / 20');
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#counter')).toHaveText('17 / 20');
  expect(await page.locator('.slide.active').evaluate((node) => node.getAnimations().length)).toBe(
    0,
  );
});

test('presentation view fits the viewport and recovers when fullscreen is unavailable', async ({
  page,
}, testInfo) => {
  await page.addInitScript(() => {
    Element.prototype.requestFullscreen = async () => {
      throw new Error('Not available in embedded browser');
    };
  });
  await page.goto(deck('#main-lesson'));
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.getByRole('button', { name: 'Enter slides', exact: true }).click();
  await expect(page.locator('body')).toHaveClass(/deck-presenting/);
  await expect(page.locator('#presenter-status')).toContainText('still fits this window');
  await expect
    .poll(async () =>
      page.locator('.slide.active').evaluate((node) => {
        const r = node.getBoundingClientRect(),
          nav = document.querySelector('.presenter-dock').getBoundingClientRect();
        return r.left >= 0 && r.right <= innerWidth + 1 && r.top >= 0 && r.bottom < nav.top;
      }),
    )
    .toBe(true);
  await page.screenshot({ path: testInfo.outputPath('present-fit.png') });
  await page.getByRole('button', { name: /Open slide overview/ }).click();
  await page.getByRole('searchbox').fill('14');
  await page.getByRole('searchbox').press('Enter');
  await expect(page.locator('#counter')).toHaveText('14 / 20');
  await page.locator('#model-results thead button').filter({ hasText: 'Passed' }).click();
  await expect(page.locator('#sort-status')).toContainText('Passed, descending');
  await page.keyboard.press('Escape');
  await expect(page.locator('body')).not.toHaveClass(/deck-presenting/);
  await expect(page.getByRole('button', { name: 'Enter slides', exact: true })).toHaveAttribute(
    'aria-pressed',
    'false',
  );
});

test('reading view keeps its simple footer and slide mode has one padded 16:9 canvas for every slide', async ({
  page,
}, testInfo) => {
  test.setTimeout(90000); // 100 distinct rendered slide/viewport states, with no retries.
  await page.addInitScript(() => {
    Element.prototype.requestFullscreen = async () => {
      throw new Error('Window-fit test');
    };
  });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(deck('#interface-results'));
  await page.evaluate(() => document.fonts.ready);
  expect(await page.evaluate(() => scrollY)).toBe(0);
  await expect(page.locator('body')).not.toHaveClass(/deck-presenting/);
  await expect(page.locator('.presenter-dock')).toHaveCSS('border-radius', '0px');
  await expect(page.locator('.reading-step-label').first()).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('document-view.png') });
  await page.getByRole('button', { name: 'Enter slides', exact: true }).click();
  for (const size of [
    { width: 1440, height: 900 },
    { width: 1280, height: 720 },
    { width: 1920, height: 1080 },
    { width: 800, height: 600 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(size);
    for (let n = 0; n < 20; n++) {
      await page.evaluate((i) => {
        location.hash = String(i + 1);
      }, n);
      await expect(page.locator('#counter')).toHaveText(`${n + 1} / 20`);
      if (n === 0) {
        await expect(page.locator('.slide.active .approach-flow .flow')).toHaveCSS(
          'flex-direction',
          'row',
        );
      }
      await expect
        .poll(
          () =>
            page.locator('.slide.active').evaluate((slide) => {
              const r = slide.getBoundingClientRect();
              const c = slide.querySelector('.slide-content').getBoundingClientRect();
              const dock = document.querySelector('.presenter-dock').getBoundingClientRect();
              const scale = r.width / 1280;
              return (
                Math.abs(r.width / r.height - 16 / 9) < 0.002 &&
                r.left >= 0 &&
                r.right <= innerWidth + 1 &&
                r.top >= 0 &&
                r.bottom < dock.top &&
                c.left >= r.left + 56 * scale - 1 &&
                c.right <= r.right - 56 * scale + 1 &&
                c.top >= r.top + 40 * scale - 1 &&
                c.bottom <= r.bottom - 40 * scale + 1
              );
            }),
          {
            message: `Slide ${n + 1} at ${size.width} must retain ratio, padding and viewport fit`,
          },
        )
        .toBe(true);
    }
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.evaluate(() => {
    location.hash = 'interface-results';
  });
  await expect(page.locator('#counter')).toHaveText('17 / 20');
  await page.screenshot({ path: testInfo.outputPath('slides-view.png') });
  await page.keyboard.press('Escape');
  await expect(page.locator('body')).not.toHaveClass(/deck-presenting/);
  await expect(page).toHaveURL(/#interface-results$/);
  await expect(page.locator('.slide-content').first()).toHaveCSS('display', 'contents');
});

test('presenter tools preserve canonical links, handle clipboard denial and leave print clean', async ({
  page,
}) => {
  await page.goto(deck('#main-lesson'));
  await page.getByRole('button', { name: 'Open presentation tools' }).click();
  await expect(page.getByRole('textbox', { name: 'Current slide link' })).toHaveValue(
    'https://relay.kevinliu.studio/presentation#main-lesson',
  );
  await expect(page.getByRole('link', { name: 'Download slides' })).toHaveAttribute(
    'download',
    'Relay-presentation.pdf',
  );
  await page.evaluate(() =>
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: async () => {
          throw new Error('Denied');
        },
      },
      configurable: true,
    }),
  );
  await page.getByRole('button', { name: 'Copy slide link' }).click();
  await expect(page.locator('#share-status')).toHaveText('Copy the selected link below.');
  await expect(page.getByRole('textbox', { name: 'Current slide link' })).toBeFocused();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Show speaker notes' }).click();
  await page.getByRole('button', { name: /Open slide overview/ }).click();
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('.presenter-dock')).not.toBeVisible();
  await expect(page.locator('#presenter-notes')).not.toBeVisible();
  await expect(page.locator('#slide-overview')).not.toBeVisible();
  await expect(page.locator('.slide:visible')).toHaveCount(20);
});

test('small-screen presenter controls stay reachable and notes do not leave hidden slide controls focusable', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(deck('#my-approach'));
  await page.getByRole('button', { name: 'Show speaker notes' }).click();
  await expect(page.locator('main')).toHaveAttribute('inert', '');
  await page.screenshot({ path: testInfo.outputPath('mobile-notes.png') });
  await page.getByRole('button', { name: 'Next slide', exact: true }).click();
  await expect(page.locator('#counter')).toHaveText('2 / 20');
  await page.getByRole('button', { name: 'Close speaker notes' }).click();
  await expect(page.locator('main')).not.toHaveAttribute('inert', '');
  await page.getByRole('button', { name: /Open slide overview/ }).click();
  expect(
    await page.locator('.slide-card').evaluateAll((cards) =>
      cards.every((card) => {
        const bottom = card.getBoundingClientRect().bottom;
        return [...card.children].every(
          (child) => child.getBoundingClientRect().bottom <= bottom - 8,
        );
      }),
    ),
  ).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('mobile-overview.png') });
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Next slide', exact: true }).click();
  expect(await page.locator('.slide.active').evaluate((node) => node.getAnimations().length)).toBe(
    0,
  );
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    for (const button of await page.locator('.presenter-dock button').all()) {
      const r = await button.boundingBox();
      expect(r.width).toBeGreaterThanOrEqual(24);
      expect(r.height).toBeGreaterThanOrEqual(24);
      expect(r.x).toBeGreaterThanOrEqual(0);
      expect(r.x + r.width).toBeLessThanOrEqual(width);
    }
  }
});
