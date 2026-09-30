import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from '../runner/lab-server.mjs';
import { Experiment } from '../runner/experiment.mjs';
import { DEFAULT_CONFIG, schedule } from '../runner/design.mjs';
import { RampRouter } from '../runner/router.mjs';
import { exportRun } from '../runner/export.mjs';
if (existsSync(join(ROOT, '.env'))) process.loadEnvFile(join(ROOT, '.env'));
const [command = 'plan', path, destination] = process.argv.slice(2);
if (command === 'models') console.log(JSON.stringify(await new RampRouter().models(), null, 2));
else if (command === 'export') {
  if (!destination) throw Error('Provide a new destination directory.');
  console.log(
    JSON.stringify(
      exportRun({
        runRoot: join(ROOT, '.runtime/lab-runs'),
        id: path,
        destination,
        secrets: [process.env.RAMP_ROUTER_API_KEY, process.env.CONTROL_TOKEN],
      }),
      null,
      2,
    ),
  );
} else {
  const config = path ? JSON.parse(readFileSync(path, 'utf8')) : DEFAULT_CONFIG;
  if (command === 'plan')
    console.log(JSON.stringify({ config, schedule: schedule(config) }, null, 2));
  else if (command === 'run') {
    const run = new Experiment({
      launcher: 'cli',
      config,
      root: ROOT,
      runRoot: join(ROOT, '.runtime/lab-runs'),
      environment: {
        appURL: process.env.RELAY_APP_URL ?? 'http://127.0.0.1:4318',
        controlURL: process.env.RELAY_CONTROL_URL ?? 'http://127.0.0.1:4319',
        controlToken:
          process.env.CONTROL_TOKEN ??
          readFileSync(join(ROOT, '.runtime/control-token'), 'utf8').trim(),
      },
    });
    process.on('SIGINT', () => run.cancel());
    const result = await run.run();
    console.log(
      JSON.stringify(
        {
          id: result.id,
          status: result.status,
          stopReason: result.stopReason,
          summary: result.summary,
          evidence: run.dir,
        },
        null,
        2,
      ),
    );
    if (result.status !== 'completed' || result.episodes.some((e) => e.status !== 'completed'))
      process.exitCode = 1;
  } else
    throw Error('Usage: npm run experiment -- models | plan [config.json] | run [config.json]');
}
