import test from 'node:test';
import assert from 'node:assert/strict';
import { SETTINGS_CHILDREN } from '../src/app/route-contract.js';
import { createFeature as createDevices } from '../src/modules/settings/devices.js';
import { createFeature as createPrinter } from '../src/modules/settings/printer.js';
import { createRoleGuard } from '../src/core/role-guard.js';
import { readFileSync } from 'node:fs';

test('REF_01 Perangkat Aktif uses a dedicated owner-safe legacy surface while Printer keeps frozen menu id 6',()=>{
  const calls=[];
  const router={
    openSettingsSurface(id,key){calls.push(['surface',id,key]);return id},
    openSettings(id){calls.push(['menu',id]);return id}
  };
  const devices=createDevices({router});
  const printer=createPrinter({router});
  assert.equal(devices.open(),13,'Perangkat Aktif must open the existing device-session surface, not printer');
  assert.equal(printer.open(),6,'Printer must keep the existing printer surface');
  assert.deepEqual(calls,[['surface',13,'devices'],['menu',6]]);
  assert.equal(SETTINGS_CHILDREN[13],undefined,'SC-03 frozen Settings menu contract must not be expanded');
  assert.equal(SETTINGS_CHILDREN[6]?.key,'printer-device');
});

test('REF_01 dedicated Perangkat Aktif surface is guarded by router owner authority rather than a new menu id',()=>{
  const src=readFileSync('src/app/router.js','utf8');
  assert.match(src,/function openSettingsSurface\(id,key='legacy-settings-surface'\)/);
  assert.match(src,/if\(!guard\.isOwner\(\)\) return guard\.deny\(\)/);
  assert.match(src,/commands\.invoke\('openMst',n\)/);
});

test('REF_03 stock remains reachable from both role dashboards without adding a seventh Owner Operational card',()=>{
  const html=readFileSync('baseline/legacy-v1.0.40.html','utf8');
  const ownerStart=html.lastIndexOf('ownerHTML(m){const t=this.trendMeta');
  const cashierStart=html.lastIndexOf('cashierHTML(m){const active=');
  assert.ok(ownerStart>0&&cashierStart>ownerStart,'final VC01 dashboard renderers must exist');
  const owner=html.slice(ownerStart,cashierStart);
  const cashier=html.slice(cashierStart,html.indexOf('renderDashboard',cashierStart));
  assert.match(owner,/showView\(2\);openOpr\(3\)[\s\S]*?<span>Stok<\/span>/);
  assert.match(cashier,/showView\(2\);openOpr\(3\)[\s\S]*?<span>Stok<\/span>/);
});
