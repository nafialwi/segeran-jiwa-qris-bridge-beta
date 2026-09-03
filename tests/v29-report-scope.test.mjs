import test from 'node:test';
import assert from 'node:assert/strict';
import {
  reportScopePeriod,
  filterReportModel,
  reportShiftCode,
  reportDateKey,
  monthWeekIndex
} from '../src/domain/report-v29-scope.js';

test('v2.9 report scope ranges map Shift/Day/Week/Month/Custom to deterministic read periods',()=>{
  assert.deepEqual(reportScopePeriod({scope:'shift',anchorDate:'2026-09-01'}).explicit,{from:'2026-09-01',to:'2026-09-01'});
  assert.deepEqual(reportScopePeriod({scope:'day',anchorDate:'2026-09-01'}).explicit,{from:'2026-09-01',to:'2026-09-01'});
  assert.deepEqual(reportScopePeriod({scope:'week',anchorDate:'2026-09-03'}).explicit,{from:'2026-08-31',to:'2026-09-06'});
  assert.deepEqual(reportScopePeriod({scope:'month',anchorDate:'2026-09-15'}).explicit,{from:'2026-09-01',to:'2026-09-30'});
  assert.deepEqual(reportScopePeriod({scope:'custom',from:'2026-08-20',to:'2026-09-01'}).explicit,{from:'2026-08-20',to:'2026-09-01'});
});

test('v2.9 report metadata derives date/shift/week from frozen report shift keys',()=>{
  assert.equal(reportDateKey({_shift:'2026-09-08-S3'}),'2026-09-08');
  assert.equal(reportShiftCode({_shift:'2026-09-08-S3'}),'S3');
  assert.equal(monthWeekIndex('2026-09-08'),2);
  assert.equal(monthWeekIndex('2026-09-29'),5);
});

test('v2.9 canonical filters apply the same shift/day/week scope to transactions shifts and expenses',()=>{
  const model={
    transactions:[
      {id:'T1',_shift:'2026-09-01-S1'},
      {id:'T2',_shift:'2026-09-01-S3'},
      {id:'T3',_shift:'2026-09-08-S3'},
      {id:'T4',_shift:'2026-09-15-S2'}
    ],
    shifts:[
      {id:'2026-09-01-S1'},
      {id:'2026-09-01-S3'},
      {id:'2026-09-08-S3'},
      {id:'2026-09-15-S2'}
    ],
    expenses:[
      {id:'E1',_shift:'2026-09-01-S1'},
      {id:'E2',_shift:'2026-09-08-S3'}
    ]
  };
  assert.deepEqual(filterReportModel(model,{shift:'S3'}).transactions.map(x=>x.id),['T2','T3']);
  assert.deepEqual(filterReportModel(model,{day:'2026-09-01'}).transactions.map(x=>x.id),['T1','T2']);
  assert.deepEqual(filterReportModel(model,{week:2}).transactions.map(x=>x.id),['T3']);
  const combined=filterReportModel(model,{shift:'S3',week:2});
  assert.deepEqual(combined.transactions.map(x=>x.id),['T3']);
  assert.deepEqual(combined.shifts.map(x=>x.id),['2026-09-08-S3']);
  assert.deepEqual(combined.expenses.map(x=>x.id),['E2']);
});

import fs from 'node:fs';
import vm from 'node:vm';
import { chartBucketsForScope } from '../src/domain/report-v28-analytics.js';

test('v3.2 report chart adapts buckets to Shift/Day/Week/Month scope using real scoped transactions',()=>{
  const at=(day,hour)=>new Date(2026,8,day,hour,0,0,0).getTime();
  const tx=(id,shift,day,hour,total=10000)=>({id,_shift:`2026-09-${String(day).padStart(2,'0')}-${shift}`,ts:at(day,hour),status:'PAID',pricing:{netSubtotal:total,total},items:[{id:'P',name:'P',qty:1,price:total}]});
  const rows=[tx('A','S1',1,8),tx('B','S1',1,9),tx('C','S3',1,20),tx('D','S3',2,21)];
  assert.deepEqual(chartBucketsForScope(rows,{scope:'shift'}).map(x=>x.key),['08','09','20','21']);
  assert.deepEqual(chartBucketsForScope(rows.filter(x=>x._shift.startsWith('2026-09-01')),{scope:'day'}).map(x=>x.key),['S1','S3']);
  assert.deepEqual(chartBucketsForScope(rows,{scope:'week'}).map(x=>x.key),['2026-09-01','2026-09-02']);
  assert.deepEqual(chartBucketsForScope(rows,{scope:'month'}).map(x=>x.key),['2026-09-W1'],'month overview uses compact weekly buckets on mobile');
  const s3=chartBucketsForScope(rows.filter(x=>x._shift.endsWith('-S3')),{scope:'day',shift:'S3'});
  assert.deepEqual(s3.map(x=>x.key),['20','21'],'a selected day-shift uses hourly detail rather than an unhelpful single shift bar');
});

test('v2.9 production compatibility exposes current outlet stock as read-only report evidence',()=>{
  const src=fs.readFileSync(new URL('../src/compat/ref01-production-sales-compat.js',import.meta.url),'utf8');
  const context={
    console,cart:[],activeDateOnly:'2026-09-01',activeDate:'2026-09-01-S3',DB_PATH:'toko_segeranjiwa_v58',
    cloudData:{global:{menu:[{id:'P1',n:'Produk 1',stok:2,active:true}],inventory:{P1:17}}},
    SJHarden:{isActiveProduct:()=>true,orderValue:()=>10},SJShift:{guardTransaction:()=>true},
    isDayLocked:()=>false,sjTrackStock:()=>true,sjStockQty:()=>17,showToast(){},playBeep(){},updateCartUI(){},navigator:{vibrate(){}},document:{getElementById(){return null}},setTimeout(){},alert(){},Object,Number,String,Math,Date,Promise
  };
  context.window=context;vm.createContext(context);vm.runInContext(src,context);
  assert.equal(context.SJRef01ProductionSalesCompat.productById('P1').n,'Produk 1');
  assert.equal(context.SJRef01ProductionSalesCompat.outletStock('P1'),17);
  assert.doesNotMatch(src,/\.set\s*\(|\.update\s*\(|\.transaction\s*\(|\.remove\s*\(/,'read-only compatibility must not add writer tokens');
});
