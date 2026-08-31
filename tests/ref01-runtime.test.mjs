import test from 'node:test';
import assert from 'node:assert/strict';
import { installRef01Runtime } from '../src/app/ref01-bootstrap.js';

function fakeDocument(){
  const nodes=new Map();
  const head={appendChild(node){nodes.set(node.dataset?.sjRef01Style?'style:'+node.dataset.sjRef01Style:node.id||String(nodes.size),node)}};
  return {
    head,
    documentElement:{dataset:{}},
    createElement(tag){return {tagName:tag.toUpperCase(),dataset:{},set rel(v){this._rel=v},set href(v){this._href=v}}},
    querySelector(sel){if(sel==='link[data-sj-ref01-style="true"]') return nodes.get('style:true')||null;return null},
    getElementById(){return null},
    addEventListener(){},
    nodes
  };
}

test('REF-01 runtime installs once, retains SC-04 authority and exposes one convergence registry',()=>{
  const document=fakeDocument();
  const sc03={features:{get:()=>null},state:{snapshot:()=>({primary:'home'})}};
  const sc04={phase:'SC-04',session:{snapshot:()=>({})}};
  const runtime={document,navigator:{onLine:true},__SJ_SC03_RUNTIME:sc03,__SJ_SC04_RUNTIME:sc04};
  const api=installRef01Runtime(runtime,{sc03,sc04,observe:false});
  assert.equal(api.phase,'REF-01');
  assert.equal(api.sc04,sc04);
  assert.equal(api.snapshot().familyCount>=8,true);
  assert.equal(runtime.__SJ_REF01_RUNTIME,api);
  assert.equal(installRef01Runtime(runtime,{sc03,sc04,observe:false}),api);
  assert.ok(document.querySelector('link[data-sj-ref01-style="true"]'));
});

test('REF-01 runtime contains one owner for UI convergence and never exposes business commit methods',()=>{
  const runtime={document:fakeDocument(),navigator:{onLine:true}};
  const api=installRef01Runtime(runtime,{sc03:{features:{get:()=>null},state:{snapshot:()=>({primary:'home'})}},sc04:{session:{snapshot:()=>({})}},observe:false});
  const snap=api.snapshot();
  assert.equal(snap.owner,'ref01-ui-runtime');
  for(const forbidden of ['commitTransaction','matchQris','writeInventory','closeShift','refund','voidTransaction']) assert.equal(typeof api[forbidden],'undefined');
});

test('REF-01 Settings appearance delegates to existing SJMobileUX writer-backed settings authority',()=>{
  let opened=0;
  const runtime={document:fakeDocument(),navigator:{onLine:true},SJMobileUX:{openSettings(){opened++}}};
  const sc03={features:{get:()=>null},state:{snapshot:()=>({primary:'settings'})},guard:{currentRole:()=> 'owner'}};
  const api=installRef01Runtime(runtime,{sc03,sc04:{session:{snapshot:()=>({})}},observe:false});
  api.openFeature('ref01.appearance');
  assert.equal(opened,1);
});

test('REF-01 Settings backup surface exposes existing backup and restore authorities instead of inventing a writer',()=>{
  const calls=[];
  const restore={click(){calls.push('restore')}};
  const document=fakeDocument();
  document.getElementById=id=>id==='restore-file'?restore:null;
  const runtime={document,navigator:{onLine:true},backupDatabase(){calls.push('backup')}};
  const sc03={features:{get:()=>null},state:{snapshot:()=>({primary:'settings'})},guard:{currentRole:()=> 'owner'}};
  const api=installRef01Runtime(runtime,{sc03,sc04:{session:{snapshot:()=>({})}},observe:false});
  const actions=api.backupActions;
  assert.equal(typeof actions?.backup,'function');
  assert.equal(typeof actions?.restore,'function');
  actions.backup();actions.restore();
  assert.deepEqual(calls,['backup','restore']);
});


test('REF-01 cashier profile and account control both open the existing secure account surface',async()=>{
  const listeners={};
  const accountButton={
    dataset:{},
    innerHTML:'?',
    setAttribute(k,v){this[k]=v}
  };
  const profile={
    dataset:{},
    setAttribute(k,v){this[k]=v},
    addEventListener(type,fn){listeners[type]=fn}
  };

  const document=fakeDocument();
  document.querySelector=sel=>{
    if(sel==='link[data-sj-ref01-style="true"]')
      return document.nodes.get('style:true')||null;
    if(sel==='button[aria-label="Akun"]')
      return accountButton;
    if(sel==='.sjui02-cashier .sjui02-profile')
      return profile;
    return null;
  };

  let opened=0;
  const runtime={
    document,
    navigator:{onLine:true},
    SJAccountV5964:{open(){opened++}}
  };

  const sc03={
    features:{get:()=>null},
    state:{snapshot:()=>({primary:'home'})},
    guard:{currentRole:()=> 'cashier'}
  };

  const api=installRef01Runtime(runtime,{
    sc03,
    sc04:{session:{snapshot:()=>({})}},
    observe:false
  });

  api.enhance();

  assert.match(accountButton.innerHTML,/^<svg/);
  assert.equal(profile.role,'button');
  assert.equal(profile.tabindex,'0');
  assert.equal(profile['aria-label'],'Akun Saya');

  listeners.click({preventDefault(){}});
  assert.equal(opened,1);
});


test('REF-01 cashier account access binds the final VC01 dashboard profile actually rendered in production',()=>{
  const listeners={};
  const profile={
    dataset:{},
    setAttribute(k,v){this[k]=v},
    addEventListener(type,fn){listeners[type]=fn}
  };

  const document=fakeDocument();

  document.querySelector=sel=>{
    if(sel==='link[data-sj-ref01-style="true"]')
      return document.nodes.get('style:true')||null;

    if(sel==='.sjvc01-cashier .sjvc01-profile')
      return profile;

    return null;
  };

  let opened=0;

  const runtime={
    document,
    navigator:{onLine:true},
    SJAccountV5964:{
      open(){opened++}
    }
  };

  const sc03={
    features:{get:()=>null},
    state:{snapshot:()=>({primary:'home'})},
    guard:{currentRole:()=> 'cashier'}
  };

  const api=installRef01Runtime(runtime,{
    sc03,
    sc04:{session:{snapshot:()=>({})}},
    observe:false
  });

  api.enhance();

  assert.equal(profile.role,'button');
  assert.equal(profile['aria-label'],'Akun Saya');
  assert.equal(typeof listeners.click,'function');

  listeners.click({preventDefault(){}});

  assert.equal(opened,1);
});
