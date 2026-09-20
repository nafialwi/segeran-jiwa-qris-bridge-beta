import { isDeepStrictEqual } from 'node:util';

const POS='toko_segeranjiwa_v58';
const clone=v=>JSON.parse(JSON.stringify(v));
const active=`root.child('${POS}/global/authUsers').child(auth.uid).child('active').val() === true`;
const role=`root.child('${POS}/global/authUsers').child(auth.uid).child('role').val()`;
const username=`root.child('${POS}/global/authUsers').child(auth.uid).child('username').val()`;
const signed=`auth != null && ${active}`;
const saleRole=`(${role} === 'transaksi' || ${role} === 'manajemen')`;
const ownerRole=`${role} === 'manajemen'`;

const get=(root,path)=>path.reduce((v,k)=>v?.[k],root);
const ensure=(root,path)=>{
  let v=root;
  for(const k of path)v=v[k]??={};
  return v;
};

const INV_PATH=['rules',POS,'global','inventoryV2'];

export const MAPPING_RULE={
  '.read':`${signed} && ${saleRole}`,
  '$productId':{
    '.write':`${signed} && ${ownerRole}`,
    '$stockItemId':{
      '.validate':`newData.hasChildren(['stockItemId','qtyPerUnit','active']) && newData.child('stockItemId').val() === $stockItemId && newData.child('qtyPerUnit').isNumber() && newData.child('qtyPerUnit').val() > 0 && newData.child('active').isBoolean()`
    }
  }
};

const txCompleted=`root.child('${POS}').child(newData.child('shiftKey').val()).child('tx').child(newData.child('txId').val()).child('status').val() === 'COMPLETED'`;
const sameCore=`newData.child('id').val() === data.child('id').val() && newData.child('kind').val() === data.child('kind').val() && newData.child('shiftKey').val() === data.child('shiftKey').val() && newData.child('txId').val() === data.child('txId').val() && newData.child('snapshotSeal').val() === data.child('snapshotSeal').val() && newData.child('createdBy').val() === data.child('createdBy').val() && newData.child('createdAt').val() === data.child('createdAt').val()`;

export const APPLICATION_WRITE=`${signed} && ${saleRole} && newData.exists() && ((!data.exists() && newData.child('id').val() === $applicationId && newData.child('kind').val() === 'SALE' && newData.child('status').val() === 'CLAIMED' && newData.child('shiftKey').isString() && newData.child('txId').isString() && newData.child('snapshot/shiftKey').val() === newData.child('shiftKey').val() && newData.child('snapshot/txId').val() === newData.child('txId').val() && newData.child('snapshotSeal').isString() && newData.child('snapshotSeal').val().length > 4 && newData.child('createdBy').val() === ${username} && newData.child('createdAt').isNumber() && ${txCompleted}) || (data.exists() && ${sameCore} && (newData.child('status').val() === 'CLAIMED' || newData.child('status').val() === 'COMPLETED' || newData.child('status').val() === 'SHORTAGE' || newData.child('status').val() === 'ERROR')))`;

export const APPLICATION_RULE={
  '.read':`${signed} && ${saleRole}`,
  '$applicationId':{
    '.write':APPLICATION_WRITE
  }
};

const marker=`newData.child('stockComponentOps').child(newData.child('lastOp').val())`;
const app=`root.child('${POS}/global/inventoryV2/stockApplications').child(${marker}.child('applicationId').val())`;
const markerBase=`newData.child('lastOp').isString() && ${marker}.exists() && ${marker}.child('applicationId').isString() && ${marker}.child('qty').isNumber() && ${marker}.child('qty').val() > 0 && ${app}.exists()`;
const applied=`${marker}.child('state').val() === 'APPLIED' && ((data.child('outlet').val() - newData.child('outlet').val() === ${marker}.child('qty').val() && ${app}.child('status').val() === 'CLAIMED') || (newData.child('outlet').val() - data.child('outlet').val() === ${marker}.child('qty').val() && ${marker}.child('restoreId').isString() && ${app}.child('status').val() === 'COMPLETED'))`;
const shortage=`${marker}.child('state').val() === 'SHORTAGE' && newData.child('outlet').val() === data.child('outlet').val() && data.child('lastOp').val() !== newData.child('lastOp').val() && ${app}.child('status').val() === 'CLAIMED'`;
const rolledBack=`${marker}.child('state').val() === 'ROLLED_BACK' && newData.child('outlet').val() - data.child('outlet').val() === ${marker}.child('qty').val() && (${app}.child('status').val() === 'CLAIMED' || ${app}.child('status').val() === 'SHORTAGE')`;

export const BALANCE_WRITE=`${signed} && ${saleRole} && newData.exists() && data.exists() && newData.child('outlet').isNumber() && newData.child('outlet').val() >= 0 && data.child('outlet').isNumber() && newData.child('warehouse').isNumber() && data.child('warehouse').isNumber() && newData.child('warehouse').val() === data.child('warehouse').val() && ${markerBase} && ((${applied}) || (${shortage}) || (${rolledBack}))`;

const markerApplication=`root.child('${POS}/global/inventoryV2/stockApplications').child(newData.child('applicationId').val())`;
const markerCoreSame=`newData.child('applicationId').val() === data.child('applicationId').val() && newData.child('qty').val() === data.child('qty').val() && newData.child('at').val() === data.child('at').val() && newData.child('restoreId').val() === data.child('restoreId').val() && newData.child('kind').val() === data.child('kind').val()`;
export const STOCK_COMPONENT_OP_VALIDATE=`newData.exists() && newData.child('applicationId').isString() && newData.child('qty').isNumber() && newData.child('qty').val() > 0 && newData.child('at').isNumber() && ${markerApplication}.exists() && ((!data.exists() && ((newData.child('state').val() === 'SHORTAGE' && ${markerApplication}.child('status').val() === 'CLAIMED') || (newData.child('state').val() === 'APPLIED' && ((!newData.child('restoreId').exists() && ${markerApplication}.child('status').val() === 'CLAIMED') || (newData.child('restoreId').isString() && ${markerApplication}.child('status').val() === 'COMPLETED'))))) || (data.exists() && ((${markerCoreSame} && newData.child('state').val() === data.child('state').val()) || (${markerCoreSame} && data.child('state').val() === 'APPLIED' && newData.child('state').val() === 'ROLLED_BACK' && newData.child('rolledBackAt').isNumber()))))`;

const moveApp=`root.child('${POS}/global/inventoryV2/stockApplications').child(newData.child('applicationId').val())`;
export const MOVEMENT_WRITE=`${signed} && ${saleRole} && !data.exists() && newData.exists() && newData.child('id').val() === $movementId && newData.child('itemType').val() === 'ingredient' && newData.child('itemId').isString() && newData.child('location').val() === 'outlet' && newData.child('applicationId').isString() && ${moveApp}.exists() && ((newData.child('type').val() === 'SALE_COMPONENT' && newData.child('delta').isNumber() && newData.child('delta').val() < 0 && (${moveApp}.child('status').val() === 'CLAIMED' || ${moveApp}.child('status').val() === 'COMPLETED')) || ((newData.child('type').val() === 'REFUND_COMPONENT' || newData.child('type').val() === 'VOID_COMPONENT') && newData.child('delta').isNumber() && newData.child('delta').val() > 0 && ${moveApp}.child('status').val() === 'COMPLETED'))`;

function appendOr(oldRule,newRule){
  if(typeof oldRule!=='string'||!oldRule.trim())return newRule;
  if(oldRule.includes(newRule))return oldRule;
  return `((${oldRule})) || ((${newRule}))`;
}

export function diffRuleScalars(before,after){
  const out=[];
  function walk(a,b,path=[]){
    if(isDeepStrictEqual(a,b))return;
    const ao=a&&typeof a==='object'&&!Array.isArray(a);
    const bo=b&&typeof b==='object'&&!Array.isArray(b);
    if(ao||bo){
      const keys=[...new Set([...(ao?Object.keys(a):[]),...(bo?Object.keys(b):[])])].sort();
      for(const k of keys)walk(ao?a[k]:undefined,bo?b[k]:undefined,[...path,k]);
      return;
    }
    out.push({path:path.join('/'),before:a,after:b});
  }
  walk(before,after);
  return out.sort((a,b)=>a.path.localeCompare(b.path));
}

export function applyStockComponentRules(live){
  const candidate=clone(live);
  const inv=get(candidate,INV_PATH);
  if(!inv||typeof inv!=='object')throw new Error('R10_RULES_INVENTORY_V2_MISSING');

  inv.productStockComponents=clone(MAPPING_RULE);
  inv.stockApplications=clone(APPLICATION_RULE);

  const ingredient=inv?.balances?.ingredients?.['$ingredientId'];
  if(!ingredient||typeof ingredient!=='object')throw new Error('R10_RULES_INGREDIENT_BALANCE_RULE_MISSING');
  ingredient['.write']=appendOr(ingredient['.write'],BALANCE_WRITE);
  const opRules=ingredient.stockComponentOps??(ingredient.stockComponentOps={});
  if(typeof opRules!=='object')throw new Error('R10_RULES_STOCK_COMPONENT_OPS_INVALID');
  const opNode=opRules['$operationId']??(opRules['$operationId']={});
  if(typeof opNode!=='object')throw new Error('R10_RULES_STOCK_COMPONENT_OP_DYNAMIC_NODE_INVALID');
  opNode['.validate']=STOCK_COMPONENT_OP_VALIDATE;

  const movements=inv.movements??(inv.movements={});
  if(typeof movements!=='object')throw new Error('R10_RULES_MOVEMENTS_INVALID');
  const dyn=Object.keys(movements).find(k=>k.startsWith('$'))||'$movementId';
  const mnode=movements[dyn]??(movements[dyn]={});
  if(typeof mnode!=='object')throw new Error('R10_RULES_MOVEMENT_DYNAMIC_NODE_INVALID');
  const movementExpr=MOVEMENT_WRITE.replaceAll('$movementId',dyn);
  mnode['.write']=appendOr(mnode['.write'],movementExpr);

  return candidate;
}

export function verifyStockComponentRulesCandidate(live,candidate){
  const diffs=diffRuleScalars(live,candidate);
  const changed=diffs.map(x=>x.path);
  const prefix=`rules/${POS}/global/inventoryV2/`;
  const allowed=changed.every(p=>
    p.startsWith(prefix+'productStockComponents/') ||
    p.startsWith(prefix+'stockApplications/') ||
    p===prefix+'balances/ingredients/$ingredientId/.write' ||
    p===prefix+'balances/ingredients/$ingredientId/stockComponentOps/$operationId/.validate' ||
    (p.startsWith(prefix+'movements/')&&p.endsWith('/.write'))
  );
  const forbiddenParallel=JSON.stringify(candidate).match(/global\/(?:stockBalances|stockMovements|stockApplications|productStockComponents)/);
  return Object.freeze({
    ok:allowed&&!forbiddenParallel,
    diffCount:diffs.length,
    changedPaths:changed,
    unexpectedPaths:allowed?[]:changed.filter(p=>!p.startsWith(prefix)),
    deployCommandCount:0,
    productionMutationCount:0
  });
}

export function mappingWriteAllowedModel({role,active=true,qty=1,authenticated=true}={}){
  return !!(authenticated&&active&&['manajemen'].includes(String(role||'').toLowerCase())&&Number.isFinite(Number(qty))&&Number(qty)>0);
}

export function balanceTransitionAllowedModel({role,active=true,authenticated=true,before={},after={},marker={},application={}}={}){
  if(!authenticated||!active||!['transaksi','manajemen'].includes(String(role||'').toLowerCase()))return false;
  if(!Number.isFinite(Number(before.outlet))||!Number.isFinite(Number(after.outlet))||Number(after.outlet)<0)return false;
  if(Number(before.warehouse)!==Number(after.warehouse))return false;
  const qty=Number(marker.qty);
  if(!Number.isFinite(qty)||qty<=0||!application?.status)return false;
  if(marker.state==='SHORTAGE')return Number(after.outlet)===Number(before.outlet)&&application.status==='CLAIMED';
  if(marker.state==='ROLLED_BACK')return Number(after.outlet)-Number(before.outlet)===qty&&['CLAIMED','SHORTAGE'].includes(application.status);
  if(marker.state==='APPLIED'&&marker.restoreId)return Number(after.outlet)-Number(before.outlet)===qty&&application.status==='COMPLETED';
  if(marker.state==='APPLIED')return Number(before.outlet)-Number(after.outlet)===qty&&application.status==='CLAIMED';
  return false;
}
