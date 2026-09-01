import { renderFilledIcon } from './icons.js';

function replaceIcon(node,name,label){
  if(!node)return false;
  if(node.dataset?.ref01SemanticIcon===name)return false;
  node.innerHTML=renderFilledIcon(name,{size:18,label});
  if(node.dataset)node.dataset.ref01SemanticIcon=name;
  return true;
}

export function decorateStockReferenceSurface(document){
  const page=document?.querySelector?.('.sjvc02-stock');
  if(!page)return Object.freeze({stock:false,kpis:0,header:false});
  page.dataset.ref03Stock='true';
  const header=page.querySelector?.('.sjvc02-child-head');
  if(header)header.dataset.ref03Header='back-title-help';
  let kpis=0;
  const total=page.querySelector?.('.sjvc02-stock-kpi:not(.warn):not(.danger) .sjvc02-stock-icon');
  if(total&&replaceIcon(total,'warehouse-box','Total Item'))kpis++;
  const warn=page.querySelector?.('.sjvc02-stock-kpi.warn .sjvc02-stock-icon');
  if(warn&&replaceIcon(warn,'warning-triangle','Stok Menipis'))kpis++;
  const danger=page.querySelector?.('.sjvc02-stock-kpi.danger .sjvc02-stock-icon');
  if(danger&&replaceIcon(danger,'x-circle','Habis'))kpis++;
  const safe=[...page.querySelectorAll?.('.sjvc02-stock-kpi:not(.warn):not(.danger) .sjvc02-stock-icon')||[]][1];
  if(safe&&replaceIcon(safe,'check-circle','Aman'))kpis++;
  const actions=page.querySelector?.('.sjvc02-stock-actions');
  if(actions)actions.dataset.ref03Actions='restock-adjust-history-warehouse';
  return Object.freeze({stock:true,kpis,header:Boolean(header)});
}
