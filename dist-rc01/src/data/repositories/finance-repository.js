import { POS_ROOT, QRIS_ROOT, posPath, qrisPath } from '../firebase-client.js';
import { readValue } from './_read.js';


function safeSegment(value,code){
  const v=String(value||'').trim();if(!v||v.includes('/'))throw new Error(code);return v;
}
function safeShiftKey(value){const v=String(value||'').trim();if(!/^\d{4}-\d{2}-\d{2}-S[123]$/.test(v))throw new Error('INVALID_SHIFT_KEY');return v}

async function queryMonth(db,month){
  if(!db||typeof db.ref!=='function')throw new Error('RTDB_READ_CLIENT_REQUIRED');
  const prefix=String(month||'');
  if(!/^\d{4}-\d{2}$/.test(prefix))throw new Error('INVALID_FINANCE_MONTH');
  const snap=await db.ref(POS_ROOT).orderByKey().startAt(prefix).endAt(prefix+'\uf8ff').once('value');
  return snap&&typeof snap.val==='function'?snap.val()||{}:{};
}

export function createFinanceRepository({db}={}){
  return Object.freeze({
    readMonthShifts(month){return queryMonth(db,month)},
    readInventoryPurchases(){return readValue(db,posPath('global','inventoryV2','purchases'))},
    readInventoryPurchase(purchaseId){return readValue(db,posPath('global','inventoryV2','purchases',safeSegment(purchaseId,'PURCHASE_AUDIT_ID_REQUIRED')))},
    readInventoryV2(){return readValue(db,posPath('global','inventoryV2'))},
    readCostingReservations(){return readValue(db,posPath('global','inventoryV2','costingReservations'))},
    readPurchaseReconciliations(){return readValue(db,posPath('global','inventoryV2','purchaseReconciliations'))},
    readInventoryMovement(movementId){return readValue(db,posPath('global','inventoryV2','movements',safeSegment(movementId,'PURCHASE_MOVEMENT_ID_REQUIRED')))},
    readShiftExpense(shiftKey,expenseId){return readValue(db,posPath(safeShiftKey(shiftKey),'opex',safeSegment(expenseId,'PURCHASE_EXPENSE_ID_REQUIRED')))},
    readShift(shiftKey){return readValue(db,posPath(safeShiftKey(shiftKey)))},
    readRefunds(){return readValue(db,posPath('global','refunds'))},
    readCustomerDebts(){return readValue(db,posPath('global','hutang'))},
    readEmployeeAdvances(){return readValue(db,posPath('global','kasbonKaryawan'))},
    readQrisSignals(){return readValue(db,qrisPath('signals'))},
    readQrisEvents(){return readValue(db,qrisPath('events'))},
    readOwnerEvents(period){
      const p=String(period||'');if(!/^\d{4}-\d{2}$/.test(p))throw new Error('INVALID_FINANCE_MONTH');
      return readValue(db,posPath('global','financeV1','ownerEvents',p));
    },
    readMonthCloseEvents(period){
      const p=String(period||'');if(!/^\d{4}-\d{2}$/.test(p))throw new Error('INVALID_FINANCE_MONTH');
      return readValue(db,posPath('global','financeV1','monthCloseEvents',p));
    },
    readQrisCashOut(){return readValue(db,posPath('global','financeV1','qrisCashOut'))},
    roots:Object.freeze({pos:POS_ROOT,qris:QRIS_ROOT})
  });
}
