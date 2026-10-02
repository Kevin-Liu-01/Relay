import { expect } from '@playwright/test';

export async function expectNorthstarBrand(surface) {
  const mark = surface.getByRole('button', { name: 'Northstar home', exact: true }).locator('img');
  await expect(mark).toBeVisible();
  await expect(mark).toHaveAttribute('alt', '');
  await expect(mark).toHaveAttribute('src', /^\/assets\/northstar-mark-[\w-]+\.svg$/);
  await expect
    .poll(() => mark.evaluate((img) => img.complete && img.naturalWidth === 64))
    .toBe(true);
  await expect(surface.locator('img.northstar-signature')).toHaveAttribute(
    'src',
    await mark.getAttribute('src'),
  );
  // Replay scales the entire iframe; check its native layout, not the host's zoom.
  const size = await mark.evaluate((img) => ({ width: img.clientWidth, height: img.clientHeight }));
  expect(size.width).toBe(40);
  expect(size.height).toBe(40);
}

export async function expectRelayBrand(page, request, { logo = true } = {}) {
  const svgLink = page.locator('link[rel="icon"][type="image/svg+xml"]');
  await expect(svgLink).toHaveAttribute('href', /^\/assets\/relay-mark-[\w-]+\.svg$/);
  const svg = new URL(await svgLink.getAttribute('href'), page.url()).href;
  const response = await request.get(svg);
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('image/svg+xml');
  expect(await response.text()).toContain('viewBox="0 0 64 64"');
  if (logo) {
    const mark = page.locator('img.relay-mark');
    await expect(mark).toBeVisible();
    await expect(mark).toHaveAttribute('alt', ''); // Adjacent wordmark names the link once.
    expect(new URL(await mark.getAttribute('src'), page.url()).href).toBe(svg);
    expect(await mark.evaluate((img) => img.complete && img.naturalWidth === 64)).toBe(true);
  }
  const icoLink = page.locator('link[rel="icon"]:not([type])');
  const ico = await request.get(new URL(await icoLink.getAttribute('href'), page.url()).href);
  expect(ico.status()).toBe(200);
  expect(ico.headers()['content-type']).toContain('image/x-icon');
  const bytes = await ico.body();
  expect(bytes.readUInt16LE(2)).toBe(1); // Windows icon directory.
  expect(bytes.readUInt16LE(4)).toBe(2);
  expect([bytes[6], bytes[22]]).toEqual([16, 32]);
  const touch = await request.get(
    new URL(await page.locator('link[rel="apple-touch-icon"]').getAttribute('href'), page.url())
      .href,
  );
  expect(touch.status()).toBe(200);
  expect(touch.headers()['content-type']).toContain('image/png');
  const png = await touch.body();
  expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([180, 180]);
}
