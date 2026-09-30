import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
test('committed mutation survives a fresh OS process; token remains scoped', () => {
  const root = mkdtempSync(join(tmpdir(), 'relay-restart-'));
  const run = (source) => {
    const p = spawnSync(process.execPath, ['--input-type=module', '-e', source], {
      encoding: 'utf8',
    });
    assert.equal(p.status, 0, p.stderr);
    return JSON.parse(p.stdout);
  };
  const setup = run(
    `import{Store}from'./server/store.mjs';const s=new Store(${JSON.stringify(root)});const a=s.create({taskId:'edit-message'}),b=s.create();s.action(a.token,{revision:0,requestId:'restart-0001',action:{type:'message.edit',id:'launch-old',text:'Launch review is at 15:00 UTC. Please bring the final checklist.'}});console.log(JSON.stringify({a:a.token,b:b.token}));`,
  );
  const result = run(
    `import{Store}from'./server/store.mjs';const s=new Store(${JSON.stringify(root)});console.log(JSON.stringify({success:s.evaluate(${JSON.stringify(setup.a)}).success,other:s.read(${JSON.stringify(setup.b)}).revision}));s.close(${JSON.stringify(setup.a)});s.close(${JSON.stringify(setup.b)});`,
  );
  assert.equal(result.success, true);
  assert.equal(result.other, 0);
});
