import { hash as cryptoHash } from 'node:crypto';

export const LEGACY_CUP_CODES=Object.freeze([
  'c10','c10p','c16','c22p','c22d','c22o'
]);

const LEGACY_SET=new Set(LEGACY_CUP_CODES);
const text=value=>String(value??'').trim();
const clone=value=>value==null?value:JSON.parse(JSON.stringify(value));

function stable(value){
  if(Array.isArray(value))return value.map(stable);
  if(value&&typeof value==='object'){
    return Object.fromEntries(
      Object.keys(value).sort().map(key=>[key,stable(value[key])])
    );
  }
  return value;
}

function stableJson(value){
  return JSON.stringify(stable(value));
}

function sha256(value){
  return cryptoHash('sha256',stableJson(value),'hex');
}

function entries(value){
  if(Array.isArray(value)){
    return value.map((row,index)=>[text(row?.id||row?.productId||index),row]);
  }
  if(value&&typeof value==='object')return Object.entries(value);
  return [];
}

function normalizeCupRows(cupRows){
  const resolved=Object.create(null);
  const evidence=[];

  for(const [,raw] of entries(cupRows)){
    if(!raw||typeof raw!=='object')continue;
    const cupCode=text(raw.cupCode||raw.code||raw.cp).toLowerCase();
    const ingredientId=text(raw.ingredientId||raw.stockItemId||raw.id);
    if(!LEGACY_SET.has(cupCode)||!ingredientId)continue;

    const row={
      cupCode,
      ingredientId,
      outlet:Number.isFinite(Number(raw.outlet))?Number(raw.outlet):null,
      warehouse:Number.isFinite(Number(raw.warehouse))?Number(raw.warehouse):null
    };

    if(resolved[cupCode]&&resolved[cupCode].ingredientId!==ingredientId){
      throw Object.assign(
        new Error(`LEGACY_CUP_ROW_CONFLICT:${cupCode}`),
        {code:'LEGACY_CUP_ROW_CONFLICT',cupCode}
      );
    }

    resolved[cupCode]={cupCode,ingredientId};
    evidence.push(row);
  }

  evidence.sort((a,b)=>a.cupCode.localeCompare(b.cupCode));
  return {resolved,evidence};
}

function productIdOf(key,row){
  return text(row?.id||row?.productId||key);
}

function normalizeExistingMapping(mapping){
  if(!mapping||typeof mapping!=='object'||Array.isArray(mapping))return {};
  return clone(mapping)||{};
}

function sameLegacyCupRow(row,ingredientId){
  if(!row||typeof row!=='object')return false;
  return text(row.stockItemId||ingredientId)===ingredientId
    && Number(row.qtyPerUnit)===1
    && row.active!==false;
}

function invalid(productId,cp,reason){
  return Object.freeze({productId,cp,reason});
}

export function buildLegacyCupMigration({
  products={},
  cupRows=[],
  existingMappings={}
}={}){
  const {resolved,evidence}=normalizeCupRows(cupRows);
  const productMappings={};
  const invalidProducts=[];
  const unmapped=new Set();

  const sortedProducts=entries(products)
    .map(([key,row])=>[productIdOf(key,row),row])
    .filter(([productId])=>Boolean(productId))
    .sort((a,b)=>a[0].localeCompare(b[0]));

  for(const [productId,row] of sortedProducts){
    const cp=text(row?.cp).toLowerCase();
    if(!cp)continue;

    if(!LEGACY_SET.has(cp)){
      invalidProducts.push(invalid(productId,cp,'INVALID_CP'));
      continue;
    }

    const cup=resolved[cp];
    if(!cup){
      unmapped.add(cp);
      continue;
    }

    const current=normalizeExistingMapping(existingMappings?.[productId]);
    const existingSame=current[cup.ingredientId];
    if(existingSame&&!sameLegacyCupRow(existingSame,cup.ingredientId)){
      invalidProducts.push(invalid(productId,cp,'EXISTING_MAPPING_CONFLICT'));
      continue;
    }

    productMappings[productId]={
      ...current,
      [cup.ingredientId]:existingSame||{
        stockItemId:cup.ingredientId,
        qtyPerUnit:1,
        active:true,
        source:'LEGACY_CP_MIGRATION'
      }
    };
  }

  const sourceCupRows=evidence.map(row=>Object.freeze({...row}));
  const source={
    products:stable(products||{}),
    cupRows:stable(sourceCupRows),
    existingMappings:stable(existingMappings||{})
  };

  return Object.freeze({
    productMappings:Object.freeze(stable(productMappings)),
    resolvedCupItems:Object.freeze(stable(resolved)),
    sourceCupRows:Object.freeze(sourceCupRows),
    coverage:Object.freeze({
      mappedProducts:Object.keys(productMappings).length,
      unmappedCupCodes:Object.freeze([...unmapped].sort()),
      invalidProducts:Object.freeze(
        invalidProducts.sort((a,b)=>a.productId.localeCompare(b.productId))
      )
    }),
    sourceHash:sha256(source)
  });
}

export function validateMigrationPlan(plan={}){
  const errors=[];

  for(const key of ['stockItems','stockBalances','stockMovements','deletes','deletePaths']){
    if(Object.hasOwn(plan,key))errors.push(`FORBIDDEN_OUTPUT:${key}`);
  }

  if(!/^[0-9a-f]{64}$/.test(text(plan.sourceHash))){
    errors.push('SOURCE_HASH_INVALID');
  }

  const mappings=plan.productMappings&&typeof plan.productMappings==='object'
    ?plan.productMappings
    :{};

  for(const [productId,mapping] of Object.entries(mappings)){
    if(!productId||!mapping||typeof mapping!=='object'){
      errors.push(`PRODUCT_MAPPING_INVALID:${productId}`);
      continue;
    }

    for(const [stockItemId,row] of Object.entries(mapping)){
      if(!stockItemId||!row||typeof row!=='object'){
        errors.push(`COMPONENT_MAPPING_INVALID:${productId}:${stockItemId}`);
        continue;
      }
      if(text(row.stockItemId||stockItemId)!==stockItemId){
        errors.push(`COMPONENT_ID_MISMATCH:${productId}:${stockItemId}`);
      }
      if(row.source==='LEGACY_CP_MIGRATION'){
        if(Number(row.qtyPerUnit)!==1)errors.push(`LEGACY_QTY_INVALID:${productId}:${stockItemId}`);
        if(row.active!==true)errors.push(`LEGACY_ACTIVE_INVALID:${productId}:${stockItemId}`);
      }
    }
  }

  return Object.freeze({ok:errors.length===0,errors:Object.freeze(errors)});
}
