import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import { renderInventoryWorkspaceV32 } from '../src/ui/inventory-workspace-v32.js';

const invPath=new URL('../src/ui/inventory-workspace-v32.js',import.meta.url);
const salesPath=new URL('../src/ui/sales-shift-ux-refinement.js',import.meta.url);
const cssPath=new URL('../src/ui/ref01.css',import.meta.url);

const invSrc=()=>fs.readFileSync(invPath,'utf8');
const salesSrc=()=>fs.readFileSync(salesPath,'utf8');
const css=()=>fs.readFileSync(cssPath,'utf8');

const reconciliationModel={
  summary:{total:2,unresolved:0,needsOpname:1,resolved:1},
  groups:[
    {
      dateKey:'2026-09-15',
      counts:{total:2,unresolved:0,needsOpname:1,resolved:1},
      items:[
        {
          reference:'CUP-RECON|2026-09-15|S1|c16',
          dateKey:'2026-09-15',
          shiftLabel:'Shift Pagi',
          code:'c16',
          name:'Cup 16 Oz',
          ingredientId:'ING-C16',
          expectedClosing:24,
          physicalClosing:22,
          variance:2,
          reason:'RUSAK',
          reasonNote:'Dua cup rusak',
          status:'NEEDS_OPNAME',
          resolution:null
        },
        {
          reference:'CUP-RECON|2026-09-15|S2|c10',
          dateKey:'2026-09-15',
          shiftLabel:'Shift Siang',
          code:'c10',
          name:'Cup 10 Oz',
          ingredientId:'ING-C10',
          expectedClosing:8,
          physicalClosing:8,
          variance:0,
          reason:null,
          reasonNote:null,
          status:'RESOLVED',
          resolution:null
        }
      ]
    }
  ]
};

test('R10 Inventory Workspace exposes Rekonsiliasi tab without replacing existing tabs',()=>{
  const html=renderInventoryWorkspaceV32({
    tab:'reconciliation',
    reconciliationModel,
    reconciliationExpandedDates:['2026-09-15'],
    reconciliationDate:'2026-09-15'
  });

  for(const label of ['Ringkasan','Stok','Aktivitas','Rekonsiliasi','Lainnya']){
    assert.match(html,new RegExp(label));
  }

  assert.match(html,/data-active-tab="reconciliation"/);
  assert.match(html,/Jejak Rekonsiliasi Cup/);
  assert.match(html,/data-r10-load-date/);
  assert.match(html,/value="2026-09-15"/);
  assert.match(html,/Cup 16 Oz/);
});

test('R10 Inventory Workspace renders reconciliation detail as its own screen',()=>{
  const html=renderInventoryWorkspaceV32({
    tab:'reconciliation',
    reconciliationModel,
    reconciliationExpandedDates:['2026-09-15'],
    reconciliationSelectedRef:'CUP-RECON|2026-09-15|S1|c16',
    reconciliationDate:'2026-09-15'
  });

  assert.match(html,/data-r10-recon-detail=/);
  assert.match(html,/Buat Opname Sekarang/);
  assert.doesNotMatch(html,/data-r10-recon-date=/);
});

test('R10 reuses exported existing historical shift reader',()=>{
  assert.match(salesSrc(),/export\s+async\s+function\s+readDateShifts\s*\(/);

  const source=invSrc();
  assert.match(
    source,
    /import\s*\{\s*readDateShifts\s*\}\s*from\s*['"]\.\/sales-shift-ux-refinement\.js['"]/
  );
  assert.match(source,/readShifts\(runtime,date\)/);
});

test('R10 integration uses pure reconciliation domain and existing Inventory V2 evidence',()=>{
  const source=invSrc();

  assert.match(source,/buildCupReconciliationGroups/);
  assert.match(source,/renderCupReconciliationV1/);
  assert.match(source,/reconciliationMovements/);
  assert.match(source,/inv\.movements/);

  assert.match(source,/data-r10-date-toggle/);
  assert.match(source,/data-r10-recon-item/);
  assert.match(source,/data-r10-detail-back/);
  assert.match(source,/data-r10-stock-activity/);
});

test('R10 integration provides lazy date loading instead of eager multi-day reads',()=>{
  const source=invSrc();

  assert.match(source,/loadReconciliationDate/);
  assert.match(source,/reconciliationDateCache/);
  assert.match(source,/reconciliationTasks/);

  assert.doesNotMatch(
    source,
    /for\s*\([^)]*(?:7|30)[^)]*\)[\s\S]{0,250}readShifts/
  );
});

test('R10 date loader styling stays scoped to reconciliation UI',()=>{
  const source=css();
  assert.match(source,/\.sj-r10-date-loader/);
  assert.match(source,/\.sj-r10-date-loader\s+input/);
});
