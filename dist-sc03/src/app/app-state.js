import { PRIMARY_ROUTES, transactionParentRoute } from './route-contract.js';

export function createAppState(initial={primary:'sales',child:null}){
  let primary=PRIMARY_ROUTES[initial.primary]?initial.primary:'sales';
  let child=initial.child??null;
  const listeners=[];
  function emit(){const value=snapshot();for(const listener of listeners.slice())try{listener(value)}catch(_){}return value}
  function setPrimary(route){
    if(!PRIMARY_ROUTES[route]) throw new Error(`UNKNOWN_PRIMARY_ROUTE:${route}`);
    primary=route;
    child=null;
    return emit();
  }
  function setChild(family,key,meta={}){
    const route=family==='transaction'?transactionParentRoute(key):family;
    if(!PRIMARY_ROUTES[route]) throw new Error(`UNKNOWN_CHILD_PARENT:${family}`);
    primary=route;
    child=Object.freeze({family,key,...meta});
    return emit();
  }
  function setTransactionChild(key,meta={}){return setChild('transaction',key,meta)}
  function clearChild(){child=null;return emit()}
  function snapshot(){return Object.freeze({primary,child})}
  function subscribe(listener){if(typeof listener!=='function')return()=>{};listeners.push(listener);let active=true;return()=>{if(!active)return;active=false;const i=listeners.indexOf(listener);if(i>=0)listeners.splice(i,1)}}
  return Object.freeze({setPrimary,setChild,setTransactionChild,clearChild,snapshot,subscribe});
}
