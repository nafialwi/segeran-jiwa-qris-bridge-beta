/**
 * SC-04 single browser-storage boundary.
 *
 * Session persistence is allowed to touch browser storage only through this
 * adapter so app/core/module code never grows scattered persistence calls.
 */
export function createJsonStore({storage=globalThis?.localStorage,key}={}){
  if(!key) throw new TypeError('LOCAL_STORE_KEY_REQUIRED');
  if(!storage || typeof storage.getItem!=='function' || typeof storage.setItem!=='function' || typeof storage.removeItem!=='function'){
    throw new TypeError('LOCAL_STORE_ADAPTER_REQUIRED');
  }
  return Object.freeze({
    key,
    read(){
      try{
        const raw=storage.getItem(key);
        if(!raw) return null;
        const value=JSON.parse(raw);
        return value && typeof value==='object' && !Array.isArray(value)?value:null;
      }catch(_){return null}
    },
    write(value){
      if(!value || typeof value!=='object' || Array.isArray(value)) throw new TypeError('LOCAL_STORE_OBJECT_REQUIRED');
      storage.setItem(key,JSON.stringify(value));
      return value;
    },
    clear(){storage.removeItem(key)}
  });
}

export function createBrowserJsonStore({runtime=globalThis,key}={}){
  return createJsonStore({storage:runtime?.localStorage,key});
}
