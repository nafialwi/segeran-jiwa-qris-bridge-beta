import { posPath } from '../firebase-client.js';
import { readValue } from './_read.js';
export function createInventoryRepository({db}={}){return Object.freeze({
  readLegacyStock(){return readValue(db,posPath('global','inventory'))},
  readInventoryV2(){return readValue(db,posPath('global','inventoryV2'))},
  readMovements(){return readValue(db,posPath('global','inventoryV2','movements'))},
  readIngredientBalances(){return readValue(db,posPath('global','inventoryV2','balances','ingredients'))},
  // Scoped compatibility reads used only for legacy Cup cost/master reference.
  // Cup Control quantity never reads balances or movements from Inventory V2.
  readIngredientMasters(){return readValue(db,posPath('global','inventoryV2','ingredients'))},
  readIngredientCosts(){return readValue(db,posPath('global','inventoryV2','costs','ingredients'))}
})}
