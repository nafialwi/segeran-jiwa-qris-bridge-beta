import { posPath } from '../firebase-client.js';
import { readValue } from './_read.js';
export function createTransactionRepository({db}={}){return Object.freeze({
  readShiftTransactions(shiftKey){return readValue(db,posPath(shiftKey,'tx'))},
  readTransaction(shiftKey,txId){return readValue(db,posPath(shiftKey,'tx',txId))}
})}
