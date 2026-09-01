import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
let domain=null;try{domain=await import('../src/domain/finished-goods-stock.js')}catch(_){}

test('finished-goods decision keeps normal ending stock at outlet with no movement',()=>{
  assert.ok(domain,'finished-goods domain module must exist');
  const d=domain.endingStockDecision({productId:'P1',productName:'Es Teh',systemQty:12,countedQty:12,disposition:'STAY'});
  assert.equal(d.kind,'NO_MOVEMENT');
  assert.equal(d.mutationAllowed,false);
  assert.equal(d.requiresOwner,false);
});

test('damage/loss/expiry becomes draft requiring Owner reconciliation and never stock mutation',()=>{
  assert.ok(domain);
  for(const reason of ['RUSAK','BASI','SOBEK','BOCOR','KEDALUWARSA','HILANG','SELISIH']){
    const d=domain.endingStockDecision({productId:'P1',productName:'Produk',systemQty:10,countedQty:8,disposition:'EXCEPTION',reason,note:'cek fisik',reportedBy:'Kasir'});
    assert.equal(d.kind,'OWNER_RECONCILIATION_DRAFT',reason);
    assert.equal(d.requiresOwner,true,reason);
    assert.equal(d.mutationAllowed,false,reason);
    assert.equal(d.authority,'INVENTORY_V2_OPNAME',reason);
    assert.ok(d.whatsappText.includes(reason),reason);
  }
});

test('finished-goods UI includes stock-tracked products even if recipe metadata exists and delegates writes to existing Inventory V2 authority',()=>{
  const src=fs.readFileSync('src/ui/finished-goods-warehouse-refinement.js','utf8');
  assert.ok(src.includes('export function finishedProductsForStock'));
  assert.ok(!/finishedProductsForStock[\s\S]{0,400}recipeForProduct/.test(src),'recipe metadata must not hide a normal finished-good stock row');
  assert.ok(src.includes("SJInventoryV2?.open?.('transfer')"));
  assert.ok(src.includes("SJInventoryV2?.open?.('opname')"));
  assert.ok(src.includes('openExceptionDraft'));
  assert.ok(src.includes('WhatsApp'));
});

test('finished-goods UI makes safe flow explicit and does not contain direct RTDB mutation calls',()=>{
  const src=fs.readFileSync('src/ui/finished-goods-warehouse-refinement.js','utf8');
  for(const text of ['Stok Barang Jadi','Gudang','Gerai','Penjualan','Stok Akhir','tetap di Gerai','Rekonsiliasi Owner'])assert.ok(src.includes(text),text);
  assert.match(src,/Draft ini belum mengubah stok/i);
  assert.ok(!/\.(set|update|transaction|remove)\s*\(/.test(src));
});
