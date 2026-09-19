import { posPath } from '../firebase-client.js';
import { readValue } from './_read.js';
import { createInventoryReadDiagnostics, estimateJsonBytes } from '../inventory-read-diagnostics.js';

export { createInventoryReadDiagnostics } from '../inventory-read-diagnostics.js';

function valueFromSnapshot(snap){return snap&&typeof snap.val==='function'?snap.val():null}
function safeLimit(value,fallback=120){const n=Math.floor(Number(value));return Number.isFinite(n)&&n>0?Math.min(n,1000):fallback}

export function createInventoryRepository({db,diagnostics=null,consumer='inventory-repository'}={}){
  async function read(operation,path,{bounded=false,limit=null}={}){
    const started=Date.now(),value=await readValue(db,path);
    diagnostics?.record?.({consumer,operation,path,durationMs:Date.now()-started,estimatedBytes:estimateJsonBytes(value),bounded,limit});
    return value;
  }
  async function readRecentMovements({limit=120}={}){
    if(!db||typeof db.ref!=='function')throw new Error('RTDB_READ_CLIENT_REQUIRED');
    const boundedLimit=safeLimit(limit),path=posPath('global','inventoryV2','movements'),started=Date.now(),ref=db.ref(path);
    if(!ref||typeof ref.orderByChild!=='function')throw new Error('RTDB_QUERY_CLIENT_REQUIRED');
    const query=ref.orderByChild('ts').limitToLast(boundedLimit),snap=await query.once('value'),value=valueFromSnapshot(snap);
    diagnostics?.record?.({consumer,operation:'recentMovements',path,durationMs:Date.now()-started,estimatedBytes:estimateJsonBytes(value),bounded:true,limit:boundedLimit});
    return value;
  }
  async function readWorkspaceState(){
    const [ingredients,ingredientBalances,ingredientCosts,productWarehouse]=await Promise.all([
      readIngredients(),readIngredientBalances(),readIngredientCosts(),readProductWarehouse()
    ]);
    return Object.freeze({
      ingredients:ingredients||{},
      balances:Object.freeze({ingredients:ingredientBalances||{}}),
      costs:Object.freeze({ingredients:ingredientCosts||{}}),
      productWarehouse:productWarehouse||{}
    });
  }
  function readLegacyStock(){return read('legacyStock',posPath('global','inventory'))}
  function readInventoryV2(){return read('inventoryV2Full',posPath('global','inventoryV2'))}
  function readMovements(){return read('movementsFull',posPath('global','inventoryV2','movements'))}
  function readIngredients(){return read('ingredients',posPath('global','inventoryV2','ingredients'))}
  function readIngredientBalances(){return read('ingredientBalances',posPath('global','inventoryV2','balances','ingredients'))}
  function readIngredientCosts(){return read('ingredientCosts',posPath('global','inventoryV2','costs','ingredients'))}
  function readProductWarehouse(){return read('productWarehouse',posPath('global','inventoryV2','productWarehouse'))}
  function requiredKey(value,label){
    const key=String(value??'').trim();
    if(!key)throw Object.assign(
      new Error(`INVENTORY_READ_KEY_REQUIRED:${label}`),
      {code:'INVENTORY_READ_KEY_REQUIRED'}
    );
    return key;
  }
  function readProductStockComponents(productId){
    return read(
      'productStockComponents',
      posPath(
        'global','inventoryV2','productStockComponents',
        requiredKey(productId,'productId')
      )
    );
  }
  function readStockItem(stockItemId){
    return read(
      'stockItem',
      posPath(
        'global','inventoryV2','ingredients',
        requiredKey(stockItemId,'stockItemId')
      )
    );
  }
  function readStockItems(){
    return read('stockItems',posPath('global','inventoryV2','ingredients'));
  }
  function readStockApplication(applicationId){
    return read(
      'stockApplication',
      posPath(
        'global','inventoryV2','stockApplications',
        requiredKey(applicationId,'applicationId')
      )
    );
  }
  function readRecipes(){return read('recipes',posPath('global','inventoryV2','recipes'))}
  return Object.freeze({readLegacyStock,readInventoryV2,readMovements,readRecentMovements,readIngredients,readIngredientBalances,readIngredientCosts,readProductWarehouse,readRecipes,readProductStockComponents,readStockItem,readStockItems,readStockApplication,readWorkspaceState});
}
