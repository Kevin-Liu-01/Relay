import assert from 'node:assert/strict';

const escape = (text) =>
  text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

// The notes file is the single authoring source. Only this small Markdown subset
// is rendered, with escaped text and HTTP(S)-only links. No raw HTML is accepted.
function inline(text) {
  return escape(text)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, href) => {
      const url = new URL(
        href.replaceAll('&amp;', '&'),
        'https://github.com/Kevin-Liu-01/Relay/blob/main/docs/presentation-notes.md',
      );
      assert.ok(['https:', 'http:'].includes(url.protocol), 'Safe speaker-note link');
      return `<a href="${escape(url.href)}" target="_blank" rel="noopener noreferrer">${label}</a>`;
    })
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>');
}

export function presenterNotes(source, titles) {
  const sections = [...source.matchAll(/^## (\d+)\. ([^\n]+)\n([\s\S]*?)(?=^## |$(?![\s\S]))/gm)];
  assert.equal(sections.length, titles.length, 'Each slide needs its existing speaker notes');
  return sections
    .map(([, number, title, body], i) => {
      assert.equal(Number(number), i + 1);
      assert.equal(title.trim(), titles[i]);
      const blocks = body
        .trim()
        .split(/\n\s*\n/)
        .map((block) => {
          const list = /^(?:- |\d+\. )/.test(block);
          if (!list) return `<p>${inline(block.replace(/\n/g, ' '))}</p>`;
          const ordered = /^\d+\./.test(block);
          const items = block
            .split(/\n(?=(?:- |\d+\. ))/)
            .map(
              (line) =>
                `<li>${inline(line.replace(/^(?:- |\d+\. )/, '').replace(/\n\s*/g, ' '))}</li>`,
            );
          return `<${ordered ? 'ol' : 'ul'}>${items.join('')}</${ordered ? 'ol' : 'ul'}>`;
        });
      return `<template data-presenter-notes="${i}">${blocks.join('')}</template>`;
    })
    .join('\n');
}
