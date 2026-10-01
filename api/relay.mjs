import chromium from '@sparticuz/chromium';
import { createHostedHandler } from '../hosted/service.mjs';
import { createBrowserLaunchOptions } from '../hosted/chromium.mjs';

export default createHostedHandler({
  launchOptions: createBrowserLaunchOptions(chromium),
});
