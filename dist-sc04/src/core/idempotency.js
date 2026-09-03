const SAFE_ID=/^[A-Za-z0-9_-]{1,120}$/;

export function assertOperationId(value){
  const id=String(value??'').trim();
  if(!SAFE_ID.test(id)) throw new Error('INVALID_OPERATION_ID');
  return id;
}

export function createOperationId(prefix='OP',{now=()=>Date.now(),random=Math.random}={}){
  const safePrefix=String(prefix??'OP').trim().replace(/[^A-Za-z0-9_-]/g,'_').slice(0,24)||'OP';
  const ts=Math.max(0,Number(now())||0).toString(36).toUpperCase();
  const rand=Math.floor(Math.max(0,Math.min(0.999999999999,Number(random())||0))*0xFFFFFF).toString(36).toUpperCase().padStart(5,'0');
  return assertOperationId(`${safePrefix}-${ts}-${rand}`);
}

export const idempotencyContract=Object.freeze({safePattern:SAFE_ID.source,maxLength:120});
