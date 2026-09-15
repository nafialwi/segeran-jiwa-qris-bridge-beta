import test from 'node:test';
import assert from 'node:assert/strict';
import { renderCupReconciliationV1 } from '../src/ui/cup-reconciliation-v1.js';

const model={
  summary:{total:4,unresolved:1,needsOpname:1,resolved:2},
  groups:[
    {
      dateKey:'2026-09-14',
      counts:{total:3,unresolved:0,needsOpname:1,resolved:2},
      items:[
        {
          reference:'CUP-RECON|2026-09-14|S-PAGI|c16',
          dateKey:'2026-09-14',
          shiftLabel:'Shift Pagi',
          code:'c16',name:'Cup 16 Oz',ingredientId:'ING-C16',
          expectedClosing:24,physicalClosing:22,variance:2,
          reason:'RUSAK',reasonNote:'Dua cup rusak di area bar',
          status:'NEEDS_OPNAME',resolution:null
        },
        {
          reference:'CUP-RECON|2026-09-14|S-SIANG|c22o',
          dateKey:'2026-09-14',
          shiftLabel:'Shift Siang',
          code:'c22o',name:'Cup 22 Oz Oval',ingredientId:'ING-C22O',
          expectedClosing:42,physicalClosing:38,variance:4,
          reason:'SELISIH_FISIK',reasonNote:'Sudah dicek ulang',
          status:'RESOLVED',
          resolution:{id:'MOV-OPNAME-1',beforeQty:42,afterQty:38,ts:500}
        },
        {
          reference:'CUP-RECON|2026-09-14|S-MALAM|c10',
          dateKey:'2026-09-14',
          shiftLabel:'Shift Malam',
          code:'c10',name:'Cup 10 Oz',ingredientId:'ING-C10',
          expectedClosing:6,physicalClosing:6,variance:0,
          reason:null,reasonNote:null,
          status:'RESOLVED',resolution:null
        }
      ]
    },
    {
      dateKey:'2026-09-13',
      counts:{total:1,unresolved:1,needsOpname:0,resolved:0},
      items:[
        {
          reference:'CUP-RECON|2026-09-13|S-PAGI|c10p',
          dateKey:'2026-09-13',
          shiftLabel:'Shift Pagi',
          code:'c10p',name:'Cup Paper 10 Oz',ingredientId:'ING-C10P',
          expectedClosing:20,physicalClosing:null,variance:null,
          reason:null,reasonNote:null,status:'UNRESOLVED',resolution:null
        }
      ]
    }
  ]
};

test('R10 renderer shows KPI summary',()=>{
  const html=renderCupReconciliationV1({groups:model,expandedDates:['2026-09-14']});
  assert.match(html,/sj-r10-cup-recon/);
  assert.match(html,/Jejak Rekonsiliasi Cup/);
  assert.match(html,/data-r10-kpi="unresolved"[\s\S]*?>1</);
  assert.match(html,/data-r10-kpi="needs-opname"[\s\S]*?>1</);
  assert.match(html,/data-r10-kpi="resolved"[\s\S]*?>2</);
});

test('R10 renderer uses independent date accordion',()=>{
  const html=renderCupReconciliationV1({groups:model,expandedDates:['2026-09-14']});
  assert.match(html,/data-r10-recon-date="2026-09-14"[\s\S]*14 Sep 2026/);
  assert.match(html,/data-r10-date-toggle="2026-09-14"[\s\S]*aria-expanded="true"/);
  assert.match(html,/data-r10-date-toggle="2026-09-13"[\s\S]*aria-expanded="false"/);
  assert.match(html,/Cup 16 Oz/);
  assert.doesNotMatch(html,/Cup Paper 10 Oz/);
});

test('R10 item shows expected physical variance and status',()=>{
  const html=renderCupReconciliationV1({groups:model,expandedDates:['2026-09-14']});
  assert.match(html,/data-r10-recon-item="CUP-RECON\|2026-09-14\|S-PAGI\|c16"/);
  assert.match(html,/Sistem[\s\S]*24 pcs/);
  assert.match(html,/Fisik[\s\S]*22 pcs/);
  assert.match(html,/Selisih[\s\S]*-2 pcs/);
  assert.match(html,/Perlu Opname/);
});

test('R10 detail is separate screen with audit evidence and opname CTA',()=>{
  const ref='CUP-RECON|2026-09-14|S-PAGI|c16';
  const html=renderCupReconciliationV1({groups:model,selectedRef:ref});
  assert.match(html,/data-r10-recon-detail=/);
  assert.match(html,/Cup 16 Oz/);
  assert.match(html,/Alasan Selisih/);
  assert.match(html,/Dua cup rusak di area bar/);
  assert.match(html,/Buat Opname Sekarang/);
  assert.match(html,/data-r10-opname-ref="CUP-RECON\|2026-09-14\|S-PAGI\|c16"/);
  assert.match(html,/Jejak Proses/);
  assert.match(html,/Lihat Aktivitas Stok/);
  assert.doesNotMatch(html,/data-r10-recon-date=/);
});

test('R10 resolved detail shows opname evidence and no action CTA',()=>{
  const html=renderCupReconciliationV1({
    groups:model,
    selectedRef:'CUP-RECON|2026-09-14|S-SIANG|c22o'
  });
  assert.match(html,/Sudah Diselesaikan/);
  assert.match(html,/MOV-OPNAME-1/);
  assert.match(html,/42 → 38/);
  assert.doesNotMatch(html,/Buat Opname Sekarang/);
});

test('R10 renderer escapes operator supplied text',()=>{
  const dirty=structuredClone(model);
  dirty.groups[0].items[0].reasonNote='<img src=x onerror=alert(1)>';
  const html=renderCupReconciliationV1({
    groups:dirty,
    selectedRef:'CUP-RECON|2026-09-14|S-PAGI|c16'
  });
  assert.doesNotMatch(html,/<img/);
  assert.match(html,/&lt;img/);
});
