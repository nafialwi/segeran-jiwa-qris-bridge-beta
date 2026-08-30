import { PRIMARY_ROUTES, transactionParentRoute } from './route-contract.js';

export function createAppState(initial={primary:'sales',child:null}){
  let primary=PRIMARY_ROUTES[initial.primary]?initial.primary:'sales';
  let child=initial.child??null;
  function setPrimary(route){
    if(!PRIMARY_ROUTES[route]) throw new Error(`UNKNOWN_PRIMARY_ROUTE:${route}`);
    primary=route;
    child=null;
    return snapshot();
  }
  function setChild(family,key,meta={}){
    const route=family==='transaction'?transactionParentRoute(key):family;
    if(!PRIMARY_ROUTES[route]) throw new Error(`UNKNOWN_CHILD_PARENT:${family}`);
    primary=route;
    child=Object.freeze({family,key,...meta});
    return snapshot();
  }
  function setTransactionChild(key,meta={}){return setChild('transaction',key,meta)}
  function clearChild(){child=null;return snapshot()}
  function snapshot(){return Object.freeze({primary,child})}
  return Object.freeze({setPrimary,setChild,setTransactionChild,clearChild,snapshot});
}
