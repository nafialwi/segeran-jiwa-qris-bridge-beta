const MUTATION_RE=/\.(set|update|transaction|remove)\s*\(/g;
const REMOVE_RE=/\.remove\s*\(/g;

export const APPROVED_MUTATION_FILES=Object.freeze([
  'src/data/writers/finance-writer.js',
  'src/data/writers/qris-cash-out-coordinator.js',
  'src/data/writers/purchase-reconciliation-writer.js'
]);
const APPROVED=new Set(APPROVED_MUTATION_FILES);
const add=(out,code,detail)=>out.push({code,detail});
const methodsOf=source=>[...String(source).matchAll(MUTATION_RE)].map(m=>m[1]);

function validateFinanceWriter(source,out){
  const methods=methodsOf(source);
  for(const method of methods)if(method!=='transaction')add(out,'FINANCE_WRITER_METHOD_CONTRACT',method);
  const allowed=[
    /^\s*['"]global['"]\s*,\s*['"]financeV1['"]\s*,\s*['"]ownerEvents['"]\s*,/,
    /^\s*['"]global['"]\s*,\s*['"]financeV1['"]\s*,\s*['"]monthCloseEvents['"]\s*,/
  ];
  for(const match of String(source).matchAll(/posPath\(([^)]*)\)/g)){
    if(!allowed.some(re=>re.test(match[1])))add(out,'FINANCE_WRITER_PATH_CONTRACT',match[0]);
  }
  if(/db\.ref\s*\(\s*['"`]/.test(source))add(out,'FINANCE_WRITER_PATH_CONTRACT','direct literal db.ref path');
}

function validateQrisCoordinator(source,out){
  const methods=methodsOf(source);
  for(const method of methods)if(!['transaction','update'].includes(method))add(out,'QRIS_CASH_OUT_METHOD_CONTRACT',method);
  const helperContracts=[
    /journalPath\s*=\s*providerId\s*=>\s*posPath\(\s*['"]global['"]\s*,\s*['"]financeV1['"]\s*,\s*['"]qrisCashOut['"]\s*,\s*providerId\s*\)/,
    /signalPath\s*=\s*providerId\s*=>\s*qrisPath\(\s*['"]signals['"]\s*,\s*providerId\s*\)/,
    /pendingPath\s*=\s*pendingId\s*=>\s*qrisPath\(\s*['"]pending['"]\s*,\s*pendingId\s*\)/
  ];
  if(String(source).includes('createQrisCashOutCoordinator')){
    for(const re of helperContracts)if(!re.test(source))add(out,'QRIS_CASH_OUT_PATH_CONTRACT',String(re));
  }
  for(const match of String(source).matchAll(/db\.ref\s*\(([^)]*)\)\s*\.\s*(transaction|update|set|remove)\s*\(/g)){
    const expr=match[1].trim(),method=match[2];
    const allowedExpr=/^(?:signalPath\(|pendingPath\(|journalPath\(|['"]{2})/.test(expr);
    if(!allowedExpr)add(out,'QRIS_CASH_OUT_PATH_CONTRACT',`${method}:${expr}`);
  }
  const forbiddenRootWrites=[
    /\$\{POS_ROOT\}\/global\/(?!financeV1\/qrisCashOut)/,
    /\$\{QRIS_ROOT\}\/(?!signals\/|pending\/)/
  ];
  for(const re of forbiddenRootWrites)if(re.test(source))add(out,'QRIS_CASH_OUT_PATH_CONTRACT',String(re));
}


function validatePurchaseReconciliationWriter(source,out){
  const methods=methodsOf(source);
  for(const method of methods)if(method!=='transaction')add(out,'PURCHASE_RECONCILIATION_METHOD_CONTRACT',method);
  const required=[
    /inventoryRootPath\s*=\s*\(\)\s*=>\s*posPath\(\s*['"]global['"]\s*,\s*['"]inventoryV2['"]\s*\)/,
    /reconciliationPath\s*=.*posPath\(\s*['"]global['"]\s*,\s*['"]inventoryV2['"]\s*,\s*['"]purchaseReconciliations['"]\s*,/,
    /expensePath\s*=.*posPath\(\s*shift\s*,\s*['"]opex['"]\s*,/
  ];
  for(const re of required)if(!re.test(source))add(out,'PURCHASE_RECONCILIATION_PATH_CONTRACT',String(re));
  for(const match of String(source).matchAll(/db\.ref\s*\(([^)]*)\)\s*\.\s*(transaction|set|update|remove)\s*\(/g)){
    const expr=match[1].trim(),method=match[2];
    if(!/^(?:inventoryRootPath\(\)|reconciliationPath\(|expensePath\()/.test(expr))add(out,'PURCHASE_RECONCILIATION_PATH_CONTRACT',`${method}:${expr}`);
  }
}

export function validateMutationSource(relativePath,source){
  const rel=String(relativePath||'').replaceAll('\\','/'),text=String(source||''),out=[];
  const methods=methodsOf(text);
  if(REMOVE_RE.test(text))add(out,'DESTRUCTIVE_REMOVE_FORBIDDEN',rel);
  REMOVE_RE.lastIndex=0;
  if(!methods.length)return out;
  if(!APPROVED.has(rel)){add(out,'UNAUTHORIZED_MUTATION_FILE',rel);return out}
  if(rel==='src/data/writers/finance-writer.js')validateFinanceWriter(text,out);
  if(rel==='src/data/writers/qris-cash-out-coordinator.js')validateQrisCoordinator(text,out);
  if(rel==='src/data/writers/purchase-reconciliation-writer.js')validatePurchaseReconciliationWriter(text,out);
  return out;
}
