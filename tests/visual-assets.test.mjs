import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

test('fictional portrait hashes, transfer budget and shared vector brand stay consistent', () => {
  const root = new URL('../src/assets/', import.meta.url);
  const provenance = JSON.parse(readFileSync(new URL('portraits/provenance.json', root)));
  assert.deepEqual(provenance.assets.map((asset) => asset.id).sort(), [
    'alex',
    'jordan',
    'leo',
    'maya',
    'priya',
    'sam',
  ]);
  const hashes = new Set();
  let total = 0;
  for (const asset of provenance.assets) {
    assert.equal(asset.file, `${asset.id}.webp`);
    const bytes = readFileSync(new URL(`portraits/${asset.file}`, root));
    assert.equal(bytes.toString('ascii', 0, 4), 'RIFF');
    assert.equal(bytes.toString('ascii', 8, 12), 'WEBP');
    assert.equal(bytes.length, asset.bytes);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), asset.sha256);
    assert.match(asset.originalSha256, /^[a-f0-9]{64}$/);
    assert.equal(asset.width, 256);
    assert.equal(asset.height, 256);
    hashes.add(asset.sha256);
    total += bytes.length;
  }
  assert.equal(hashes.size, 6);
  assert.ok(total < 60000, 'The six thumbnails should stay below 60 KB total.');
  const master = readFileSync(new URL('relay-mark.svg', root), 'utf8');
  const header = readFileSync(new URL('../docs/architecture.svg', import.meta.url), 'utf8');
  for (const path of master.matchAll(/<path [^>]*d="([^"]+)"/g))
    assert.ok(header.includes(`d="${path[1]}"`), 'README uses the same handoff mark.');
});
