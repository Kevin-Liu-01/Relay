import { createHash } from 'node:crypto';

export const socialOrigin = 'https://relay.kevinliu.studio';
export const socialAlt =
  'Relay: test computer use agents. An illustrated Northstar workspace shows a topic edit and its expected result.';
const description =
  'Test computer use agents in a Slack-like workspace. Watch live actions, compare results, and inspect recorded replays.';
export const socialPages = [
  { file: 'index.html', path: '/', title: 'Relay | Test computer use agents', description },
  { file: 'live.html', path: '/', title: 'Relay | Test computer use agents', description },
  {
    file: 'play.html',
    path: '/play',
    title: 'Try the Slack workspace | Relay',
    description:
      'Explore Relay’s fictional Slack workspace yourself. Search, edit messages, and use threads without a model or API key.',
  },
  {
    file: 'presentation.html',
    path: '/presentation',
    title: 'Design and findings | Relay',
    description:
      'How Relay works: the Slack environment, agent harness, session isolation, evaluation methods, and recorded comparison results.',
  },
  {
    file: 'results.html',
    path: '/results',
    title: 'Results and replays | Relay',
    description:
      'Inspect Relay’s recorded model comparisons. View task outcomes, timing, usage estimates, and replay evidence.',
  },
  {
    file: 'demo/review.html',
    path: '/demo/review.html',
    title: 'Review agent traces | Relay',
    description:
      'Review the actions, captured states, and outcome checks from Relay’s recorded agent trials.',
  },
  {
    file: 'replay.html',
    path: '/replay.html',
    title: 'Replay recorded actions | Relay',
    description:
      'Play back recorded agent actions in Relay’s Slack-like workspace. Inspect the captured state and expected task result.',
  },
];
export function socialImagePath(bytes) {
  return `/assets/relay-social-${createHash('sha256').update(bytes).digest('hex').slice(0, 16)}.png`;
}
const escape = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      })[c],
  );

// Static tags are available to unfurlers without executing the application.
// Fixed page URLs never incorporate browser history, keys, or query parameters.
export function withSocialMetadata(html, page, imagePath) {
  if (!/<\/head>/i.test(html)) throw Error('Social metadata requires a document head.');
  const image = new URL(imagePath, socialOrigin).href;
  if (!/^https:\/\/relay\.kevinliu\.studio\/assets\/relay-social-[a-f0-9]{16}\.png$/.test(image))
    throw Error('Unexpected social-card asset URL.');
  const tags = [
    ['property', 'og:type', 'website'],
    ['property', 'og:site_name', 'Relay'],
    ['property', 'og:title', page.title],
    ['property', 'og:description', page.description],
    ['property', 'og:url', new URL(page.path, socialOrigin).href],
    ['property', 'og:image', image],
    ['property', 'og:image:type', 'image/png'],
    ['property', 'og:image:width', '1200'],
    ['property', 'og:image:height', '630'],
    ['property', 'og:image:alt', socialAlt],
    ['name', 'twitter:card', 'summary_large_image'],
    ['name', 'twitter:title', page.title],
    ['name', 'twitter:description', page.description],
    ['name', 'twitter:image', image],
    ['name', 'twitter:image:alt', socialAlt],
  ]
    .map(([attribute, key, value]) => `<meta ${attribute}="${key}" content="${escape(value)}">`)
    .join('\n');
  // Replace earlier social tags on a repeated staging pass, without touching app metadata.
  return html
    .replace(/<meta\b(?=[^>]*(?:property|name)\s*=\s*["'](?:og:|twitter:))[^>]*>\s*/gi, '')
    .replace(/<\/head>/i, `${tags}\n</head>`);
}
