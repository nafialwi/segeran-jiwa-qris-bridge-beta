import { safeProfit } from './costing-service.js';
function need(core,name){const fn=core?.[name];if(typeof fn!=='function')throw new Error(`REPORT_CORE_METHOD_MISSING:${name}`);return fn.bind(core)}
export function createReportService({legacyCore}={}){
  if(!legacyCore)throw new Error('REPORT_CORE_REQUIRED');
  return Object.freeze({
    priceFromTx(tx){return need(legacyCore,'priceFromTx')(tx)},
    transactionDetail(tx){return need(legacyCore,'transactionDetail')(tx)},
    purchaseDetail(purchase,...args){return need(legacyCore,'purchaseDetail')(purchase,...args)},
    debtDetail(debt,payments=[]){return need(legacyCore,'debtDetail')(debt,payments)},
    profitability(netRevenue,hpp){return safeProfit(netRevenue,hpp)}
  });
}
