import test from 'node:test';
import assert from 'node:assert/strict';
import { renderSalesTransactionDetail,renderSalesHistory } from '../src/ui/report-sales-history-refinement.js';

test('transaction detail reads persisted cashier field used by production sales writer',()=>{
  const tx={id:'T1',shift:'2026-09-23-S2',cashier:'OWNER UAT',method:'Tunai',total:10000,items:[{id:'P1',n:'Produk',q:1,p:10000}]};
  const html=renderSalesTransactionDetail(tx);
  assert.match(html,/Kasir<\/span><b>OWNER UAT<\/b>/);
});

test('sales history cashier filter/list also uses persisted cashier field',()=>{
  const tx={id:'T1',shift:'2026-09-23-S2',cashier:'OWNER UAT',method:'Tunai',total:10000,items:[{id:'P1',n:'Produk',q:1,p:10000}]};
  const html=renderSalesHistory({transactions:[tx]});
  assert.match(html,/OWNER UAT/);
  assert.doesNotMatch(html,/Kasir<\/span><b>-<\/b>/);
});
