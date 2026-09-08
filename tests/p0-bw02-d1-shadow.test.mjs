import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,rmSync,mkdirSync,existsSync} from 'node:fs';
import {join} from 'node:path';
import {buildShadowArtifacts} from '../migration/cloudflare-d1/import-firebase-backup.mjs';

const schema=readFileSync('migration/cloudflare-d1/schema_v1.sql','utf8');

test('P0-BW02 D1 shadow schema covers canonical ledgers with provenance and idempotency indexes',()=>{
  for(const table of ['sj_shifts','sj_transactions','sj_transaction_items','sj_expenses','sj_customer_debts','sj_debt_payments','sj_inventory_purchases','sj_inventory_movements','sj_refunds','sj_restock_requests','sj_cup_counts','sj_owner_events','sj_month_close_events','sj_audit_logs','sj_media_objects','sj_import_ledger']){
    assert.match(schema,new RegExp(`CREATE TABLE IF NOT EXISTS ${table}\\b`));
  }
  assert.match(schema,/legacy_path TEXT NOT NULL/);
  assert.match(schema,/operation_id TEXT/);
  assert.match(schema,/CREATE INDEX IF NOT EXISTS idx_sj_tx_business_date/);
});

test('P0-BW02 importer normalizes shifts and transactions without embedding base64 media in SQL',async()=>{
  const image='data:image/png;base64,aGVsbG8=';
  const backup={
    global:{
      menu:[{id:'p1',n:'ES TEH',c:'MINUMAN',p:5000,img:image,trackStock:true,cp:'c16'}],
      inventory:{p1:7},
      refunds:{r1:{id:'r1',originalTxId:'SJ-1',shift:'2026-09-08-S1',total:5000,items:[{id:'p1',n:'ES TEH',q:1,p:5000,img:image}],ts:3}},
      auditLogs:{a1:{id:'a1',action:'SALE',detail:'SJ-1',ts:2,user:'KASIR'}},
    },
    '2026-09-08-S1':{
      namaKasir:'KASIR',omset:5000,tunai:5000,uangLaci:105000,
      tx:{'SJ-1':{id:'SJ-1',status:'COMPLETED',ts:2,cashierId:'kasir',cashier:'KASIR',method:'Tunai',total:5000,cartData:[{id:'p1',n:'ES TEH',q:1,p:5000,img:image,cp:'c16'}]}},
      opex:{e1:{id:'e1',a:1000,ket:'Es batu',ts:4,source:'CASH'}},
    }
  };
  const out=join(process.env.HOME||process.cwd(),'.sj-bw02-shadow-test');rmSync(out,{recursive:true,force:true});mkdirSync(out,{recursive:true});
  const result=await buildShadowArtifacts(backup,{outputDir:out,sourceName:'fixture'});
  const sql=readFileSync(join(out,'shadow_import.sql'),'utf8');
  const media=JSON.parse(readFileSync(join(out,'r2_media_manifest.json'),'utf8'));
  const parity=JSON.parse(readFileSync(join(out,'parity_summary.json'),'utf8'));
  assert.doesNotMatch(sql,/data:image\/png;base64/);
  assert.match(sql,/INSERT OR IGNORE INTO sj_transactions/);
  assert.match(sql,/INSERT OR IGNORE INTO sj_transaction_items/);
  assert.equal(media.objects.length,1,'duplicate media bytes should be deduplicated by hash');
  assert.equal(parity.shifts['2026-09-08-S1'].transactionCount,1);
  assert.equal(parity.shifts['2026-09-08-S1'].salesTotal,5000);
  assert.equal(result.counts.transactions,1);
  assert.ok(existsSync(join(out,media.objects[0].localFile)));
});

test('P0-BW02 importer accepts Firebase export wrapped under toko_segeranjiwa_v58',async()=>{
  const out=join(process.env.HOME||process.cwd(),'.sj-bw02-shadow-wrapped');rmSync(out,{recursive:true,force:true});
  const result=await buildShadowArtifacts({toko_segeranjiwa_v58:{global:{menu:[]},'2026-09-08-S1':{tx:{}}}},{outputDir:out});
  assert.equal(result.counts.shifts,1);
});
