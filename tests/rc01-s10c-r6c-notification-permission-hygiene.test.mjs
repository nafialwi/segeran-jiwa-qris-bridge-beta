import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import vm from 'node:vm';

const COMPAT='src/compat/rc01-notification-permission-hygiene.js';
const source=()=>readFileSync(COMPAT,'utf8');

function runtime({permission='default',active=false,requestResult='granted'}={}){
  const calls=[];
  let resolveRequest;
  const pending=requestResult==='pending'?new Promise(resolve=>{resolveRequest=resolve}):null;
  const Notification={
    permission,
    requestPermission(){calls.push('request');return pending||Promise.resolve(requestResult)}
  };
  const originalNotify=function(){calls.push('notify')};
  const SJX={
    askNotification(){calls.push('legacy-ask');return Promise.resolve('legacy')},
    openNotifications(){calls.push('open');return 'opened'},
    notify:originalNotify
  };
  const context={console,Promise,setTimeout,clearTimeout,navigator:{userActivation:{isActive:active}},Notification,SJX};
  context.window=context;context.globalThis=context;
  return {context,calls,SJX,Notification,originalNotify,resolveRequest};
}

function install(rt){vm.runInNewContext(source(),rt.context,{filename:COMPAT});return rt.context.SJRC01S10CR6CNotificationHygiene}

test('R6C RED: notification hygiene compatibility layer exists and installs before legacy bootstrap',()=>{
  assert.equal(existsSync(COMPAT),true,'R6C notification hygiene compat is missing');
  const src=source();
  assert.match(src,/SJRC01S10CR6CNotificationHygiene/);
  assert.match(src,/navigator\?\.userActivation\?\.isActive/);
});

test('R6C RED: bootstrap askNotification never requests browser permission',async()=>{
  const rt=runtime({permission:'default',active:false});install(rt);
  const result=await rt.SJX.askNotification();
  assert.equal(rt.calls.includes('request'),false,'bootstrap path must not call Notification.requestPermission');
  assert.equal(rt.calls.includes('legacy-ask'),false,'legacy askNotification must be neutralized');
  assert.equal(result,'default');
});

test('R6C RED: programmatic notification opening cannot request permission without active user gesture',()=>{
  const rt=runtime({permission:'default',active:false});install(rt);
  assert.equal(rt.SJX.openNotifications(),'opened');
  assert.deepEqual(rt.calls,['open']);
});

test('R6C RED: explicit user gesture requests permission synchronously and still opens notifications',()=>{
  const rt=runtime({permission:'default',active:true});install(rt);
  assert.equal(rt.SJX.openNotifications(),'opened');
  assert.deepEqual(rt.calls,['request','open']);
});

test('R6C RED: granted or denied permission is never re-requested and existing notify behavior is preserved',()=>{
  for(const permission of ['granted','denied']){
    const rt=runtime({permission,active:true});install(rt);
    assert.equal(rt.SJX.notify,rt.originalNotify,'R6C must not replace granted notification delivery');
    rt.SJX.openNotifications();
    assert.deepEqual(rt.calls,['open']);
  }
});

test('R6C RED: repeated clicks while a permission request is pending are single-flight',async()=>{
  const rt=runtime({permission:'default',active:true,requestResult:'pending'});const api=install(rt);
  rt.SJX.openNotifications();rt.SJX.openNotifications();
  assert.equal(rt.calls.filter(x=>x==='request').length,1,'permission prompt must be single-flight');
  assert.equal(rt.calls.filter(x=>x==='open').length,2,'notification UI remains responsive while permission is pending');
  rt.resolveRequest('granted');await Promise.resolve();await Promise.resolve();
  assert.equal(api.snapshot().requestInFlight,false);
});
