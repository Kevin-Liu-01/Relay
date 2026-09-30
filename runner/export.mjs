import { existsSync, readdirSync, readFileSync, cpSync } from 'node:fs';
import { join, resolve } from 'node:path';

export function assertSafeEvidence(text, secrets = []) {
  if (
    /\/s\/[a-f0-9]{64}|"token"\s*:\s*"[a-f0-9]{64}"|Bearer\s+\S{16,}|sk-routgw-[A-Za-z0-9]+/.test(
      text,
    ) ||
    secrets.filter((s) => s?.length >= 8).some((s) => text.includes(s))
  )
    throw Error('Credential-shaped content found; export blocked.');
}

export function exportRun({ runRoot, id, destination, secrets = [] }) {
  if (!/^[a-f0-9-]{36}$/.test(id)) throw Error('Expected a run UUID.');
  const source = join(runRoot, id),
    target = resolve(destination);
  if (!existsSync(join(source, 'run.json'))) throw Error('Unknown run.');
  if (existsSync(target)) throw Error('Destination exists; refusing to overwrite evidence.');
  const run = JSON.parse(readFileSync(join(source, 'run.json'), 'utf8'));
  if (['running', 'queued'].includes(run.status))
    throw Error('Finish or stop the run before exporting.');
  const files = [];
  function scan(path) {
    for (const f of readdirSync(path, { withFileTypes: true })) {
      const p = join(path, f.name);
      if (f.isSymbolicLink()) throw Error('Symbolic links are not portable run evidence.');
      if (f.isDirectory()) scan(p);
      else {
        if (!/\.(json|jsonl|png)$/.test(f.name)) throw Error('Unexpected artifact type.');
        if (!f.name.endsWith('.png')) {
          const text = readFileSync(p, 'utf8');
          assertSafeEvidence(text, secrets);
        }
        files.push(p);
      }
    }
  }
  scan(source);
  cpSync(source, target, { recursive: true, errorOnExist: true, force: false });
  return {
    id,
    destination: target,
    files: files.length,
    evidenceKind: run.evidenceKind,
    status: run.status,
  };
}
