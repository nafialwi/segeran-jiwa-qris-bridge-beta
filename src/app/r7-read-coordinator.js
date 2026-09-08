export function createR7ReadCoordinator({now=()=>Date.now()}={}){
  const records=Object.create(null),tokens=Object.create(null);
  const keyOf=key=>String(key||'');
  const clone=value=>{
    if(value===null||value===undefined||typeof value!=='object')return value;
    try{return JSON.parse(JSON.stringify(value))}catch(_){return value}
  };
  function peek(key){return records[keyOf(key)]||null}
  function begin(key){
    key=keyOf(key);const token=Number(tokens[key]||0)+1;tokens[key]=token;
    const prev=records[key]||{};
    records[key]={value:prev.value,loadedAt:prev.loadedAt||0,loading:true,error:'',requestToken:token,startedAt:now(),lastDurationMs:prev.lastDurationMs||0};
    return token;
  }
  function isCurrent(key,token){return Number(tokens[keyOf(key)]||0)===Number(token)}
  function finish(key,token,value,timing={}){
    key=keyOf(key);if(!isCurrent(key,token))return false;
    const prev=records[key]||{},endedAt=Number(timing.endedAt??now()),startedAt=Number(timing.startedAt??prev.startedAt??endedAt);
    records[key]={value,loadedAt:endedAt,loading:false,error:'',requestToken:Number(token),startedAt,lastDurationMs:Math.max(0,endedAt-startedAt)};return true;
  }
  function fail(key,token,error,timing={}){
    key=keyOf(key);if(!isCurrent(key,token))return false;
    const prev=records[key]||{},endedAt=Number(timing.endedAt??now()),startedAt=Number(timing.startedAt??prev.startedAt??endedAt);
    records[key]={value:prev.value,loadedAt:prev.loadedAt||0,loading:false,error:String(error?.message||error||'READ_FAILED'),requestToken:Number(token),startedAt,lastDurationMs:Math.max(0,endedAt-startedAt)};return true;
  }
  function snapshot(){
    const out=Object.create(null);
    for(const [key,record] of Object.entries(records))out[key]={...record,value:clone(record.value)};
    return out;
  }
  return Object.freeze({peek,begin,isCurrent,finish,fail,snapshot});
}

export function ensureR7ReadCoordinator(runtime=globalThis,options={}){
  if(runtime?.__SJ_R7_READ_COORDINATOR)return runtime.__SJ_R7_READ_COORDINATOR;
  const coordinator=createR7ReadCoordinator(options);
  try{Object.defineProperty(runtime,'__SJ_R7_READ_COORDINATOR',{value:coordinator,writable:false,configurable:false,enumerable:false})}
  catch(_){try{runtime.__SJ_R7_READ_COORDINATOR=coordinator}catch(__){}}
  return coordinator;
}
