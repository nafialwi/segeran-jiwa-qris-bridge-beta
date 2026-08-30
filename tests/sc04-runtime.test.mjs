import test from 'node:test';
import assert from 'node:assert/strict';
import { createLegacyCommandRegistry } from '../src/core/legacy-command-registry.js';
import { installSc04Runtime } from '../src/app/sc04-bootstrap.js';
import { createFeature as createSecuritySyncFeature } from '../src/modules/settings/security-sync.js';

function managerStub(){
  const calls=[];
  return {
    calls,
    async prepareAuth(){calls.push(['prepareAuth']);return true},
    async restore(){calls.push(['restore']);return {restored:false,reason:'NO_SESSION'}},
    async saveAfterLogin(value){calls.push(['saveAfterLogin',value]);return value},
    async invalidate(reason,options){calls.push(['invalidate',reason,options]);return {restored:false,reason}},
    snapshot(){return {ok:true}}
  };
}

function runtimeFixture(){
  const legacyCalls=[];
  const runtime={
    SJSecureRulesCompat:{
      authMode:()=> 'SECURE',
      async login(...args){legacyCalls.push(['login',...args]);return 'LEGACY_LOGIN'},
      async completeLogin(...args){legacyCalls.push(['completeLogin',...args]);return 'LEGACY_COMPLETE'},
      async logout(...args){legacyCalls.push(['logout',...args]);return 'LEGACY_LOGOUT'}
    }
  };
  const commands=createLegacyCommandRegistry(runtime);
  return {runtime,legacyCalls,sc03:{commands}};
}

test('SC-04 runtime wraps final legacy auth methods once and startup restoration runs once',async()=>{
  const {runtime,legacyCalls,sc03}=runtimeFixture(),manager=managerStub();
  const api=installSc04Runtime(runtime,{sc03,manager});
  assert.equal(api.phase,'SC-04');
  await api.ready;
  assert.deepEqual(manager.calls,[['prepareAuth'],['restore']]);
  assert.deepEqual(legacyCalls,[]);
  const installed=sc03.commands.snapshot().installed;
  assert.equal(installed['SJSecureRulesCompat.login'],'sc04-session-manager');
  assert.equal(installed['SJSecureRulesCompat.completeLogin'],'sc04-session-manager');
  assert.equal(installed['SJSecureRulesCompat.logout'],'sc04-session-manager');
  assert.equal(installSc04Runtime(runtime,{sc03,manager}),api);
});

test('SC-04 manual login waits for persistence before delegating to captured legacy login',async()=>{
  const {runtime,legacyCalls,sc03}=runtimeFixture(),manager=managerStub();
  const api=installSc04Runtime(runtime,{sc03,manager});
  await api.ready;
  manager.calls.length=0;
  const value=await runtime.SJSecureRulesCompat.login('kasir-a','1234');
  assert.equal(value,'LEGACY_LOGIN');
  assert.deepEqual(manager.calls,[['prepareAuth']]);
  assert.deepEqual(legacyCalls,[['login','kasir-a','1234']]);
});

test('SC-04 completeLogin persists only post-success identity hints and manual logout clears envelope before legacy logout',async()=>{
  const {runtime,legacyCalls,sc03}=runtimeFixture(),manager=managerStub();
  const api=installSc04Runtime(runtime,{sc03,manager});
  await api.ready;
  manager.calls.length=0;
  const user={nama:'Kasir A',role:'transaksi'};
  const completed=await runtime.SJSecureRulesCompat.completeLogin('kasir-a','1234',user);
  assert.equal(completed,'LEGACY_COMPLETE');
  assert.deepEqual(manager.calls,[['saveAfterLogin',{username:'kasir-a',authMode:'SECURE',role:'transaksi'}]]);
  assert.equal(manager.calls[0][1].pin,undefined);
  assert.equal(manager.calls[0][1].password,undefined);
  manager.calls.length=0;legacyCalls.length=0;
  const loggedOut=await runtime.SJSecureRulesCompat.logout();
  assert.equal(loggedOut,'LEGACY_LOGOUT');
  assert.deepEqual(manager.calls,[['invalidate','MANUAL_LOGOUT',{signOut:false}]]);
  assert.deepEqual(legacyCalls,[['logout']]);
});

test('SC-04 security-sync feature activates only when Session Manager service exists',()=>{
  const deferred=createSecuritySyncFeature({router:{},services:{}});
  assert.equal(deferred.status,'deferred');
  const session={snapshot:()=>({})};
  const active=createSecuritySyncFeature({router:{},services:{session}});
  assert.equal(active.status,'active');
  assert.equal(active.authority,'sc04-session-manager');
  assert.equal(active.domain,session);
});


test('SC-04 wraps the actual v1.0.40 auth owner SJProductionArchitectureP3 when SJSecureRulesCompat only exposes install/version',async()=>{
  const legacyCalls=[];
  const runtime={
    SJSecureRulesCompat:{version:'59.4.3.6',install(){}},
    SJProductionArchitectureP3:{
      authMode:()=> 'SECURE',
      async login(...args){legacyCalls.push(['login',...args]);return 'P3_LOGIN'},
      async completeLogin(...args){legacyCalls.push(['completeLogin',...args]);return 'P3_COMPLETE'},
      async logout(...args){legacyCalls.push(['logout',...args]);return 'P3_LOGOUT'}
    }
  };

  const commands=createLegacyCommandRegistry(runtime);
  const manager=managerStub();

  const api=installSc04Runtime(runtime,{sc03:{commands},manager});
  await api.ready;

  assert.equal(
    await runtime.SJProductionArchitectureP3.login('owner','1234'),
    'P3_LOGIN'
  );

  const user={role:'manajemen'};

  assert.equal(
    await runtime.SJProductionArchitectureP3.completeLogin('owner','1234',user),
    'P3_COMPLETE'
  );

  assert.equal(
    await runtime.SJProductionArchitectureP3.logout(),
    'P3_LOGOUT'
  );

  assert.deepEqual(
    legacyCalls,
    [
      ['login','owner','1234'],
      ['completeLogin','owner','1234',user],
      ['logout']
    ]
  );

  assert.equal(
    commands.snapshot().installed['SJProductionArchitectureP3.login'],
    'sc04-session-manager'
  );

  assert.equal(
    commands.snapshot().installed['SJProductionArchitectureP3.completeLogin'],
    'sc04-session-manager'
  );

  assert.equal(
    commands.snapshot().installed['SJProductionArchitectureP3.logout'],
    'sc04-session-manager'
  );
});
