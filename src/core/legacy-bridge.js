/**
 * SC-02 strangler bridge to the proven v1.0.40 runtime.
 *
 * Mutation ownership stays in the existing global authority during SC-02.
 * This bridge provides one explicit access point so later stages can remove
 * globals without creating a second writer.
 */
const ENGINE_KEYS=Object.freeze({
  qris:'SJQrisSignalBeta',
  inventory:'SJInventoryV2',
  costing:'SJCostingV1',
  shift:'SJShift',
  reports:'SJReportFoundationV010',
  operationalHardening:'SJOperationalHardening'
});

export function createLegacyBridge(runtime=globalThis){
  const get=name=>runtime?.[name];
  const requireAuthority=name=>{
    const value=get(name);
    if(value==null) throw new Error(`LEGACY_AUTHORITY_MISSING:${name}`);
    return value;
  };
  return Object.freeze({
    runtime,
    get,
    require:requireAuthority,
    engine(kind){
      const key=ENGINE_KEYS[kind]||kind;
      return requireAuthority(key);
    },
    async call(name,...args){
      const fn=requireAuthority(name);
      if(typeof fn!=='function') throw new Error(`LEGACY_AUTHORITY_NOT_CALLABLE:${name}`);
      return await fn.apply(runtime,args);
    },
    snapshot(){
      return {
        processTransaction:typeof get('processTransaction')==='function',
        qris:!!get('SJQrisSignalBeta'),
        inventory:!!get('SJInventoryV2'),
        costing:!!get('SJCostingV1'),
        shift:!!get('SJShift'),
        reports:!!get('SJReportFoundationV010'),
        operationalHardening:!!get('SJOperationalHardening')
      };
    }
  });
}
