/** Pure extraction of v1.0.40 SJCostingCore plus null-safe report semantics. */
export function num(v){v=Number(v);return Number.isFinite(v)?v:0}
export function money(v){return Math.round((num(v)+Number.EPSILON)*100)/100}
export function landedCost(goodsCost,fees,supplierDiscount){
  goodsCost=Math.max(0,num(goodsCost));fees=Math.max(0,num(fees));supplierDiscount=Math.max(0,num(supplierDiscount));
  if(supplierDiscount>goodsCost+fees){const e=new Error('SUPPLIER_DISCOUNT_EXCEEDS_COST');e.code='SUPPLIER_DISCOUNT_EXCEEDS_COST';throw e}
  return money(goodsCost+fees-supplierDiscount);
}
export function movingWac(stockBefore,oldWac,qtyReceived,totalLandedCost){
  stockBefore=Math.max(0,num(stockBefore));oldWac=Math.max(0,num(oldWac));qtyReceived=num(qtyReceived);totalLandedCost=Math.max(0,num(totalLandedCost));
  if(qtyReceived<=0){const e=new Error('INVALID_PURCHASE_QTY');e.code='INVALID_PURCHASE_QTY';throw e}
  const stockAfter=stockBefore+qtyReceived,purchaseUnitCost=totalLandedCost/qtyReceived,newWac=((stockBefore*oldWac)+totalLandedCost)/stockAfter;
  return{stockBefore,stockAfter,oldWac:money(oldWac),purchaseUnitCost:money(purchaseUnitCost),newWac:money(newWac)};
}
export function stockLineCost(qty,wac){return money(Math.max(0,num(qty))*Math.max(0,num(wac)))}
export function recipeLineCost(recipeQty,ingredientWac,saleQty){return money(Math.max(0,num(recipeQty))*Math.max(0,num(ingredientWac))*Math.max(0,num(saleQty)))}
export function profit(netRevenue,cogs){netRevenue=money(netRevenue);cogs=money(cogs);const gp=money(netRevenue-cogs);return{netRevenue,cogs,grossProfit:gp,grossMargin:netRevenue>0?gp/netRevenue*100:0}}
export function aggregateTransactions(txs){
  const out={netRevenue:0,cogs:0,grossProfit:0,grossMargin:0,knownTransactions:0,unknownCostTransactions:0};
  (txs||[]).forEach(tx=>{if(!tx||String(tx.status||'').toUpperCase()==='VOIDED')return;if(!tx.costing||tx.costing.cogsTotal==null||tx.costing.costingKnown===false){out.unknownCostTransactions++;return}const refunded=tx.refundCostingTotals||{};out.netRevenue+=Math.max(0,num(tx.costing.netRevenue)-num(refunded.netRevenue));out.cogs+=Math.max(0,num(tx.costing.cogsTotal)-num(refunded.cogs));out.knownTransactions++});
  out.netRevenue=money(out.netRevenue);out.cogs=money(out.cogs);out.grossProfit=money(out.netRevenue-out.cogs);out.grossMargin=out.netRevenue>0?out.grossProfit/out.netRevenue*100:0;return out;
}
export function safeProfit(netRevenue,hpp){
  const revenue=money(netRevenue);
  if(hpp===null||hpp===undefined||hpp==='')return{netRevenue:revenue,hpp:null,grossProfit:null,grossMargin:null,costKnown:false};
  const cost=money(hpp),gp=money(revenue-cost);
  return{netRevenue:revenue,hpp:cost,grossProfit:gp,grossMargin:revenue>0?gp/revenue*100:0,costKnown:true};
}
