// User-controlled connection storage. Never import this into evidence/export code.
export const CREDENTIALS_KEY = 'relay-credentials-v1';
const providers = ['ramp', 'typesafe'];
const empty = () => ({
  version: 1,
  provider: 'ramp',
  remember: true,
  keys: { ramp: '', typesafe: '' },
});
const validKey = (key) =>
  typeof key === 'string' && key.length >= 8 && key.length <= 512 && !/\s/.test(key);
const browserStorage = () => window.localStorage;

export function readCredentials(storage) {
  const result = empty();
  try {
    const value = JSON.parse((storage ?? browserStorage()).getItem(CREDENTIALS_KEY));
    if (value?.version !== 1) return result;
    result.remember = value.remember !== false;
    if (result.remember)
      for (const provider of providers)
        if (validKey(value.keys?.[provider])) result.keys[provider] = value.keys[provider];
    result.provider = providers.includes(value.provider) ? value.provider : 'ramp';
    if (!result.keys[result.provider])
      result.provider = providers.find((p) => result.keys[p]) ?? result.provider;
  } catch {
    // Corrupt/blocked storage must not prevent an in-memory connection.
  }
  return result;
}

export function saveCredential(provider, key, remember = true, storage) {
  if (!providers.includes(provider) || !validKey(key)) throw Error('Invalid provider credential.');
  const target = storage ?? browserStorage();
  const value = readCredentials(target);
  value.remember = remember;
  value.provider = provider;
  value.keys = remember ? { ...value.keys, [provider]: key } : empty().keys;
  target.setItem(CREDENTIALS_KEY, JSON.stringify(value));
}

export function setRememberCredentials(remember, storage) {
  const target = storage ?? browserStorage();
  const value = readCredentials(target);
  value.remember = remember;
  if (!remember) value.keys = empty().keys;
  target.setItem(CREDENTIALS_KEY, JSON.stringify(value));
}

export function forgetCredential(provider, storage) {
  if (!providers.includes(provider)) throw Error('Invalid provider.');
  const target = storage ?? browserStorage();
  const value = readCredentials(target);
  value.keys[provider] = '';
  if (!Object.values(value.keys).some(Boolean) && value.remember)
    target.removeItem(CREDENTIALS_KEY);
  else {
    value.provider = providers.find((p) => value.keys[p]);
    target.setItem(CREDENTIALS_KEY, JSON.stringify(value));
  }
}
