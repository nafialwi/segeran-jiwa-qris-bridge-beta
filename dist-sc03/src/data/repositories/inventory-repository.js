import { posPath } from '../firebase-client.js';
import { readValue } from './_read.js';
export function createInventoryRepository({db}={}){return Object.freeze({
  readLegacyStock(){return readValue(db,posPath('global','inventory'))},
  readInventoryV2(){return readValue(db,posPath('global','inventoryV2'))},
  readMovements(){return readValue(db,posPath('global','inventoryV2','movements'))},
  readIngredientBalances(){return readValue(db,posPath('global','inventoryV2','balances','ingredients'))}
})}
