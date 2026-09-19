import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const read=rel=>fs.readFileSync(path.join(ROOT,rel),'utf8');
const exists=rel=>fs.existsSync(path.join(ROOT,rel));

test('R10 REF-01 release contains reconciliation modules through existing bootstrap and no invented stock writer',()=>{
  const generated=[
    'dist-ref01/src/domain/cup-reconciliation-v1.js',
    'dist-ref01/src/ui/cup-reconciliation-v1.js',
    'dist-ref01/src/ui/inventory-workspace-v32.js',
    'dist-ref01/src/app/ref01-bootstrap.js',
    'dist-ref01/src/ref01-entry.js'
  ];

  for(const rel of generated){
    assert.equal(exists(rel),true,`generated R10 dependency missing: ${rel}`);
  }

  const index=read('dist-ref01/index.html');
  assert.equal(
    (index.match(/data-sj-ref01-entry="true"/g)||[]).length,
    1,
    'REF-01 must keep exactly one module entry'
  );
  assert.match(index,/src\/ref01-entry\.js/);

  const bootstrap=read('dist-ref01/src/app/ref01-bootstrap.js');
  assert.match(
    bootstrap,
    /import\s*\{\s*installInventoryWorkspaceV32\s*\}\s*from\s*['"]\.\.\/ui\/inventory-workspace-v32\.js['"]/
  );
  assert.match(bootstrap,/installInventoryWorkspaceV32\(runtime\)/);

  const workspace=read('dist-ref01/src/ui/inventory-workspace-v32.js');
  assert.match(
    workspace,
    /import\s*\{\s*buildCupReconOpnameDraft,\s*buildCupReconciliationGroups\s*\}\s*from\s*['"]\.\.\/domain\/cup-reconciliation-v1\.js['"]/
  );
  assert.match(
    workspace,
    /import\s*\{\s*renderCupReconciliationV1\s*\}\s*from\s*['"]\.\/cup-reconciliation-v1\.js['"]/
  );
  assert.match(workspace,/data-r10-opname-ref/);
  assert.match(workspace,/loadReconciliationDate/);

  const domain=read('dist-ref01/src/domain/cup-reconciliation-v1.js');
  const renderer=read('dist-ref01/src/ui/cup-reconciliation-v1.js');

  for(const [name,source] of [
    ['domain',domain],
    ['renderer',renderer]
  ]){
    for(const token of [
      '.set(',
      '.update(',
      '.transaction(',
      '.remove(',
      'firebase.initializeApp',
      'database.ref'
    ]){
      assert.equal(
        source.includes(token),
        false,
        `${name} contains forbidden persistence token ${token}`
      );
    }
  }

  assert.match(domain,/buildCupReconOpnameDraft/);
  assert.match(domain,/findCupReconOpname/);
});
