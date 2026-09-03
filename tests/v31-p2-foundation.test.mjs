import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

const ROOT=path.resolve(new URL('..',import.meta.url).pathname);
const bootstrapUrl=pathToFileURL(path.join(ROOT,'src/app/ref01-bootstrap.js')).href;

function grid(cls='sjvc01-grid'){return {className:cls,style:{},dataset:{}}}

test('P2 package baseline is retained at v3.1.0 or newer',()=>{
  const [major,minor]=JSON.parse(fs.readFileSync(path.join(ROOT,'package.json'),'utf8')).version.split('.').map(Number);
  assert.ok(major>3||(major===3&&minor>=1),'candidate must not regress below P2 v3.1');
});

test('P2 sequential local layout authority supports 4 -> 2 without stale state',async()=>{
  const mod=await import(`${bootstrapUrl}?p2seq=${Date.now()}`);
  const root={dataset:{}};
  const activeGrid=grid();
  const document={documentElement:root,querySelectorAll(){return [activeGrid]}};
  const selected={
    roleLayouts:{
      manajemen:{productColumns:4,operationColumns:2,reportColumns:2,compactCards:false},
      transaksi:{productColumns:3,operationColumns:2,reportColumns:2,compactCards:true}
    },managementColumns:2,productMasterColumns:2,longPressEdit:true
  };
  const runtime={
    __SJ_LOCAL_QA_READ_ONLY:true,
    SJMobileProfessionalP1:{effective(){return {productColumns:3,operationColumns:2,reportColumns:2,managementColumns:2,productMasterColumns:2,compactCards:false}}},
    SJMobileUX:{collectSettings(){return structuredClone(selected)},async saveSettings(){return {ok:true}}}
  };
  const ctl=mod.installLocalQaLayoutAuthority(runtime,{role:()=> 'owner'});
  await runtime.SJMobileUX.saveSettings();
  let applied=mod.reconcileLayoutPreferences(document,runtime,{role:'owner'});
  mod.applySalesGridLayout(document,applied.productColumns);
  assert.equal(root.dataset.sjProductCols,'4');
  assert.equal(activeGrid.dataset.sjEffectiveProductCols,'4');

  selected.roleLayouts.manajemen.productColumns=2;
  await runtime.SJMobileUX.saveSettings();
  applied=mod.reconcileLayoutPreferences(document,runtime,{role:'owner'});
  mod.applySalesGridLayout(document,applied.productColumns);
  assert.equal(root.dataset.sjProductCols,'2');
  assert.equal(activeGrid.style.gridTemplateColumns,'repeat(2,minmax(0,1fr))');
  assert.equal(activeGrid.dataset.sjEffectiveProductCols,'2');
  ctl.stop();
});

test('P2 exposes one canonical visual grammar marker and token family',async()=>{
  const mod=await import(`${bootstrapUrl}?p2grammar=${Date.now()}`);
  assert.equal(typeof mod.applyV31SurfaceGrammar,'function');
  const html={dataset:{}};
  const body={dataset:{},classList:{add(){}}};
  const document={documentElement:html,body,querySelectorAll(){return []}};
  const result=mod.applyV31SurfaceGrammar(document);
  assert.equal(html.dataset.sjV31,'true');
  assert.equal(result.applied,true);
  const css=fs.readFileSync(path.join(ROOT,'src/ui/ref01.css'),'utf8');
  for(const token of ['--sj-v31-bg','--sj-v31-surface','--sj-v31-green','--sj-v31-radius-card','--sj-v31-touch'])assert.match(css,new RegExp(token));
});

test('P2 Settings uses locked B01-B05 icon rendering instead of local filled icon family',()=>{
  const settings=fs.readFileSync(path.join(ROOT,'src/ui/settings-refinement.js'),'utf8');
  assert.doesNotMatch(settings,/renderFilledIcon/);
  assert.match(settings,/renderIcon\(item\.icon/);
  const icons=fs.readFileSync(path.join(ROOT,'src/ui/locked-icon-registry.js'),'utf8');
  for(const semantic of ['shopping-bag','category-grid','id-card','users-access','devices','palette','storefront','shield-lock','stethoscope','cloud-upload','shield-alert','crown','check-circle']){
    assert.match(icons,new RegExp(`"${semantic}"\\s*:`),`missing locked alias for ${semantic}`);
  }
});

test('P2 visual grammar does not increase legacy important budget',()=>{
  const css=fs.readFileSync(path.join(ROOT,'src/ui/ref01.css'),'utf8');
  const count=(css.match(/!important/g)||[]).length;
  assert.ok(count<=252,`important budget grew to ${count}`);
});
