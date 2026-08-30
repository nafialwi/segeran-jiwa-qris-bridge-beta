function n(v){v=Number(v);return Number.isFinite(v)?v:0}
export function remainingDebt(row={}){
  if(row.remaining!==null&&row.remaining!==undefined)return Math.max(0,n(row.remaining));
  const total=n(row.originalAmount??row.nominal??row.nom),paid=n(row.paid);
  return Math.max(0,total-paid);
}
export function outstandingFor(rows,name){
  const target=String(name||'').trim().toLowerCase();if(!target)return 0;
  return (rows||[]).filter(row=>String(row?.nama||'').trim().toLowerCase()===target).reduce((sum,row)=>sum+remainingDebt(row),0);
}
export function createDebtService({bridge}={}){
  if(!bridge)throw new Error('DEBT_BRIDGE_REQUIRED');
  return Object.freeze({
    remainingDebt,
    outstandingFor,
    async openCustomerPayment(key){return await bridge.call('lunasiHutang',key)},
    async openEmployeeAdvancePayment(key){return await bridge.call('lunasiKasbonKaryawan',key)},
    async saveEmployeeAdvance(){return await bridge.call('simpanKasbonKaryawan')}
  });
}
