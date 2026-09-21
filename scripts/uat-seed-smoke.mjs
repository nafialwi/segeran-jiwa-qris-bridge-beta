import {
  UAT_PROJECT_ID,
  UAT_DATABASE_NAMESPACE,
  UAT_DATABASE_ORIGIN,
  waitForUatDatabase,
  resetUatDatabase
} from './uat-backend.mjs';

if(UAT_PROJECT_ID!=='demo-segeran-jiwa-uat')throw new Error('UAT_DEMO_PROJECT_DRIFT');
if(UAT_DATABASE_ORIGIN!=='http://127.0.0.1:9001')throw new Error('UAT_LOOPBACK_DATABASE_REQUIRED');

await waitForUatDatabase({timeoutMs:60000});
await resetUatDatabase();

async function read(path){
  const url=`${UAT_DATABASE_ORIGIN}/${path}.json?ns=${encodeURIComponent(UAT_DATABASE_NAMESPACE)}`;
  const response=await fetch(url);
  if(!response.ok)throw new Error(`UAT_SMOKE_READ_FAILED:${response.status}:${path}`);
  return response.json();
}

const [owner,cashier,balance,mapping]=await Promise.all([
  read('toko_segeranjiwa_v58/global/users/owneruat'),
  read('toko_segeranjiwa_v58/global/users/kasiruat'),
  read('toko_segeranjiwa_v58/global/inventoryV2/balances/ingredients/UAT_SACHET'),
  read('toko_segeranjiwa_v58/global/inventoryV2/productStockComponents/UAT-RENT-4K/UAT_SACHET')
]);

if(owner?.role!=='manajemen')throw new Error('UAT_OWNER_ROLE_INVALID');
if(cashier?.role!=='transaksi')throw new Error('UAT_CASHIER_ROLE_INVALID');
if(Number(balance?.outlet)!==40)throw new Error('UAT_STOCK_SEED_INVALID');
if(Number(mapping?.qtyPerUnit)!==1)throw new Error('UAT_MAPPING_SEED_INVALID');

console.log('PU09_UAT_EMULATOR_SMOKE : PASS');
console.log(`PROJECT                : ${UAT_PROJECT_ID}`);
console.log(`DATABASE NAMESPACE     : ${UAT_DATABASE_NAMESPACE}`);
console.log('PRODUCTION_WRITES      : 0');
