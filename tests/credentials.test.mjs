import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CREDENTIALS_KEY,
  readCredentials,
  saveCredential,
  setRememberCredentials,
  forgetCredential,
} from '../src/live/credentials.js';

function memoryStorage() {
  const entries = new Map();
  return {
    getItem: (key) => entries.get(key) ?? null,
    setItem: (key, value) => entries.set(key, value),
    removeItem: (key) => entries.delete(key),
  };
}

test('credential storage keeps one validated key per allowed provider and last connection', () => {
  const storage = memoryStorage();
  saveCredential('ramp', 'fake-ramp-key', true, storage);
  saveCredential('typesafe', 'fake-typesafe-key', true, storage);
  assert.deepEqual(readCredentials(storage), {
    version: 1,
    provider: 'typesafe',
    remember: true,
    keys: { ramp: 'fake-ramp-key', typesafe: 'fake-typesafe-key' },
  });
  assert.throws(() => saveCredential('attacker', 'fake-private-key', true, storage));
  for (const key of ['', 'short', 'key with spaces', 'x'.repeat(513)])
    assert.throws(() => saveCredential('ramp', key, true, storage));
});

test('replacing and forgetting a provider never removes its sibling', () => {
  const storage = memoryStorage();
  saveCredential('ramp', 'fake-old-ramp', true, storage);
  saveCredential('typesafe', 'fake-typesafe', true, storage);
  saveCredential('ramp', 'fake-new-ramp', true, storage);
  assert.ok(!storage.getItem(CREDENTIALS_KEY).includes('fake-old-ramp'));
  forgetCredential('ramp', storage);
  assert.deepEqual(readCredentials(storage).keys, { ramp: '', typesafe: 'fake-typesafe' });
  assert.equal(readCredentials(storage).provider, 'typesafe');
  forgetCredential('typesafe', storage);
  assert.equal(storage.getItem(CREDENTIALS_KEY), null);
});

test('opting out clears every saved key and keeps the preference across forgetting', () => {
  const storage = memoryStorage();
  saveCredential('ramp', 'fake-ramp-key', true, storage);
  saveCredential('typesafe', 'fake-typesafe-key', true, storage);
  setRememberCredentials(false, storage);
  saveCredential('ramp', 'fake-memory-only', false, storage);
  forgetCredential('ramp', storage);
  assert.equal(readCredentials(storage).remember, false);
  assert.deepEqual(readCredentials(storage).keys, { ramp: '', typesafe: '' });
  assert.ok(!storage.getItem(CREDENTIALS_KEY).includes('fake-'));
});

test('corrupt or unsupported saved data cannot populate arbitrary connection fields', () => {
  const storage = memoryStorage();
  for (const raw of ['{', 'null', '[]', '{"version":2,"keys":{"ramp":"fake-secret"}}']) {
    storage.setItem(CREDENTIALS_KEY, raw);
    assert.deepEqual(readCredentials(storage).keys, { ramp: '', typesafe: '' });
  }
  storage.setItem(
    CREDENTIALS_KEY,
    JSON.stringify({
      version: 1,
      provider: 'attacker',
      endpoint: 'https://attacker.invalid',
      keys: { ramp: 'bad key', typesafe: 'fake-valid-key', attacker: 'fake-private-key' },
    }),
  );
  assert.deepEqual(readCredentials(storage), {
    version: 1,
    provider: 'typesafe',
    remember: true,
    keys: { ramp: '', typesafe: 'fake-valid-key' },
  });
});

test('blocked storage reads fall back safely while failed writes and deletions stay observable', () => {
  const blocked = Object.fromEntries(
    ['getItem', 'setItem', 'removeItem'].map((name) => [
      name,
      () => {
        throw Error('Storage blocked');
      },
    ]),
  );
  assert.deepEqual(readCredentials(blocked).keys, { ramp: '', typesafe: '' });
  assert.throws(() => saveCredential('ramp', 'fake-ramp-key', true, blocked));
  assert.throws(() => forgetCredential('ramp', blocked));
  assert.throws(() => setRememberCredentials(false, blocked));
});

test('saving rereads current storage instead of resurrecting a forgotten sibling from a snapshot', () => {
  const storage = memoryStorage();
  saveCredential('ramp', 'fake-ramp-key', true, storage);
  const old = readCredentials(storage);
  forgetCredential('ramp', storage);
  saveCredential('typesafe', 'fake-typesafe-key', true, storage);
  assert.equal(old.keys.ramp, 'fake-ramp-key');
  assert.equal(readCredentials(storage).keys.ramp, '');
});
