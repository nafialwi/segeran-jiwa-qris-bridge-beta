function utf8Bytes(value=''){
  let bytes=0;
  for(let i=0;i<value.length;i++){
    const code=value.charCodeAt(i);
    if(code<0x80)bytes+=1;
    else if(code<0x800)bytes+=2;
    else if(code>=0xd800&&code<=0xdbff&&i+1<value.length&&value.charCodeAt(i+1)>=0xdc00&&value.charCodeAt(i+1)<=0xdfff){bytes+=4;i++}
    else bytes+=3;
  }
  return bytes;
}
export function estimateJsonBytes(value){
  try{return utf8Bytes(JSON.stringify(value??null))}catch(_){return 0}
}
export function createInventoryReadDiagnostics({limit=200,now=()=>Date.now()}={}){
  const cap=Math.max(1,Math.min(2000,Number(limit)||200));
  let log=[];
  function record(entry={}){
    const row=Object.freeze({
      ts:Number(entry.ts??now())||0,
      consumer:String(entry.consumer||'inventory'),
      operation:String(entry.operation||'read'),
      path:String(entry.path||''),
      durationMs:Math.max(0,Number(entry.durationMs)||0),
      estimatedBytes:Math.max(0,Number(entry.estimatedBytes)||0),
      bounded:entry.bounded===true,
      limit:Number.isFinite(Number(entry.limit))?Number(entry.limit):null
    });
    log=[...log,row].slice(-cap);return row;
  }
  function entries(){return log.slice()}
  function summary(){
    const byOperation=Object.create(null);let totalDurationMs=0,totalEstimatedBytes=0;
    for(const row of log){
      totalDurationMs+=row.durationMs;totalEstimatedBytes+=row.estimatedBytes;
      const key=row.operation,prev=byOperation[key]||{reads:0,durationMs:0,estimatedBytes:0};
      byOperation[key]=Object.freeze({reads:prev.reads+1,durationMs:prev.durationMs+row.durationMs,estimatedBytes:prev.estimatedBytes+row.estimatedBytes});
    }
    return Object.freeze({totalReads:log.length,totalDurationMs,totalEstimatedBytes,byOperation:Object.freeze({...byOperation})});
  }
  function reset(){log=[]}
  return Object.freeze({record,entries,summary,reset});
}
