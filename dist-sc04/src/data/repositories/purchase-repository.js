import { posPath } from '../firebase-client.js';
import { readValue } from './_read.js';
export function createPurchaseRepository({db}={}){return Object.freeze({
  readPurchases(){return readValue(db,posPath('global','inventoryV2','purchases'))},
  readPurchase(purchaseId){return readValue(db,posPath('global','inventoryV2','purchases',purchaseId))}
})}
