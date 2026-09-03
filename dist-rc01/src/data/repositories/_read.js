export async function readValue(db,path){
  if(!db||typeof db.ref!=='function')throw new Error('RTDB_READ_CLIENT_REQUIRED');
  const snap=await db.ref(path).once('value');
  return snap&&typeof snap.val==='function'?snap.val():null;
}
