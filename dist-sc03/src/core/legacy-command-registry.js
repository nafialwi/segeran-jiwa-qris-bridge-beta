/**
 * SC-03 single-caller strangler registry.
 *
 * Captures the final v1.0.40 caller references after the complete inline patch
 * chain has installed. It owns caller indirection only; it never owns Firebase
 * persistence or business mutations.
 */
export function createLegacyCommandRegistry(runtime=globalThis){
  const captured=Object.create(null);
  const installed=Object.create(null);
  const owns=(object,key)=>Object.prototype.hasOwnProperty.call(object,key);

  function assertAliasFree(alias){
    if(owns(captured,alias)) throw new Error(`LEGACY_COMMAND_ALREADY_CAPTURED:${alias}`);
  }
  function captureFunction(name,alias=name,{required=true}={}){
    assertAliasFree(alias);
    const fn=runtime?.[name];
    if(typeof fn!=='function'){
      if(required) throw new Error(`LEGACY_COMMAND_MISSING:${name}`);
      return false;
    }
    captured[alias]={kind:'function',name,invoke:(...args)=>fn.apply(runtime,args)};
    return true;
  }
  function captureMethod(objectName,methodName,alias=`${objectName}.${methodName}`,{required=true}={}){
    assertAliasFree(alias);
    const target=runtime?.[objectName];
    const fn=target?.[methodName];
    if(typeof fn!=='function'){
      if(required) throw new Error(`LEGACY_COMMAND_MISSING:${objectName}.${methodName}`);
      return false;
    }
    captured[alias]={kind:'method',name:`${objectName}.${methodName}`,invoke:(...args)=>fn.apply(target,args)};
    return true;
  }
  function has(alias){return owns(captured,alias)}
  function invoke(alias,...args){
    const command=captured[alias];
    if(!command) throw new Error(`LEGACY_COMMAND_NOT_CAPTURED:${alias}`);
    return command.invoke(...args);
  }
  function claim(publicName,handler,owner,assign){
    if(typeof handler!=='function') throw new TypeError(`CALLER_HANDLER_REQUIRED:${publicName}`);
    const prior=installed[publicName];
    if(prior){
      if(prior.owner===owner&&prior.handler===handler) return false;
      throw new Error(`CALLER_ALREADY_OWNED:${publicName}:${prior.owner}`);
    }
    assign(handler);
    installed[publicName]={owner,handler};
    return true;
  }
  function installGlobal(name,handler,owner){
    return claim(name,handler,owner,fn=>{runtime[name]=fn});
  }
  function installMethod(objectName,methodName,handler,owner){
    const target=runtime?.[objectName];
    if(!target) throw new Error(`LEGACY_OBJECT_MISSING:${objectName}`);
    return claim(`${objectName}.${methodName}`,handler,owner,fn=>{target[methodName]=fn});
  }
  function snapshot(){
    return {
      captured:Object.keys(captured),
      installed:Object.fromEntries(Object.entries(installed).map(([key,value])=>[key,value.owner]))
    };
  }
  return Object.freeze({runtime,captureFunction,captureMethod,has,invoke,installGlobal,installMethod,snapshot});
}
