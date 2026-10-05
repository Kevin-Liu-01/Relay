import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { presenterNotes } from '../scripts/lib/presenter-notes.mjs';

test('presenter notes bind all twenty sections to the real slide sequence', () => {
  const titles = [
    ...readFileSync('docs/presentation.template.html', 'utf8').matchAll(
      /<section\b[^>]*data-title="([^"]+)"/g,
    ),
  ].map((m) => m[1]);
  const html = presenterNotes(readFileSync('docs/presentation-notes.md', 'utf8'), titles);
  assert.equal(titles.length, 20);
  assert.equal([...html.matchAll(/<template data-presenter-notes=/g)].length, 20);
  assert.match(html, /<template data-presenter-notes="19">/);
  assert.match(html, /Both collections were sequential|forty|computer-use|computer use/);
});

test('notes escape raw HTML and render paragraphs, lists, emphasis and safe links', () => {
  const html = presenterNotes(
    '## 1. Example\n\n<script>alert("x")</script>\n\n- **First**\n  continued\n- `Second`\n\n[Source](research.md)\n',
    ['Example'],
  );
  assert.ok(!html.includes('<script>'));
  assert.match(html, /&lt;script&gt;/);
  assert.match(html, /<li><strong>First<\/strong> continued<\/li>/);
  assert.match(html, /https:\/\/github.com\/Kevin-Liu-01\/Relay\/blob\/main\/docs\/research.md/);
  assert.match(html, /rel="noopener noreferrer"/);
});

test('notes reject missing, mismatched and unsafe sections', () => {
  assert.throws(() => presenterNotes('## 1. Example\nNotes', ['Example', 'Missing']));
  assert.throws(() => presenterNotes('## 2. Example\nNotes', ['Example']));
  assert.throws(() => presenterNotes('## 1. Wrong\nNotes', ['Example']));
  assert.throws(() => presenterNotes('## 1. Example\n[Bad](javascript:alert)\n', ['Example']));
});
