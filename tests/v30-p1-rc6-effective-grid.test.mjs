import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT=path.resolve(new URL('..', import.meta.url).pathname);
const bootstrapUrl=pathToFileURL(path.join(ROOT,'src/app/ref01-bootstrap.js')).href;

function grid(){return {style:{},dataset:{}}}

test('P4 applies directly to the active sjui03a grid instead of relying on CSS cascade only',async()=>{
  const mod=await import(`${bootstrapUrl}?rc6apply=${Date.now()}`);
  const a=grid(),b=grid();
  const document={querySelectorAll(sel){assert.match(sel,/\.sjvc01-grid/);assert.match(sel,/\.sjui03a-grid/);return[a,b]}};
  assert.equal(mod.applySalesGridLayout(document,4),2);
  for(const g of [a,b]){
    assert.equal(g.style.gridTemplateColumns,'repeat(4,minmax(0,1fr))');
    assert.equal(g.style.gap,'5px');
    assert.equal(g.dataset.sjEffectiveProductCols,'4');
  }
});

test('sales renderer authority reapplies P4 after the renderer replaces its grids',async()=>{
  const mod=await import(`${bootstrapUrl}?rc6render=${Date.now()}`);
  let current=[];
  const document={documentElement:{dataset:{sjProductCols:'4'}},querySelectorAll(){return current}};
  const runtime={document,SJRefinementSalesV100:{renderSales(){current=[grid(),grid()];return true}}};
  const ctl=mod.installSalesGridPresentationAuthority(runtime,{document,getColumns:()=>4});
  assert.equal(ctl.installed,true);
  runtime.SJRefinementSalesV100.renderSales();
  assert.equal(current.length,2);
  assert.equal(current[0].style.gridTemplateColumns,'repeat(4,minmax(0,1fr))');
  assert.equal(current[1].dataset.sjEffectiveProductCols,'4');
  ctl.stop();
});
