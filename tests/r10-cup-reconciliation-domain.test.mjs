import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildCupReconciliationRef,
  buildCupReconciliationGroups,
  findCupReconOpname
} from '../src/domain/cup-reconciliation-v1.js';

const cups=[
  {code:'c10',name:'Cup 10 Oz',ingredientId:'ING-C10',registered:true},
  {code:'c10p',name:'Cup Paper 10 Oz',ingredientId:'ING-C10P',registered:true},
  {code:'c16',name:'Cup 16 Oz',ingredientId:'ING-C16',registered:true},
  {code:'c22o',name:'Cup 22 Oz Oval',ingredientId:'ING-C22O',registered:true}
];

test('R10 builds deterministic reconciliation reference from shift, session and cup',()=>{
  assert.equal(
    buildCupReconciliationRef({
      shiftKey:'2026-09-14',
      sessionId:'S-PAGI',
      code:'c16'
    }),
    'CUP-RECON|2026-09-14|S-PAGI|c16'
  );
});

test('R10 rejects incomplete reconciliation identity',()=>{
  assert.throws(
    ()=>buildCupReconciliationRef({
      shiftKey:'2026-09-14',
      sessionId:'',
      code:'c16'
    }),
    /CUP_RECON_IDENTITY_REQUIRED/
  );
});

test('R10 resolves only matching ingredient opname carrying exact reconciliation marker',()=>{
  const reference='CUP-RECON|2026-09-14|S-SIANG|c22o';

  const movements=[
    {
      id:'MOV-WRONG-ITEM',
      kind:'OPNAME',
      itemType:'ingredient',
      itemId:'ING-C16',
      location:'outlet',
      note:`[CUP_RECON:${reference}]`,
      beforeQty:42,
      afterQty:38,
      ts:100
    },
    {
      id:'MOV-WRONG-NOTE',
      kind:'OPNAME',
      itemType:'ingredient',
      itemId:'ING-C22O',
      location:'outlet',
      note:'Opname biasa',
      beforeQty:42,
      afterQty:38,
      ts:200
    },
    {
      id:'MOV-OK',
      kind:'OPNAME',
      itemType:'ingredient',
      itemId:'ING-C22O',
      location:'outlet',
      note:`Selisih closing [CUP_RECON:${reference}]`,
      beforeQty:42,
      afterQty:38,
      ts:300
    }
  ];

  const found=findCupReconOpname({
    reference,
    movements,
    ingredientId:'ING-C22O'
  });

  assert.equal(found?.id,'MOV-OK');
});

test('R10 groups reconciliation by date and derives safe status from evidence',()=>{
  const resolvedRef=buildCupReconciliationRef({
    shiftKey:'2026-09-14',
    sessionId:'S-SIANG',
    code:'c22o'
  });

  const shifts={
    '2026-09-13':{
      sessions:{
        'S-PAGI':{
          shiftName:'Shift Pagi',
          openedTs:10,
          cupControl:{
            reconciliation:{
              capturedAt:'2026-09-13T14:00:00.000Z',
              rows:[
                {
                  code:'c10p',
                  name:'Cup Paper 10 Oz',
                  expectedClosing:20,
                  physicalClosing:null,
                  variance:null
                }
              ],
              reasons:{}
            }
          }
        }
      }
    },

    '2026-09-14':{
      sessions:{
        'S-PAGI':{
          shiftName:'Shift Pagi',
          openedTs:100,
          cupControl:{
            reconciliation:{
              capturedAt:'2026-09-14T07:00:00.000Z',
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
                  note:'Dua cup rusak di area bar'
                }
              }
            }
          }
        },

        'S-SIANG':{
          shiftName:'Shift Siang',
          openedTs:200,
          cupControl:{
            reconciliation:{
              capturedAt:'2026-09-14T14:00:00.000Z',
              rows:[
                {
                  code:'c22o',
                  name:'Cup 22 Oz Oval',
                  expectedClosing:42,
                  physicalClosing:38,
                  variance:4
                }
              ],
              reasons:{
                c22o:{
                  reason:'SELISIH_FISIK',
                  note:'Sudah dicek ulang'
                }
              }
            }
          }
        },

        'S-MALAM':{
          shiftName:'Shift Malam',
          openedTs:300,
          cupControl:{
            reconciliation:{
              capturedAt:'2026-09-14T22:00:00.000Z',
              rows:[
                {
                  code:'c10',
                  name:'Cup 10 Oz',
                  expectedClosing:6,
                  physicalClosing:6,
                  variance:0
                }
              ],
              reasons:{}
            }
          }
        }
      }
    }
  };

  const movements=[
    {
      id:'MOV-OPNAME-1',
      kind:'OPNAME',
      itemType:'ingredient',
      itemId:'ING-C22O',
      location:'outlet',
      note:`Adjustment [CUP_RECON:${resolvedRef}]`,
      beforeQty:42,
      afterQty:38,
      ts:500
    }
  ];

  const result=buildCupReconciliationGroups({
    shifts,
    movements,
    cupRows:cups
  });

  assert.deepEqual(result.summary,{
    total:4,
    unresolved:1,
    needsOpname:1,
    resolved:2
  });

  assert.equal(result.groups.length,2);
  assert.equal(result.groups[0].dateKey,'2026-09-14');
  assert.equal(result.groups[1].dateKey,'2026-09-13');

  assert.deepEqual(result.groups[0].counts,{
    total:3,
    unresolved:0,
    needsOpname:1,
    resolved:2
  });

  const sep14=result.groups[0].items;

  // Actionable item is first.
  assert.equal(sep14[0].code,'c16');
  assert.equal(sep14[0].status,'NEEDS_OPNAME');
  assert.equal(sep14[0].ingredientId,'ING-C16');
  assert.equal(sep14[0].expectedClosing,24);
  assert.equal(sep14[0].physicalClosing,22);
  assert.equal(sep14[0].variance,2);
  assert.equal(sep14[0].reason,'RUSAK');
  assert.equal(sep14[0].reasonNote,'Dua cup rusak di area bar');

  const oval=sep14.find(x=>x.code==='c22o');
  assert.equal(oval.status,'RESOLVED');
  assert.equal(oval.resolution?.id,'MOV-OPNAME-1');

  const zero=sep14.find(x=>x.code==='c10');
  assert.equal(zero.status,'RESOLVED');
  assert.equal(zero.resolution,null);

  const old=result.groups[1].items[0];
  assert.equal(old.code,'c10p');
  assert.equal(old.status,'UNRESOLVED');
});

test('R10 does not resolve non-zero variance when cup master mapping is unavailable',()=>{
  const result=buildCupReconciliationGroups({
    shifts:{
      '2026-09-14':{
        sessions:{
          S1:{
            cupControl:{
              reconciliation:{
                rows:[{
                  code:'unknown-cup',
                  name:'Unknown Cup',
                  expectedClosing:10,
                  physicalClosing:8,
                  variance:2
                }],
                reasons:{}
              }
            }
          }
        }
      }
    },
    movements:[],
    cupRows:[]
  });

  assert.equal(result.groups[0].items[0].status,'UNRESOLVED');
  assert.equal(result.groups[0].items[0].ingredientId,null);
});
