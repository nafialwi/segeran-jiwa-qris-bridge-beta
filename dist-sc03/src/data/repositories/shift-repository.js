import { posPath } from '../firebase-client.js';
import { readValue } from './_read.js';
export function createShiftRepository({db}={}){return Object.freeze({
  readShift(shiftKey){return readValue(db,posPath(shiftKey))},
  readSessions(shiftKey){return readValue(db,posPath(shiftKey,'sessions'))},
  readSessionControl(shiftKey){return readValue(db,posPath(shiftKey,'sessionControl'))}
})}
