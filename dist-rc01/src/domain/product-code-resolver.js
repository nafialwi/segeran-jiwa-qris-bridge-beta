const CODE_FIELDS=Object.freeze(['barcode','sku','code','ean','gtin','productCode']);

export function normalizeProductCode(value){
  return String(value??'').normalize('NFKC').replace(/[\u0000-\u001F\u007F]/g,'').trim().toUpperCase();
}

function safeAliasTokens(value){
  const raw=normalizeProductCode(value);if(!raw)return [];
  const out=new Set([raw]);
  for(const token of raw.split(/[\s,:;|/\\]+/g)){
    const v=normalizeProductCode(token);if(v.length>=4)out.add(v);
  }
  for(const match of raw.matchAll(/(?:^|\D)(\d{8,18})(?=\D|$)/g)) out.add(match[1]);
  return [...out];
}

function primaryCodes(product){
  const out=[];
  for(const field of CODE_FIELDS){const value=normalizeProductCode(product?.[field]);if(value)out.push(value)}
  return [...new Set(out)];
}

export function productCodeAliases(product){
  const out=new Set();
  for(const field of CODE_FIELDS) for(const token of safeAliasTokens(product?.[field])) out.add(token);
  return [...out];
}

function result(status,extra={}){return Object.freeze({status,...extra})}

export function resolveProductCode(code,products=[]){
  const q=normalizeProductCode(code);if(!q)return result('miss',{code:q,matches:[]});
  const rows=Array.isArray(products)?products:[];
  const exact=rows.filter(product=>primaryCodes(product).includes(q));
  if(exact.length===1)return result('match',{code:q,product:exact[0],matches:exact,tier:'exact'});
  if(exact.length>1)return result('ambiguous',{code:q,matches:exact,tier:'exact'});
  const aliases=rows.filter(product=>productCodeAliases(product).includes(q));
  if(aliases.length===1)return result('match',{code:q,product:aliases[0],matches:aliases,tier:'alias'});
  if(aliases.length>1)return result('ambiguous',{code:q,matches:aliases,tier:'alias'});
  return result('miss',{code:q,matches:[]});
}

export function resolveScannedCandidates(candidates,products=[]){
  const unique=[...new Set((Array.isArray(candidates)?candidates:[]).map(normalizeProductCode).filter(Boolean))];
  const resolved=unique.map(code=>resolveProductCode(code,products));
  const exact=resolved.filter(x=>x.status==='match'&&x.tier==='exact');
  const exactProducts=[...new Map(exact.map(x=>[String(x.product?.id),x])).values()];
  if(exactProducts.length===1)return exactProducts[0];
  if(exactProducts.length>1)return result('ambiguous',{code:'',matches:exactProducts.map(x=>x.product),tier:'scan-exact'});
  const matches=resolved.filter(x=>x.status==='match');
  const uniqueProducts=[...new Map(matches.map(x=>[String(x.product?.id),x])).values()];
  if(uniqueProducts.length===1)return uniqueProducts[0];
  if(uniqueProducts.length>1)return result('ambiguous',{code:'',matches:uniqueProducts.map(x=>x.product),tier:'scan-alias'});
  const ambiguous=resolved.find(x=>x.status==='ambiguous');
  return ambiguous||result('miss',{code:unique[0]||'',matches:[],candidates:unique});
}
