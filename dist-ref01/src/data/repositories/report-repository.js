import { posPath } from '../firebase-client.js';
import { readValue } from './_read.js';
export function createReportRepository({db}={}){return Object.freeze({
  readShift(shiftKey){return readValue(db,posPath(shiftKey))},
  readGlobal(){return readValue(db,posPath('global'))},
  readInventoryV2(){return readValue(db,posPath('global','inventoryV2'))},
  readRefunds(){return readValue(db,posPath('global','refunds'))}
})}
