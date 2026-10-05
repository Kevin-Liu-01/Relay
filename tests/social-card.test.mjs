import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { socialImagePath, socialPages, withSocialMetadata } from '../scripts/lib/social-card.mjs';

const root = new URL('../', import.meta.url);
const read = (file) => readFileSync(new URL(file, root));
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');

test('social-card exports bind exact fonts, vector marks, portraits, and editable source', () => {
  const receipt = JSON.parse(read('docs/social-card-provenance.json'));
  assert.equal(receipt.kind, 'editable-product-illustration-not-agent-evidence');
  assert.equal(receipt.templateSha256, sha(read('docs/social-card.template.svg')));
  for (const [path, hash] of Object.entries({ ...receipt.assets, ...receipt.exports }))
    assert.equal(sha(read(path)), hash, path);
  for (const [file, scale] of [
    ['docs/relay-social.png', 1],
    ['docs/relay-social@2x.png', 2],
  ]) {
    const png = read(file);
    assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
    assert.equal(png.readUInt32BE(16), 1200 * scale);
    assert.equal(png.readUInt32BE(20), 630 * scale);
    assert.ok(png.length < 700_000, 'Keep the preview lightweight.');
  }
  const svg = read('docs/architecture.svg').toString();
  assert.doesNotMatch(svg, /\{\{|(?:href|src)=["']https?:|—/);
  assert.match(svg, /ILLUSTRATED TASK/);
  assert.match(svg, /EXPECTED RESULT/);
  assert.doesNotMatch(svg, /Task passed|WORKSPACE VERIFIED/);
  assert.match(svg, /Test computer/);
  assert.match(svg, /Relay Camber/);
  assert.match(svg, /Relay Lato/);
  for (const name of ['relay', 'northstar']) {
    const mark = read(`src/assets/${name}-mark.svg`).toString();
    for (const path of mark.matchAll(/<path [^>]*d="([^"]+)"/g))
      assert.ok(svg.includes(`d="${path[1]}"`));
  }
});

test('social metadata is static, page-specific, escaped, and idempotent', () => {
  const path = socialImagePath(read('docs/relay-social.png'));
  assert.match(path, /^\/assets\/relay-social-[a-f0-9]{16}\.png$/);
  for (const page of socialPages) {
    const original =
      '<!doctype html><html><head><title>Retain app title</title></head><body>App</body></html>';
    const html = withSocialMetadata(original, page, path);
    assert.equal(withSocialMetadata(html, page, path), html);
    assert.match(html, /<title>Retain app title<\/title>/);
    assert.equal((html.match(/property="og:image"/g) ?? []).length, 1);
    assert.equal((html.match(/name="twitter:card"/g) ?? []).length, 1);
    assert.ok(html.includes(`content="https://relay.kevinliu.studio${path}"`));
    assert.ok(
      html.includes(`property="og:url" content="https://relay.kevinliu.studio${page.path}"`),
    );
    assert.doesNotMatch(html, /—/);
  }
  const html = withSocialMetadata(
    '<head></head>',
    { path: '/', title: 'A "quote" & <tag>', description: 'Safe' },
    path,
  );
  assert.match(html, /A &quot;quote&quot; &amp; &lt;tag&gt;/);
  assert.throws(() => withSocialMetadata('<body></body>', socialPages[0], path), /document head/);
  assert.throws(
    () => withSocialMetadata('<head></head>', socialPages[0], 'https://outside.example/card.png'),
    /Unexpected/,
  );
});
