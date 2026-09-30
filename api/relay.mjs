import chromium from '@sparticuz/chromium';
import { createHostedHandler } from '../hosted/service.mjs';

export default createHostedHandler({
  launchOptions: async () => ({
    args: chromium.args,
    executablePath: await chromium.executablePath(),
    headless: true,
  }),
});
