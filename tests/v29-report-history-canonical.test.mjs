import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { resolveSalesHistoryModel, renderSalesHistory } from '../src/ui/report-sales-history-refinement.js';

test('v2.9 history resolves canonical filtered model when report controller exists',()=>{
  const canonical={transactions:[{id:'CANON'}]};
  const runtime={__SJ_V29_REPORT_CONTROLLER:{filteredModel:()=>canonical}};
  const report={state:{model:{transactions:[{id:'RAW'}]}}};
  assert.equal(resolveSalesHistoryModel(runtime,report),canonical);
});

test('v2.9 canonical history omits independent period authority but retains read-only filters and query',()=>{
  const html=renderSalesHistory({transactions:[{id:'T1',_shift:'2026-09-01-S3',paymentMethod:'CASH',items:[]}],periodLabel:'Shift Malam',canonicalScope:true,filters:{}});
  assert.ok(html.includes('data-sales-filter="query"'));
  assert.ok(html.includes('data-sales-filter="shift"'));
  assert.ok(!html.includes('data-sales-period="today"'));
  assert.ok(!html.includes('data-sales-period-date'));
});

test('v2.9 history query continues partial result refresh instead of replacing the focused input',()=>{
  const src=fs.readFileSync('src/ui/report-sales-history-refinement.js','utf8');
  assert.match(src,/if\(node\.dataset\.salesFilter==='query'\)\{refreshHistoryResults\(\);return\}/);
  assert.doesNotMatch(src,/if\(node\.dataset\.salesFilter==='query'\)\{openHistory\(\)/);
});
