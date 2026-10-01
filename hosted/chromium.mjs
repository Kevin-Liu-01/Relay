export function createBrowserLaunchOptions(chromium) {
  // A warm function may admit two cold starts concurrently. Sparticuz inflates
  // into a shared /tmp path and its exists check can see a half-written file.
  // Share only the initialization promise, never browser/session state. Retain
  // rejection too: a partially extracted worker needs recycling, not a retry.
  let executable;
  return async () => {
    executable ??= Promise.resolve().then(() => chromium.executablePath());
    return { args: [...chromium.args], executablePath: await executable, headless: true };
  };
}
