import { test, expect } from '@playwright/test';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const deck = (hash = '') => pathToFileURL(resolve('docs/presentation.html')).href + hash;

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
  await page.getByRole('button', { name: 'Enter presentation view' }).click();
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
  await expect(page.getByRole('button', { name: 'Enter presentation view' })).toHaveAttribute(
    'aria-pressed',
    'false',
  );
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
