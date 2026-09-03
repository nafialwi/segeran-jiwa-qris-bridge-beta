import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  inventoryActivityTimeline
} from '../src/domain/inventory-v32-analytics.js';
import {
  renderInventoryWorkspaceV32,
  renderInventoryItemDetailV32
} from '../src/ui/inventory-workspace-v32.js';
import {
  renderFinishedGoodsRows,
  renderFinishedGoodsDetailV32
} from '../src/ui/finished-goods-warehouse-refinement.js';

const ingredient={
  id:'ING_TEA',name:'TEH',unit:'g',category:'BAHAN',outletQty:4500,warehouseQty:45500,totalQty:50000,
  action:'TRANSFER',actionLabel:'Perlu Transfer',actionDetail:'Stok Gerai rendah, Gudang masih mencukupi.',suggestedQty:500,
  master:{criticalOutlet:1000,warningOutlet:2000,targetOutlet:5000,minWarehouse:10000,targetWarehouse:50000}
};

test('P3 RC2 groups Inventory V2 transfer pair into one human activity',()=>{
  const raw={movements:{
    a:{id:'a',itemType:'ingredient',itemId:'ING_TEA',itemName:'TEH',type:'TRANSFER_OUT',location:'warehouse',delta:-3000,ts:1000},
    b:{id:'b',itemType:'ingredient',itemId:'ING_TEA',itemName:'TEH',type:'TRANSFER_IN',location:'outlet',delta:3000,ts:1000},
    c:{id:'c',itemType:'ingredient',itemId:'ING_TEA',itemName:'TEH',type:'PURCHASE',location:'warehouse',delta:5000,ts:900},
    d:{id:'d',itemType:'ingredient',itemId:'ING_TEA',itemName:'TEH',type:'OPNAME',location:'warehouse',beforeQty:50000,afterQty:45500,delta:-4500,ts:800}
  }};
  const timeline=inventoryActivityTimeline(raw,20);
  assert.equal(timeline.length,3);
  assert.equal(timeline[0].kind,'TRANSFER');
  assert.equal(timeline[0].title,'Pindah Stok');
  assert.equal(timeline[0].direction,'Gudang → Gerai');
  assert.equal(timeline[0].qty,3000);
  assert.deepEqual(timeline[0].movementIds.sort(),['a','b']);
  assert.equal(timeline[1].title,'Pembelian');
  assert.equal(timeline[2].title,'Cek Stok Fisik');
  assert.equal(timeline[2].beforeQty,50000);
  assert.equal(timeline[2].afterQty,45500);
});

test('P3 RC2 inventory stock rows and timeline items are clickable context entry points',()=>{
  const timeline=[{id:'t1',kind:'TRANSFER',title:'Pindah Stok',itemType:'ingredient',itemId:'ING_TEA',itemName:'TEH',direction:'Gudang → Gerai',qty:3000,delta:0,ts:1000,movementIds:['a','b']}];
  const stock=renderInventoryWorkspaceV32({tab:'stock',rows:[ingredient],recentActivities:timeline});
  assert.match(stock,/data-v32-inventory-open-item="ING_TEA"/);
  const activity=renderInventoryWorkspaceV32({tab:'activity',rows:[ingredient],recentActivities:timeline});
  assert.match(activity,/data-v32-inventory-activity-item="ING_TEA"/);
  assert.match(activity,/Pindah Stok/);
  assert.doesNotMatch(activity,/TRANSFER_OUT/);
});

test('P3 RC2 ingredient detail is an actionable Observe Understand Act surface',()=>{
  const html=renderInventoryItemDetailV32({row:ingredient,activities:[]});
  assert.match(html,/TEH/);
  assert.match(html,/Gerai/);
  assert.match(html,/Gudang/);
  assert.match(html,/Total/);
  assert.match(html,/Batas Kritis/);
  assert.match(html,/Target Gerai/);
  assert.match(html,/Minimum Gudang/);
  assert.match(html,/data-v32-inventory-action="transfer"/);
  assert.match(html,/data-v32-inventory-action="purchase"/);
  assert.match(html,/data-v32-inventory-action="opname"/);
  assert.match(html,/data-v32-inventory-action="edit-rules"/);
});

test('P3 RC2 finished-goods cards open a product detail and owner processes from that detail',()=>{
  const row={id:'P_BAK2',name:'BAKARAN 2K',sku:'BK2',warehouseQty:12,outletQty:9,totalQty:21};
  const list=renderFinishedGoodsRows({role:'owner',rows:[row]});
  assert.match(list,/data-v32-fg-open-detail="P_BAK2"/);
  const detail=renderFinishedGoodsDetailV32({role:'owner',row});
  assert.match(detail,/BAKARAN 2K/);
  assert.match(detail,/Gudang/);
  assert.match(detail,/Gerai/);
  assert.match(detail,/data-v29-fg-action="warehouse-opname"/);
  assert.match(detail,/data-v29-fg-action="transfer"/);
  assert.match(detail,/data-v29-fg-action="purchase-advanced"/);
});

test('P3 RC2 presentation removes cramped activity copy and hides legacy mixed selector after prefill',()=>{
  const css=fs.readFileSync(new URL('../src/ui/ref01.css',import.meta.url),'utf8');
  const workspace=fs.readFileSync(new URL('../src/ui/inventory-workspace-v32.js',import.meta.url),'utf8');
  const finished=fs.readFileSync(new URL('../src/ui/finished-goods-warehouse-refinement.js',import.meta.url),'utf8');
  assert.match(css,/\.sj-v32-inv-actions>button>span:first-child\{grid-row:1\/3/);
  assert.match(css,/\.sj-v32-inv-actions>button>b,.sj-v32-inv-actions>button>small\{grid-column:2/);
  assert.match(workspace,/data-v32-inventory-action="edit-rules"/);
  assert.match(workspace,/data-edit-ing/);
  assert.match(finished,/field\.style\.display='none'/);
});
