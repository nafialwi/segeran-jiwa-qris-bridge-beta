import { isDeepStrictEqual } from 'node:util';

const POS_ROOT='toko_segeranjiwa_v58';
export const RESERVATION_PATH=['rules',POS_ROOT,'global','inventoryV2','reservations','$reservationId'];
const clone=value=>JSON.parse(JSON.stringify(value));
const get=(root,path)=>path.reduce((value,key)=>value?.[key],root);

const ACTIVE="root.child('toko_segeranjiwa_v58/global/authUsers').child(auth.uid).child('active').val() === true";
const ROLE="(root.child('toko_segeranjiwa_v58/global/authUsers').child(auth.uid).child('role').val() === 'transaksi' || root.child('toko_segeranjiwa_v58/global/authUsers').child(auth.uid).child('role').val() === 'manajemen')";
const USERNAME="root.child('toko_segeranjiwa_v58/global/authUsers').child(auth.uid).child('username').val()";
const AUTH=`auth != null && ${ACTIVE} && ${ROLE}`;
const OWNER=`data.parent().exists() && data.parent().child('cashierId').val() === ${USERNAME} && newData.parent().child('cashierId').val() === data.parent().child('cashierId').val() && newData.parent().child('id').val() === data.parent().child('id').val() && newData.parent().child('shift').val() === data.parent().child('shift').val()`;
const BASE=`${AUTH} && ${OWNER}`;
const OLD_STATUS="data.parent().child('status').val()";
const NEW_STATUS="newData.parent().child('status').val()";

export const CREATE_RULE=`${AUTH} && !data.exists() && newData.exists() && newData.child('id').val() === $reservationId && newData.child('cashierId').val() === ${USERNAME} && newData.child('status').val() === 'PREPARING' && newData.child('consumption').exists()`;

export const STATUS_RULE=`${BASE} && newData.isString() && ((data.val() === 'PREPARING' && newData.val() === 'RESERVED' && newData.parent().child('reservedAt').isString() && newData.parent().child('reservedTs').isNumber() && newData.parent().child('reservedItems').exists()) || ((data.val() === 'PREPARING' || data.val() === 'RESERVED') && newData.val() === 'ROLLED_BACK' && newData.parent().child('rollbackReason').isString() && newData.parent().child('rolledBackAt').isString()) || (data.val() === 'RESERVED' && newData.val() === 'COMMITTED' && newData.parent().child('txId').isString() && newData.parent().child('committedAt').isString() && newData.parent().child('committedTs').isNumber()) || (data.val() === 'RESERVED' && newData.val() === 'COMMIT_UNCERTAIN' && newData.parent().child('txId').isString() && newData.parent().child('commitError').isString() && newData.parent().child('commitErrorAt').isString()))`;

const transitionRule=(from,to,typeCheck)=>`${BASE} && ${OLD_STATUS} === '${from}' && ${NEW_STATUS} === '${to}' && ${typeCheck}`;
const rollbackRule=typeCheck=>`${BASE} && (${OLD_STATUS} === 'PREPARING' || ${OLD_STATUS} === 'RESERVED') && ${NEW_STATUS} === 'ROLLED_BACK' && ${typeCheck}`;
const commitRule=typeCheck=>`${BASE} && ${OLD_STATUS} === 'RESERVED' && ${NEW_STATUS} === 'COMMITTED' && ${typeCheck}`;
const uncertainRule=typeCheck=>`${BASE} && ${OLD_STATUS} === 'RESERVED' && ${NEW_STATUS} === 'COMMIT_UNCERTAIN' && ${typeCheck}`;

export const LIFECYCLE_RULES=Object.freeze({
  status:STATUS_RULE,
  reservedAt:transitionRule('PREPARING','RESERVED','newData.isString()'),
  reservedTs:transitionRule('PREPARING','RESERVED','newData.isNumber()'),
  reservedItems:transitionRule('PREPARING','RESERVED','newData.exists()'),
  advisoryFallback:transitionRule('PREPARING','RESERVED','newData.isBoolean() && newData.val() === true'),
  advisoryReason:transitionRule('PREPARING','RESERVED','newData.isString()'),
  rollbackReason:rollbackRule('newData.isString()'),
  rolledBackAt:rollbackRule('newData.isString()'),
  rolledBackTs:rollbackRule('newData.isNumber()'),
  txId:`${BASE} && ${OLD_STATUS} === 'RESERVED' && (${NEW_STATUS} === 'COMMITTED' || ${NEW_STATUS} === 'COMMIT_UNCERTAIN') && newData.isString()`,
  committedAt:commitRule('newData.isString()'),
  committedTs:commitRule('newData.isNumber()'),
  commitError:uncertainRule('newData.isString()'),
  commitErrorAt:uncertainRule('newData.isString()')
});

const IMMUTABLE_KEYS=Object.freeze(['id','shift','cashierId','cashierName','consumption','estimatedConsumption','shortageConsumption','estimateMode','createdAt','ts']);
const ALLOWED_KEYS=new Set([...IMMUTABLE_KEYS,'status',...Object.keys(LIFECYCLE_RULES)]);

export function reservationCreateAllowed({user,row,key}={}){
  return !!(user?.authenticated&&user?.active===true&&['transaksi','manajemen'].includes(user?.role)&&row&&String(row.id||'')===String(key||'')&&String(row.cashierId||'')===String(user.username||'')&&row.status==='PREPARING'&&row.consumption&&typeof row.consumption==='object');
}

export function reservationTransitionAllowed({user,before,after}={}){
  if(!user?.authenticated||user?.active!==true||!['transaksi','manajemen'].includes(user?.role)||!before||!after)return false;
  if(String(before.cashierId||'')!==String(user.username||''))return false;
  if(!IMMUTABLE_KEYS.every(key=>isDeepStrictEqual(before[key],after[key])))return false;
  if(Object.keys(after).some(key=>!ALLOWED_KEYS.has(key)))return false;
  const from=String(before.status||''),to=String(after.status||'');
  if(from==='PREPARING'&&to==='RESERVED')return typeof after.reservedAt==='string'&&Number.isFinite(Number(after.reservedTs))&&after.reservedItems!=null;
  if((from==='PREPARING'||from==='RESERVED')&&to==='ROLLED_BACK')return typeof after.rollbackReason==='string'&&typeof after.rolledBackAt==='string';
  if(from==='RESERVED'&&to==='COMMITTED')return typeof after.txId==='string'&&typeof after.committedAt==='string'&&Number.isFinite(Number(after.committedTs));
  if(from==='RESERVED'&&to==='COMMIT_UNCERTAIN')return typeof after.txId==='string'&&typeof after.commitError==='string'&&typeof after.commitErrorAt==='string';
  return false;
}

function hasStructuredConsumptionValComparison(rule){
  return /newData\.child\('consumption'\)\.val\(\)\s*===?\s*data\.child\('consumption'\)\.val\(\)/.test(String(rule||''));
}

function assertSupportedBaseline(rules){
  if(!rules||typeof rules!=='object'||!rules.rules)throw new Error('CUP02_RULES_ROOT_MISSING');
  const node=get(rules,RESERVATION_PATH);
  if(!node||typeof node!== 'object'||typeof node['.write']!=='string')throw new Error('CUP02_RESERVATION_RULE_MISSING');
  if(isCup02Aligned(node))return;
  const write=node['.write'];
  for(const token of ["newData.child('status').val() === 'PREPARING'","data.child('status').val() === 'PREPARING'","newData.child('status').val() === 'RESERVED'","newData.child('status').val() === 'COMMITTED'","newData.child('status').val() === 'COMMIT_UNCERTAIN'"]){
    if(!write.includes(token))throw new Error('CUP02_UNSUPPORTED_RESERVATION_RULE_BASELINE');
  }
  if(!hasStructuredConsumptionValComparison(write))throw new Error('CUP02_EXPECTED_SENTINEL_DEFECT_NOT_FOUND');
  if(node.consumption?.['.write'])throw new Error('CUP02_UNEXPECTED_CONSUMPTION_WRITE_AUTHORITY');
}

export function isCup02Aligned(node){
  if(!node||node['.write']!==CREATE_RULE)return false;
  if(hasStructuredConsumptionValComparison(node['.write']))return false;
  if(node.consumption?.['.write'])return false;
  return Object.entries(LIFECYCLE_RULES).every(([key,rule])=>node?.[key]?.['.write']===rule);
}

export function applyCup02AuthzRules(liveRules){
  assertSupportedBaseline(liveRules);
  const current=get(liveRules,RESERVATION_PATH);
  if(isCup02Aligned(current))return clone(liveRules);
  const candidate=clone(liveRules);
  const target=get(candidate,RESERVATION_PATH);
  target['.write']=CREATE_RULE;
  for(const [key,rule] of Object.entries(LIFECYCLE_RULES))target[key]={...(target[key]||{}),'.write':rule};
  return candidate;
}

export function diffRuleScalars(before,after){
  const out=[];
  function walk(a,b,path=[]){
    if(isDeepStrictEqual(a,b))return;
    const aObj=a&&typeof a==='object'&&!Array.isArray(a);
    const bObj=b&&typeof b==='object'&&!Array.isArray(b);
    if(aObj||bObj){
      const keys=[...new Set([...(aObj?Object.keys(a):[]),...(bObj?Object.keys(b):[])])].sort();
      for(const key of keys)walk(aObj?a[key]:undefined,bObj?b[key]:undefined,[...path,key]);
      return;
    }
    out.push({path:path.join('/'),before:a,after:b});
  }
  walk(before,after);
  return out.sort((a,b)=>a.path.localeCompare(b.path));
}

export function verifyCup02AuthzCandidate(liveRules,candidateRules){
  assertSupportedBaseline(liveRules);
  const after=get(candidateRules,RESERVATION_PATH);
  if(!isCup02Aligned(after))throw new Error('CUP02_CANDIDATE_STRUCTURE_INVALID');
  const allowed=new Set([
    [...RESERVATION_PATH,'.write'].join('/'),
    ...Object.keys(LIFECYCLE_RULES).map(key=>[...RESERVATION_PATH,key,'.write'].join('/'))
  ]);
  const diffs=diffRuleScalars(liveRules,candidateRules);
  const changedPaths=diffs.map(x=>x.path);
  const unexpected=changedPaths.filter(path=>!allowed.has(path));
  const missing=[...allowed].filter(path=>!changedPaths.includes(path));
  const ok=unexpected.length===0&&missing.length===0&&changedPaths.length===allowed.size;
  return Object.freeze({
    ok,
    diffCount:diffs.length,
    changedPaths,
    unexpectedPaths:unexpected,
    missingPaths:missing,
    consumptionWriteAuthority:false,
    structuredValSentinel:false,
    publishGate:ok?'CANDIDATE_ONLY_EMULATOR_REQUIRED_NOT_PUBLISHED':'BLOCKED'
  });
}
