import { createHash } from 'node:crypto';
// Lossless transport encoding for public review. The original request files and
// their hashes remain unchanged in the experiment archive.
export function compactImageInputs(inputs) {
  const images = {};
  const compact = JSON.parse(
    JSON.stringify(inputs, (key, value) => {
      if (
        key !== 'image_url' ||
        typeof value !== 'string' ||
        !value.startsWith('data:image/png;base64,')
      )
        return value;
      const hash = createHash('sha256').update(value).digest('hex');
      images[hash] = value;
      return { relayImageRef: hash };
    }),
  );
  return { inputs: compact, images };
}
export function expandImageInputs(inputs, images) {
  return JSON.parse(
    JSON.stringify(inputs, (key, value) => {
      if (key !== 'image_url' || !value?.relayImageRef) return value;
      const image = images[value.relayImageRef];
      if (
        typeof image !== 'string' ||
        createHash('sha256').update(image).digest('hex') !== value.relayImageRef
      )
        throw Error('Image input hash mismatch.');
      return image;
    }),
  );
}
