function need(engine,name){const fn=engine?.[name];if(typeof fn!=='function')throw new Error(`SHIFT_ENGINE_METHOD_MISSING:${name}`);return fn.bind(engine)}
export function createShiftService({engine,bridge}={}){
  const e=()=>engine||(bridge?bridge.engine('shift'):null);
  return Object.freeze({
    state(data){return need(e(),'state')(data)},
    guardTransaction(){return need(e(),'guardTransaction')()},
    async startShift(){return await need(e(),'startShift')()},
    async handover(){return await need(e(),'submitHandover')()},
    async closeShift(){return await need(e(),'submitClose')()},
    async findActiveForUser(userId,date,excludeKey){return await need(e(),'findActiveForUser')(userId,date,excludeKey)}
  });
}
