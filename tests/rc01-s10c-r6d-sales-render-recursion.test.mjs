import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import vm from 'node:vm';

const COMPAT='src/compat/rc01-sales-render-recursion-hardening.js';
const source=()=>readFileSync(COMPAT,'utf8');

function cycleRuntime({mobile=false}={}){
  const calls=[];
  let depth=0;
  const commercial={
    baseRenderMenu(){calls.push('safe-base');return 'desktop-safe'}
  };
  const uat={};
  const sales={
    mobile(){return mobile},
    _baseRenderMenu:null,
    renderSales(){
      depth++;
      if(depth>12)throw new Error('SIMULATED_TOO_MUCH_RECURSION');
      try{
        if(!this.mobile())return this._baseRenderMenu?this._baseRenderMenu():false;
        calls.push('mobile-render');
        return 'mobile';
      }finally{depth--}
    }
  };
  // Mirrors the frozen legacy alias cycle:
  // UAT renderMenu -> UAT.renderSales, then UI03A rebinds UAT.renderSales -> UI03A.renderSales.
  sales._baseRenderMenu=()=>uat.renderSales();
  uat.renderSales=()=>sales.renderSales();
  const context={console,SJRefinementSalesV100:sales,SJCommercialUIV5953:commercial,SJCommercialUATV5962:uat};
  context.window=context;context.globalThis=context;
  return {context,calls,sales,commercial};
}

function install(rt){vm.runInNewContext(source(),rt.context,{filename:COMPAT});return rt.context.SJRC01S10CR6DSalesRenderHardening}

test('R6D RED: dedicated sales recursion hardener exists',()=>{
  assert.equal(existsSync(COMPAT),true,'R6D sales recursion compat is missing');
  const src=source();
  assert.match(src,/SJRC01S10CR6DSalesRenderHardening/);
  assert.match(src,/_baseRenderMenu/);
});

test('R6D RED: frozen non-mobile alias cycle reproduces recursion before hardening',()=>{
  const rt=cycleRuntime({mobile:false});
  assert.throws(()=>rt.sales.renderSales(),/SIMULATED_TOO_MUCH_RECURSION/);
});

test('R6D RED: hardening redirects non-mobile fallback to the stable commercial base renderer',()=>{
  const rt=cycleRuntime({mobile:false});install(rt);
  assert.equal(rt.sales.renderSales(),'desktop-safe');
  assert.deepEqual(rt.calls,['safe-base']);
});

test('R6D RED: hardening preserves the mobile sales renderer path',()=>{
  const rt=cycleRuntime({mobile:true});install(rt);
  assert.equal(rt.sales.renderSales(),'mobile');
  assert.deepEqual(rt.calls,['mobile-render']);
});

test('R6D RED: hardening is idempotent and does not stack fallback wrappers',()=>{
  const rt=cycleRuntime({mobile:false});
  const first=install(rt),patched=rt.sales._baseRenderMenu;
  const second=install(rt);
  assert.equal(second,first);
  assert.equal(rt.sales._baseRenderMenu,patched);
  assert.equal(rt.sales.renderSales(),'desktop-safe');
  assert.deepEqual(rt.calls,['safe-base']);
});

test('R6D RED: missing stable base renderer fails closed instead of inventing a writer or renderer',()=>{
  const rt=cycleRuntime({mobile:false});delete rt.context.SJCommercialUIV5953.baseRenderMenu;
  const api=install(rt);
  assert.equal(api.installed,false);
  assert.match(api.reason,/BASE_RENDERER_UNAVAILABLE/);
});
