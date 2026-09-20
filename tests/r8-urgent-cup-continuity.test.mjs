import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

const modulePath=path.join(process.cwd(),'src/ui/cup-shift-control-v34.js');
async function load(){return import(pathToFileURL(modulePath).href+`?t=${Date.now()}-${Math.random()}`)}

test('opening works before Firebase refresh and does not depend on Inventory V2',async()=>{
  const {renderCupOpeningPanelV34}=await load();
  const html=renderCupOpeningPanelV34([]);
  assert.equal((html.match(/data-v34-cup-opening=/g)||[]).length,6);
  assert.doesNotMatch(html,/Sistem Gerai|Inventory Gerai/);
  assert.match(html,/Inventory V2 bukan authority Cup/);
});

test('closing previous shift physical becomes the next opening continuity reference',async()=>{
  const {previousShiftCupClosingV34,renderCupOpeningPanelV34}=await load();
  const rows={'-S1':{shiftStatus:'CLOSED',closingSnapshot:{cupControl:{closing:{counts:{c10:6,c10p:0,c16:10,c22p:11,c22d:26,c22o:34},capturedTs:123}}}}};
  const previous=previousShiftCupClosingV34(rows,'-S2');
  assert.equal(previous.counts.c22d,26);
  const html=renderCupOpeningPanelV34([],{previousClosing:previous});
  assert.match(html,/Fisik akhir Shift Pagi: 26 pcs/);
  assert.match(html,/data-v34-cup-opening="c22d" value="26"/);
  assert.doesNotMatch(html,/Inventory Gerai|belum sinkron/);
});
