import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  addCupLiveRestockCountV34,
  buildCupLiveRestockUpdatesV34,
  renderCupLiveRestockPanelV34
} from '../src/ui/cup-shift-control-v34.js';

test('CUP live restock adds to existing shift total without changing opening semantics',()=>{
  const out=addCupLiveRestockCountV34({c22o:5},'c22o',25);
  assert.equal(out.c22o,30);
  assert.equal(out.c10,0);
  assert.throws(()=>addCupLiveRestockCountV34({},'c22o',0),/CUP_RESTOCK_QTY_INVALID/);
  assert.throws(()=>addCupLiveRestockCountV34({},'unknown',5),/CUP_RESTOCK_CODE_INVALID/);
});

test('CUP live restock writes only existing cupControl/restock schema for active session and shift mirror',()=>{
  const shift='2026-09-20-S1',sid='SES-1';
  const out=buildCupLiveRestockUpdatesV34(shift,sid,{c22d:7},'c22d',20,{capturedAt:'2026-09-20T12:00:00.000Z',capturedTs:1});
  assert.equal(out.counts.c22d,27);
  assert.deepEqual(Object.keys(out.updates).sort(),[
    `${shift}/cupControl/restock`,
    `${shift}/sessions/${sid}/cupControl/restock`
  ].sort());
  for(const value of Object.values(out.updates)){
    assert.equal(value.version,'CUP-CONTROL-V1');
    assert.equal(value.schemaVersion,1);
    assert.equal(value.source,'SHIFT_LIVE_RESTOCK');
    assert.equal(value.counts.c22d,27);
  }
});

test('CUP live restock active-shift UI exposes one-tap add flow and cumulative summary',()=>{
  const html=renderCupLiveRestockPanelV34({c22o:25});
  assert.match(html,/\+ TAMBAH CUP/);
  assert.match(html,/Restock tersimpan langsung ke shift aktif/);
  assert.match(html,/Cup 22 Oz Oval 25/);
  assert.match(html,/data-v34-cup-live-restock-code/);
  assert.match(html,/data-v34-cup-live-restock-qty/);
});

test('CUP live restock delegates persistence to verified root writer and adds no direct RTDB mutation token',()=>{
  const src=readFileSync(new URL('../src/ui/cup-shift-control-v34.js',import.meta.url),'utf8');
  assert.match(src,/hardening\.verifiedRootUpdate\(built\.updates,'CUP_RESTOCK_TIMEOUT'/);
  assert.match(src,/shift\.loadDay\(date\)/);
  assert.match(src,/enhanceLiveRestock/);
  assert.match(src,/syncCupClosingPanelInPlaceV34/);
  assert.doesNotMatch(src,/\.(?:set|update|transaction|remove)\s*\(/);
});
