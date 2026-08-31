function need(engine,name){const fn=engine?.[name];if(typeof fn!=='function')throw new Error(`INVENTORY_ENGINE_METHOD_MISSING:${name}`);return fn.bind(engine)}
export function createInventoryService({engine,bridge}={}){
  const e=()=>engine||(bridge?bridge.engine('inventory'):null);
  return Object.freeze({
    status(){return need(e(),'status')()},
    recipeForProduct(id){return need(e(),'recipeForProduct')(id)},
    async reserveRecipeConsumption(cart){return await need(e(),'reserveRecipeConsumption')(cart)},
    async rollbackRecipeReservation(reservation,reason){return await need(e(),'rollbackRecipeReservation')(reservation,reason)},
    async commitRecipeReservation(reservation,txId,shift,cart){return await need(e(),'commitRecipeReservation')(reservation,txId,shift,cart)},
    async normalizeCommittedRecipeSale(txId,shift,cart){return await need(e(),'normalizeCommittedRecipeSale')(txId,shift,cart)},
    async restoreVoidedRecipeTx(txId,tx,shift){return await need(e(),'restoreVoidedRecipeTx')(txId,tx,shift)},
    async recoverVoidTransactions(){return await need(e(),'recoverVoidTransactions')()}
  });
}
