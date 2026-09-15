import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import {
  buildCupReconOpnameDraft,
  buildCupReconciliationGroups
} from '../src/domain/cup-reconciliation-v1.js';
import { renderInventoryProcessV32 } from '../src/ui/inventory-workspace-v32.js';

const invSrc=fs.readFileSync(
  new URL('../src/ui/inventory-workspace-v32.js',import.meta.url),
  'utf8'
);
const domainSrc=fs.readFileSync(
  new URL('../src/domain/cup-reconciliation-v1.js',import.meta.url),
  'utf8'
);

const item={
  reference:'CUP-RECON|2026-09-15-S1|SESSION-A|c16',
  status:'NEEDS_OPNAME',
  ingredientId:'ING-C16',
  physicalClosing:22,
  name:'Cup 16 Oz',
  shiftLabel:'Shift Pagi'
};

test('R10 builds outlet Opname draft with exact reconciliation marker',()=>{
  assert.deepEqual(buildCupReconOpnameDraft(item),{
    action:'opname',
    itemType:'ingredient',
    ingredientId:'ING-C16',
    location:'outlet',
    actual:22,
    note:'Rekonsiliasi Cup [CUP_RECON:CUP-RECON|2026-09-15-S1|SESSION-A|c16]',
    reconciliationRef:'CUP-RECON|2026-09-15-S1|SESSION-A|c16',
    origin:'reconciliation'
  });
});

test('R10 rejects reconciliation Opname when evidence is not actionable',()=>{
  assert.throws(
    ()=>buildCupReconOpnameDraft({...item,status:'RESOLVED'}),
    /CUP_RECON_OPNAME_NOT_REQUIRED/
  );

  assert.throws(
    ()=>buildCupReconOpnameDraft({...item,ingredientId:null}),
    /CUP_RECON_OPNAME_ITEM_REQUIRED/
  );

  assert.throws(
    ()=>buildCupReconOpnameDraft({...item,physicalClosing:null}),
    /CUP_RECON_OPNAME_PHYSICAL_REQUIRED/
  );
});

test('R10 Opname process visibly prefills Gerai physical count and marker note',()=>{
  const html=renderInventoryProcessV32({
    action:'opname',
    itemType:'ingredient',
    row:{
      id:'ING-C16',
      name:'Cup 16 Oz',
      unit:'pcs',
      warehouseQty:50,
      outletQty:24,
      totalQty:74
    },
    location:'outlet',
    initialValues:{
      actual:22,
      note:'Rekonsiliasi Cup [CUP_RECON:CUP-RECON|2026-09-15-S1|SESSION-A|c16]'
    }
  });

  assert.match(
    html,
    /option value="outlet" selected>Gerai<\/option>/
  );

  assert.match(
    html,
    /data-v32-process-field="actual"[^>]*value="22"/
  );

  assert.match(
    html,
    /data-v32-process-field="note"[^>]*value="Rekonsiliasi Cup \[CUP_RECON:CUP-RECON\|2026-09-15-S1\|SESSION-A\|c16\]"/
  );
});

test('R10 CTA routes through existing openAction and preserves reconciliation return context',()=>{
  assert.match(invSrc,/data-r10-opname-ref/);
  assert.match(invSrc,/buildCupReconOpnameDraft/);

  assert.match(
    invSrc,
    /await openAction\('opname','ingredient',draft\.ingredientId,draft\)/
  );

  assert.match(invSrc,/p\?\.origin==='reconciliation'/);
  assert.match(invSrc,/reconSelectedRef:p\.reconciliationRef/);
});

test('R10 raw Inventory V2 OPNAME movement resolves reconciliation after submit',()=>{
  const reference=item.reference;

  const result=buildCupReconciliationGroups({
    cupRows:[
      {
        code:'c16',
        name:'Cup 16 Oz',
        ingredientId:'ING-C16',
        registered:true
      }
    ],
    shifts:{
      '2026-09-15-S1':{
        sessions:{
          'SESSION-A':{
            shiftName:'Shift Pagi',
            cupControl:{
              reconciliation:{
                capturedAt:'2026-09-15T06:00:00.000Z',
                rows:[
                  {
                    code:'c16',
                    name:'Cup 16 Oz',
                    expectedClosing:24,
                    physicalClosing:22,
                    variance:2
                  }
                ],
                reasons:{
                  c16:{
                    reason:'RUSAK',
                    note:'Dua cup rusak'
                  }
                }
              }
            }
          }
        }
      }
    },
    movements:{
      'MOV-OPNAME-R10':{
        id:'MOV-OPNAME-R10',
        type:'OPNAME',
        itemType:'ingredient',
        itemId:'ING-C16',
        location:'outlet',
        note:`Rekonsiliasi Cup [CUP_RECON:${reference}]`,
        beforeQty:24,
        afterQty:22,
        ts:1000
      }
    }
  });

  const resolved=result.groups[0].items[0];

  assert.equal(resolved.status,'RESOLVED');
  assert.equal(resolved.resolution?.id,'MOV-OPNAME-R10');
});

test('R10 reconciliation domain remains persistence-free',()=>{
  for(const token of [
    '.set(',
    '.update(',
    '.transaction(',
    '.remove(',
    'firebase',
    'database.ref'
  ]){
    assert.equal(
      domainSrc.includes(token),
      false,
      `forbidden persistence token: ${token}`
    );
  }
});
