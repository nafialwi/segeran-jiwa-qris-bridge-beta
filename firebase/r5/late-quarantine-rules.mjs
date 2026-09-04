import { isDeepStrictEqual } from 'node:util';

const QRIS_ROOT='segeranjiwa_qris_beta_v1';
const SIGNAL_PATH=['rules',QRIS_ROOT,'signals','$signalId'];
const LATE_STATUSES=new Set(['LATE_AFTER_CANCEL','LATE_OR_NEW_AMBIGUOUS']);
const ELIGIBLE_STATUSES=new Set(['DETECTED','UNMATCHED','AMBIGUOUS']);
const LATE_FIELDS=new Set(['status','resolutionState','autoMatchBlocked','lateDetectedAt','lateCandidatePendingIds']);
const SAFE_ID=/^[A-Za-z0-9_-]{1,180}$/;

const clone=value=>JSON.parse(JSON.stringify(value));
const nil=value=>value==null;
const get=(obj,path)=>path.reduce((cur,key)=>cur?.[key],obj);

function stripLateFields(row){
  const out={};
  for(const [key,value] of Object.entries(row||{}))if(!LATE_FIELDS.has(key))out[key]=value;
  return out;
}
function safeCandidateIds(value){
  return Array.isArray(value)&&value.length>0&&value.every(id=>typeof id==='string'&&SAFE_ID.test(id));
}
function coreLateStateValid(row){
  return !!(row&&LATE_STATUSES.has(String(row.status||''))&&row.resolutionState==='REVIEW_REQUIRED'&&row.autoMatchBlocked===true&&Number.isFinite(Number(row.lateDetectedAt))&&Number(row.lateDetectedAt)>0&&safeCandidateIds(row.lateCandidatePendingIds)&&nil(row.matchedTransactionId)&&nil(row.matchedAt)&&nil(row.confirmedAt)&&nil(row.confirmedBy)&&nil(row.resolvedAt)&&nil(row.resolvedBy)&&nil(row.resolvedReason));
}

export function lateTransitionAllowed({user,before,after}={}){
  if(!user?.authenticated||user?.active!==true||!before||!after)return false;
  if(LATE_STATUSES.has(String(before.status||'')))return coreLateStateValid(before)&&isDeepStrictEqual(before,after);
  if(!ELIGIBLE_STATUSES.has(String(before.status||'DETECTED')))return false;
  if(!nil(before.matchedTransactionId)||!nil(before.matchedAt)||!nil(before.confirmedAt)||!nil(before.confirmedBy))return false;
  if(!nil(before.resolutionState)||!nil(before.resolvedAt)||!nil(before.resolvedBy)||!nil(before.resolvedReason))return false;
  if(!coreLateStateValid(after))return false;
  return isDeepStrictEqual(stripLateFields(before),stripLateFields(after));
}

const ACTIVE="root.child('toko_segeranjiwa_v58/global/authUsers').child(auth.uid).child('active').val() == true";
const SAFE_SIGNAL_ID="$signalId.matches(/^[A-Za-z0-9_-]{1,120}$/)";
const OLD_ELIGIBLE="(data.child('status').val() == 'DETECTED' || data.child('status').val() == 'UNMATCHED' || data.child('status').val() == 'AMBIGUOUS')";
const OLD_LATE="(data.child('status').val() == 'LATE_AFTER_CANCEL' || data.child('status').val() == 'LATE_OR_NEW_AMBIGUOUS')";
const NEW_LATE="(newData.child('status').val() == 'LATE_AFTER_CANCEL' || newData.child('status').val() == 'LATE_OR_NEW_AMBIGUOUS')";
const UNLINKED_OLD="data.child('matchedTransactionId').val() == null && data.child('matchedAt').val() == null && data.child('confirmedAt').val() == null && data.child('confirmedBy').val() == null";
const UNLINKED_NEW="newData.child('matchedTransactionId').val() == null && newData.child('matchedAt').val() == null && newData.child('confirmedAt').val() == null && newData.child('confirmedBy').val() == null";
const OLD_UNRESOLVED="data.child('resolutionState').val() == null && data.child('resolvedAt').val() == null && data.child('resolvedBy').val() == null && data.child('resolvedReason').val() == null";
const NEW_REVIEW="newData.child('resolutionState').val() == 'REVIEW_REQUIRED' && newData.child('autoMatchBlocked').val() == true && newData.child('lateDetectedAt').isNumber() && newData.child('lateDetectedAt').val() > 0 && newData.child('lateCandidatePendingIds').child('0').isString() && newData.child('lateCandidatePendingIds').child('0').val().matches(/^[A-Za-z0-9_-]{1,180}$/) && newData.child('resolvedAt').val() == null && newData.child('resolvedBy').val() == null && newData.child('resolvedReason').val() == null";
const IMMUTABLE_CORE="newData.child('provider').val() == data.child('provider').val() && newData.child('amount').val() == data.child('amount').val() && newData.child('firstSeenAt').val() == data.child('firstSeenAt').val() && newData.child('lastSeenAt').val() == data.child('lastSeenAt').val() && newData.child('sourceDeviceId').val() == data.child('sourceDeviceId').val()";
const IDEMPOTENT_LATE="newData.child('status').val() == data.child('status').val() && newData.child('resolutionState').val() == data.child('resolutionState').val() && newData.child('autoMatchBlocked').val() == data.child('autoMatchBlocked').val() && newData.child('lateDetectedAt').val() == data.child('lateDetectedAt').val() && newData.child('lateCandidatePendingIds').child('0').val() == data.child('lateCandidatePendingIds').child('0').val()";
const CANDIDATE_PENDING="root.child('segeranjiwa_qris_beta_v1').child('pending').child(newData.child('lateCandidatePendingIds').child('0').val())";
const CURRENT_ROLE="root.child('toko_segeranjiwa_v58/global/authUsers').child(auth.uid).child('role').val()";
const CURRENT_USERNAME="root.child('toko_segeranjiwa_v58/global/authUsers').child(auth.uid).child('username').val()";
const CANDIDATE_PENDING_GUARD=`${CANDIDATE_PENDING}.child('status').val() == 'CANCELLED' && ${CANDIDATE_PENDING}.child('amount').val() == data.child('amount').val() && (${CURRENT_ROLE} == 'manajemen' || ${CANDIDATE_PENDING}.child('cashierId').val() == ${CURRENT_USERNAME})`;

export const R5_LATE_WRITE_BRANCH=`auth != null && ${ACTIVE} && ${SAFE_SIGNAL_ID} && data.exists() && newData.exists() && ${IMMUTABLE_CORE} && ${UNLINKED_OLD} && ${UNLINKED_NEW} && ${CANDIDATE_PENDING_GUARD} && ((${OLD_ELIGIBLE} && ${OLD_UNRESOLVED} && ${NEW_LATE} && ${NEW_REVIEW}) || (${OLD_LATE} && ${NEW_LATE} && data.child('resolutionState').val() == 'REVIEW_REQUIRED' && data.child('autoMatchBlocked').val() == true && data.child('lateDetectedAt').isNumber() && data.child('lateCandidatePendingIds').child('0').isString() && ${IDEMPOTENT_LATE} && ${NEW_REVIEW}))`;

export const R5_LATE_VALIDATE_BRANCH=`newData.exists() && data.exists() && newData.hasChildren(['provider','amount','firstSeenAt','lastSeenAt','sourceDeviceId','status','resolutionState','autoMatchBlocked','lateDetectedAt','lateCandidatePendingIds']) && newData.child('provider').val() == 'GOFOOD_MERCHANT' && newData.child('amount').isNumber() && newData.child('amount').val() > 0 && newData.child('firstSeenAt').isNumber() && newData.child('firstSeenAt').val() > 0 && newData.child('lastSeenAt').isNumber() && newData.child('lastSeenAt').val() >= newData.child('firstSeenAt').val() && newData.child('sourceDeviceId').isString() && newData.child('sourceDeviceId').val().length > 0 && newData.child('sourceDeviceId').val().length <= 160 && ${IMMUTABLE_CORE} && ${UNLINKED_OLD} && ${UNLINKED_NEW} && ${NEW_LATE} && ${NEW_REVIEW} && ((${OLD_ELIGIBLE} && ${OLD_UNRESOLVED}) || (${OLD_LATE} && data.child('resolutionState').val() == 'REVIEW_REQUIRED' && data.child('autoMatchBlocked').val() == true && data.child('lateDetectedAt').isNumber() && data.child('lateCandidatePendingIds').child('0').isString() && ${IDEMPOTENT_LATE}))`;

function hasLateAuthorization(signal){
  const write=String(signal?.['.write']||'');
  return write.includes("child('lateCandidatePendingIds').child('0').val()).child('status').val() == 'CANCELLED'")
    && write.includes("child('lateCandidatePendingIds').child('0').val()).child('amount').val() == data.child('amount').val()")
    && write.includes("child('role').val() == 'manajemen'")
    && write.includes("child('lateCandidatePendingIds').child('0').val()).child('cashierId').val() == root.child('toko_segeranjiwa_v58/global/authUsers').child(auth.uid).child('username').val()");
}
function isAligned(signal){
  const joined=String(signal?.['.write']||'')+'\n'+String(signal?.['.validate']||'');
  return joined.includes("LATE_AFTER_CANCEL")&&joined.includes("LATE_OR_NEW_AMBIGUOUS")&&joined.includes("REVIEW_REQUIRED")&&joined.includes("lateCandidatePendingIds")&&joined.includes("autoMatchBlocked")&&joined.includes("lateDetectedAt")&&hasLateAuthorization(signal);
}
function assertSupportedBaseline(rules){
  if(!rules||typeof rules!=='object'||!rules.rules)throw new Error('R5_RULES_ROOT_MISSING');
  const qris=rules.rules[QRIS_ROOT];
  if(!qris||!qris.signals||!qris.signals['$signalId'])throw new Error('R5_RULES_SIGNAL_PATH_MISSING');
  if(qris['.write']!==false)throw new Error('R5_QRIS_ROOT_NOT_FAIL_CLOSED');
  const signal=qris.signals['$signalId'],write=signal['.write'],validate=signal['.validate'];
  if(typeof write!=='string'||typeof validate!=='string')throw new Error('R5_UNSUPPORTED_SIGNAL_RULES_BASELINE');
  if(isAligned(signal))return;
  const requiredWrite=['DETECTED','UNMATCHED','AMBIGUOUS','MATCHED','CONFIRMED','$signalId.matches','auth.uid'];
  const requiredValidate=['provider','amount','firstSeenAt','lastSeenAt','sourceDeviceId','DETECTED','UNMATCHED','AMBIGUOUS','MATCHED','CONFIRMED'];
  if(!requiredWrite.every(token=>write.includes(token))||!requiredValidate.every(token=>validate.includes(token)))throw new Error('R5_UNSUPPORTED_SIGNAL_RULES_BASELINE');
}

export function applyLateQuarantineRules(liveRules){
  assertSupportedBaseline(liveRules);
  const candidate=clone(liveRules),signal=get(candidate,SIGNAL_PATH);
  if(isAligned(signal))return candidate;
  signal['.write']=`(${signal['.write']}) || (${R5_LATE_WRITE_BRANCH})`;
  signal['.validate']=`(${signal['.validate']}) || (${R5_LATE_VALIDATE_BRANCH})`;
  return candidate;
}

export function diffRuleScalars(before,after){
  const out=[];
  function walk(a,b,path=[]){
    if(isDeepStrictEqual(a,b))return;
    const aObj=a&&typeof a==='object'&&!Array.isArray(a),bObj=b&&typeof b==='object'&&!Array.isArray(b);
    if(aObj&&bObj){
      const keys=[...new Set([...Object.keys(a),...Object.keys(b)])].sort();
      for(const key of keys)walk(a[key],b[key],[...path,key]);
      return;
    }
    out.push({path:path.join('/'),before:a,after:b});
  }
  walk(before,after);
  return out.sort((x,y)=>x.path.localeCompare(y.path));
}

export function verifyR5Candidate(liveRules,candidateRules){
  assertSupportedBaseline(liveRules);
  assertSupportedBaseline(candidateRules);
  const diffs=diffRuleScalars(liveRules,candidateRules),changedPaths=diffs.map(x=>x.path);
  const allowed=[
    'rules/segeranjiwa_qris_beta_v1/signals/$signalId/.validate',
    'rules/segeranjiwa_qris_beta_v1/signals/$signalId/.write'
  ];
  const signal=get(candidateRules,SIGNAL_PATH);
  const ok=isAligned(signal)&&changedPaths.length===2&&changedPaths.every(path=>allowed.includes(path))&&candidateRules.rules[QRIS_ROOT]['.write']===false;
  return Object.freeze({ok,changedPaths,diffCount:diffs.length,rootFailClosed:candidateRules.rules[QRIS_ROOT]['.write']===false});
}
