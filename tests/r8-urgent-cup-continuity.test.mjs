import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

const modulePath=path.join(process.cwd(),'src/ui/cup-shift-control-v34.js');
async function load(){return import(pathToFileURL(modulePath).href+`?t=${Date.now()}-${Math.random()}`)}

test('opening works before Firebase refresh',async()=>{
  const {renderCupOpeningPanelV34}=await load();
  const html=renderCupOpeningPanelV34([]);
  assert.equal((html.match(/data-v34-cup-opening=/g)||[]).length,6);
  assert.equal(html.includes('Sistem Gerai: 0 pcs'),false);
});

test('closing previous shift becomes opening continuity reference',async()=>{
  const {previousShiftCupClosingV34,renderCupOpeningPanelV34}=await load();
  const rows={'-S1':{shiftStatus:'CLOSED',closingSnapshot:{cupControl:{closing:{counts:{c10:6,c10p:0,c16:10,c22p:11,c22d:26,c22o:34},capturedTs:123}}}}};
  const previous=previousShiftCupClosingV34(rows,'-S2');
  assert.equal(previous.counts.c22d,26);
  const html=renderCupOpeningPanelV34([
    {code:'c10',registered:true,outletQty:6},
    {code:'c10p',registered:true,outletQty:0},
    {code:'c16',registered:true,outletQty:10},
    {code:'c22p',registered:true,outletQty:15},
    {code:'c22d',registered:true,outletQty:68},
    {code:'c22o',registered:true,outletQty:47}
  ],{previousClosing:previous});
  assert.match(html,/Fisik akhir Shift Pagi: 26 pcs/);
  assert.match(html,/Inventory Gerai: 68 pcs/);
  assert.match(html,/3 jenis cup belum sinkron/);
});
