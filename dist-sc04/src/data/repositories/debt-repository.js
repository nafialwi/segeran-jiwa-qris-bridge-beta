import { posPath } from '../firebase-client.js';
import { readValue } from './_read.js';
export function createDebtRepository({db}={}){return Object.freeze({
  readCustomerDebts(){return readValue(db,posPath('global','hutang'))},
  readEmployeeAdvances(){return readValue(db,posPath('global','kasbonKaryawan'))}
})}
