import test from 'node:test';
import assert from 'node:assert/strict';

import { POS_ROOT } from '../src/data/firebase-client.js';
import { createInventoryRepository } from '../src/data/repositories/inventory-repository.js';

function fakeDb(values={}){
  const calls=[];
  return {
    calls,
    ref(path){
      return {
        once:async type=>{
          assert.equal(type,'value');
          calls.push(path);
          return {val:()=>values[path]??null};
        }
      };
    }
  };
}

test('Task 6 repository reads only targeted Inventory V2 paths',async()=>{
  const mappingPath=`${POS_ROOT}/global/inventoryV2/productStockComponents/P1`;
  const itemPath=`${POS_ROOT}/global/inventoryV2/ingredients/ING1`;
  const itemsPath=`${POS_ROOT}/global/inventoryV2/ingredients`;
  const appPath=`${POS_ROOT}/global/inventoryV2/stockApplications/APP1`;

  const db=fakeDb({
    [mappingPath]:{ING1:{stockItemId:'ING1',qtyPerUnit:1,active:true}},
    [itemPath]:{name:'Cup 22 oz Datar',unit:'pcs'},
    [itemsPath]:{ING1:{name:'Cup 22 oz Datar',unit:'pcs'}},
    [appPath]:{status:'COMPLETED'}
  });

  const repo=createInventoryRepository({db});

  assert.deepEqual(await repo.readProductStockComponents('P1'),{
    ING1:{stockItemId:'ING1',qtyPerUnit:1,active:true}
  });
  assert.deepEqual(await repo.readStockItem('ING1'),{
    name:'Cup 22 oz Datar',unit:'pcs'
  });
  assert.deepEqual(await repo.readStockItems(),{
    ING1:{name:'Cup 22 oz Datar',unit:'pcs'}
  });
  assert.deepEqual(await repo.readStockApplication('APP1'),{
    status:'COMPLETED'
  });

  assert.deepEqual(db.calls,[mappingPath,itemPath,itemsPath,appPath]);
  assert.equal(db.calls.includes(`${POS_ROOT}/global/inventoryV2`),false);
});
