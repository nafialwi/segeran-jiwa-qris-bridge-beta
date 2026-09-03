import test from 'node:test';
import assert from 'node:assert/strict';
import { createLegacyCommandRegistry } from '../src/core/legacy-command-registry.js';
import { installSc04Runtime } from '../src/app/sc04-bootstrap.js';

function eventRuntime(){
  const listeners=new Map();
  const legacyCalls=[];
  const runtime={
    navigator:{onLine:false},
    addEventListener(type,fn){const list=listeners.get(type)||[];list.push(fn);listeners.set(type,list)},
    removeEventListener(type,fn){listeners.set(type,(listeners.get(type)||[]).filter(x=>x!==fn))},
    dispatch(type){for(const fn of [...(listeners.get(type)||[])])fn({type})},
    listenerCount(type){return (listeners.get(type)||[]).length},
    SJSecureRulesCompat:{version:'59.4.3.6',install(){}},
    SJProductionArchitectureP3:{
      authMode:()=> 'SECURE',
      async login(...args){legacyCalls.push(['login',...args]);return 'LOGIN'},
      async completeLogin(...args){legacyCalls.push(['completeLogin',...args]);return 'COMPLETE'},
      async logout(...args){legacyCalls.push(['logout',...args]);return 'LOGOUT'}
    }
  };
  return {runtime,legacyCalls,sc03:{commands:createLegacyCommandRegistry(runtime)}};
}

function reconnectManager({deferSecond=false}={}){
  const calls=[];
  let restoreCount=0,releaseSecond=null;
  return {
    calls,
    async prepareAuth(){calls.push(['prepareAuth']);return true},
    async restore(){
      restoreCount++;calls.push(['restore',restoreCount]);
      if(restoreCount===1)return {restored:false,reason:'OFFLINE_REVALIDATION_REQUIRED'};
      if(deferSecond&&restoreCount===2)return new Promise(resolve=>{releaseSecond=()=>resolve({restored:true,reason:'RESTORED'})});
      return {restored:true,reason:'RESTORED'};
    },
    async saveAfterLogin(value){calls.push(['saveAfterLogin',value]);return value},
    async invalidate(reason,options){calls.push(['invalidate',reason,options]);return {restored:false,reason}},
    snapshot(){return {restoreCount}},
    releaseSecond(){releaseSecond?.()},
    restoreCount(){return restoreCount}
  };
}

async function settle(){await new Promise(resolve=>setTimeout(resolve,0));await new Promise(resolve=>setTimeout(resolve,0))}

test('RC01 reconnect retries preserved session validation when browser returns online',async()=>{
  const {runtime,sc03}=eventRuntime(),manager=reconnectManager();
  const api=installSc04Runtime(runtime,{sc03,manager});
  const first=await api.ready;
  assert.equal(first.reason,'OFFLINE_REVALIDATION_REQUIRED');
  assert.equal(runtime.listenerCount('online'),1);
  runtime.navigator.onLine=true;
  runtime.dispatch('online');
  await settle();
  assert.equal(manager.restoreCount(),2);
  assert.equal(runtime.listenerCount('online'),0,'successful reconnect must disarm retry listener');
});

test('RC01 reconnect guard prevents overlapping restore attempts from repeated online events',async()=>{
  const {runtime,sc03}=eventRuntime(),manager=reconnectManager({deferSecond:true});
  const api=installSc04Runtime(runtime,{sc03,manager});
  await api.ready;
  runtime.navigator.onLine=true;
  runtime.dispatch('online');
  runtime.dispatch('online');
  runtime.dispatch('online');
  await settle();
  assert.equal(manager.restoreCount(),2,'only one reconnect restore may be in flight');
  manager.releaseSecond();
  await settle();
  assert.equal(runtime.listenerCount('online'),0);
});
