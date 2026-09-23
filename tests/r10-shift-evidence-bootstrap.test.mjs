import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const bootstrap=fs.readFileSync(new URL('../src/app/ref01-bootstrap.js',import.meta.url),'utf8');
const ui=fs.readFileSync(new URL('../src/ui/shift-evidence-v1.js',import.meta.url),'utf8');
const domain=fs.readFileSync(new URL('../src/domain/shift-stock-evidence-v1.js',import.meta.url),'utf8');

test('shift evidence installs after Cup and R8 closing wrappers so augmentation remains additive',()=>{
  const p5=bootstrap.indexOf('installP5PackagingV34(runtime,{inventoryWorkspace,catalogService:cupCatalog})');
  const r8=bootstrap.indexOf('installR8ShiftClosingIntegrity(runtime,{cupShiftControl:p5Packaging?.shiftControl})');
  const evidence=bootstrap.indexOf('installShiftEvidenceV1(runtime)');
  assert.ok(p5>=0 && r8>p5 && evidence>r8,'bootstrap order p5='+p5+' r8='+r8+' evidence='+evidence);
  assert.match(bootstrap,/r8ShiftClosing\?\.enhance\?\.\(\);shiftEvidence\?\.enhance\?\.\(\)/);
});

test('shift evidence adds no independent RTDB mutation authority',()=>{
  const mutation=/\.(?:set|update|transaction|remove)\s*\(/;
  assert.doesNotMatch(domain,mutation);
  assert.doesNotMatch(ui,mutation);
  assert.match(ui,/verifiedShiftWrite/);
  assert.match(domain,/authority:'SHIFT_EVIDENCE_ONLY'/);
  assert.match(domain,/stockAuthority:'GLOBAL_INVENTORY'/);
});
