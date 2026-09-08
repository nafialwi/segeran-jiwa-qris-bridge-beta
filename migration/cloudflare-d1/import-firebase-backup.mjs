import {createHash} from 'node:crypto';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {dirname,extname,join} from 'node:path';
import {pathToFileURL} from 'node:url';

const ROOT_KEY='toko_segeranjiwa_v58';
const DATA_URL=/^data:([^;,]+);base64,([A-Za-z0-9+/=\r\n]+)$/;

function obj(value){return value && typeof value==='object' && !Array.isArray(value)?value:{};}
function arr(value){return Array.isArray(value)?value:Object.values(obj(value));}
function n(value,fallback=0){const x=Number(value);return Number.isFinite(x)?x:fallback;}
function s(value,fallback=''){return value==null?fallback:String(value);}
function sql(value){
  if(value===null||value===undefined)return 'NULL';
  if(typeof value==='number')return Number.isFinite(value)?String(value):'NULL';
  if(typeof value==='boolean')return value?'1':'0';
  return `'${String(value).replaceAll("'","''")}'`;
}
function stable(value){
  if(Array.isArray(value))return value.map(stable);
  if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(k=>[k,stable(value[k])]));
  return value;
}
function stableJson(value){return JSON.stringify(stable(value));}
function sha(value){return createHash('sha256').update(value).digest('hex');}
function dateFromShiftId(id){const m=s(id).match(/^(\d{4}-\d{2}-\d{2})/);return m?.[1]||'';}
function shiftCode(id){const m=s(id).match(/-(S[^-]+)$/i);return m?.[1]||null;}
function mimeExtension(mime){
  const known={'image/png':'png','image/jpeg':'jpg','image/jpg':'jpg','image/webp':'webp','image/gif':'gif','image/svg+xml':'svg'};
  if(known[mime])return known[mime];
  const tail=(mime.split('/')[1]||'bin').replace(/[^a-z0-9]+/gi,'').toLowerCase();
  return tail||'bin';
}

function unwrapBackup(input){
  const root=obj(input);
  if(root[ROOT_KEY]&&typeof root[ROOT_KEY]==='object')return obj(root[ROOT_KEY]);
  return root;
}

function createMediaCollector(outputDir){
  const byHash=new Map();
  async function extract(dataUrl,legacyPath){
    const match=s(dataUrl).match(DATA_URL);
    if(!match)return null;
    const mime=match[1].toLowerCase();
    const bytes=Buffer.from(match[2].replace(/\s+/g,''),'base64');
    const digest=sha(bytes);
    let row=byHash.get(digest);
    if(!row){
      const ext=mimeExtension(mime);
      const localFile=`media/${digest}.${ext}`;
      const r2Key=`segeran-jiwa/media/${digest}.${ext}`;
      row={sha256:digest,mime,bytes:bytes.length,localFile,r2Key,legacyPaths:[]};
      byHash.set(digest,row);
      await mkdir(dirname(join(outputDir,localFile)),{recursive:true});
      await writeFile(join(outputDir,localFile),bytes);
    }
    if(!row.legacyPaths.includes(legacyPath))row.legacyPaths.push(legacyPath);
    return row;
  }
  async function sanitize(value,legacyPath){
    if(typeof value==='string'){
      const media=await extract(value,legacyPath);
      return media?{mediaSha256:media.sha256,r2Key:media.r2Key}:value;
    }
    if(Array.isArray(value)){
      const out=[];
      for(let i=0;i<value.length;i++)out.push(await sanitize(value[i],`${legacyPath}/${i}`));
      return out;
    }
    if(value&&typeof value==='object'){
      const out={};
      for(const key of Object.keys(value).sort())out[key]=await sanitize(value[key],`${legacyPath}/${key}`);
      return out;
    }
    return value;
  }
  function objects(){return [...byHash.values()].sort((a,b)=>a.sha256.localeCompare(b.sha256));}
  return {extract,sanitize,objects};
}

function insert(table,columns,values){
  return `INSERT OR IGNORE INTO ${table} (${columns.join(',')}) VALUES (${values.map(sql).join(',')});`;
}

async function buildShadowArtifacts(input,{outputDir='migration-output',sourceName='firebase-backup.json'}={}){
  if(!input||typeof input!=='object')throw new TypeError('Firebase backup must be an object');
  await mkdir(outputDir,{recursive:true});
  const root=unwrapBackup(input);
  const global=obj(root.global);
  const media=createMediaCollector(outputDir);
  const statements=['BEGIN TRANSACTION;'];
  const counts={products:0,shifts:0,transactions:0,transactionItems:0,expenses:0,refunds:0,auditLogs:0,media:0};
  const parity={sourceName,schemaVersion:1,shifts:{},totals:{transactionCount:0,salesTotal:0,expenseTotal:0,refundTotal:0}};

  const menu=Array.isArray(global.menu)?global.menu:arr(global.menu);
  for(let i=0;i<menu.length;i++){
    const p=obj(menu[i]);
    const id=s(p.id||p.k||p.code||`legacy-product-${i}`);
    const path=`/global/menu/${id}`;
    let mediaSha=null;
    const image=p.img||p.image||p.savedImg;
    if(typeof image==='string'&&DATA_URL.test(image))mediaSha=(await media.extract(image,`${path}/img`))?.sha256||null;
    const sanitized=await media.sanitize(p,path);
    statements.push(insert('sj_products',
      ['id','name','category','unit_price','track_stock','cup_code','media_sha256','active','legacy_path','raw_json'],
      [id,s(p.n||p.name||id),s(p.c||p.category)||null,n(p.p??p.price),p.trackStock?1:0,s(p.cp||p.cupCode)||null,mediaSha,p.active===false?0:1,path,stableJson(sanitized)]));
    counts.products++;
  }

  const shiftEntries=Object.entries(root).filter(([key,value])=>key!=='global'&&/^\d{4}-\d{2}-\d{2}/.test(key)&&value&&typeof value==='object').sort(([a],[b])=>a.localeCompare(b));
  for(const [shiftId,shiftRaw] of shiftEntries){
    const shift=obj(shiftRaw);
    const businessDate=dateFromShiftId(shiftId);
    const shiftPath=`/${shiftId}`;
    const txMap=obj(shift.tx);
    const expenseMap=obj(shift.opex||shift.expenses);
    const shiftParity={transactionCount:0,salesTotal:0,expenseTotal:0,refundTotal:0};
    const sanitizedShift=await media.sanitize({...shift,tx:undefined,opex:undefined,expenses:undefined},shiftPath);
    statements.push(insert('sj_shifts',
      ['id','business_date','shift_code','cashier_id','cashier_name','status','opened_at','closed_at','opening_cash','expected_cash','closing_cash','sales_total','cash_sales','legacy_path','raw_json'],
      [shiftId,businessDate,shiftCode(shiftId),s(shift.cashierId||shift.kasirId)||null,s(shift.namaKasir||shift.cashier)||null,s(shift.status)||null,n(shift.openedAt||shift.startTs,null),n(shift.closedAt||shift.endTs,null),n(shift.kasAwal||shift.openingCash),n(shift.kasSeharusnya||shift.expectedCash,null),n(shift.kasAktual||shift.closingCash,null),n(shift.omset||shift.salesTotal),n(shift.tunai||shift.cashSales),shiftPath,stableJson(sanitizedShift)]));
    counts.shifts++;

    for(const [txKey,txRaw] of Object.entries(txMap).sort(([a],[b])=>a.localeCompare(b))){
      const tx=obj(txRaw); const txId=s(tx.id||txKey); const txPath=`${shiftPath}/tx/${txKey}`;
      const cart=Array.isArray(tx.cartData)?tx.cartData:Array.isArray(tx.items)?tx.items:arr(tx.cartData||tx.items);
      const sanitizedTx=await media.sanitize({...tx,cartData:undefined,items:undefined},txPath);
      statements.push(insert('sj_transactions',
        ['id','operation_id','shift_id','business_date','created_at','cashier_id','cashier_name','payment_method','subtotal','discount_total','total','status','customer_id','legacy_path','raw_json'],
        [txId,s(tx.operationId||tx.opId)||null,shiftId,businessDate,n(tx.ts||tx.createdAt,null),s(tx.cashierId)||null,s(tx.cashier||tx.namaKasir)||null,s(tx.method||tx.paymentMethod)||null,n(tx.subtotal,null),n(tx.discountTotal||tx.discount),n(tx.total),s(tx.status)||null,s(tx.customerId)||null,txPath,stableJson(sanitizedTx)]));
      counts.transactions++;shiftParity.transactionCount++;shiftParity.salesTotal+=n(tx.total);parity.totals.transactionCount++;parity.totals.salesTotal+=n(tx.total);
      for(let index=0;index<cart.length;index++){
        const item=obj(cart[index]); const itemPath=`${txPath}/cartData/${index}`;
        const productId=s(item.id||item.productId)||null;
        let mediaSha=null; const image=item.img||item.savedImg||item.image;
        if(typeof image==='string'&&DATA_URL.test(image))mediaSha=(await media.extract(image,`${itemPath}/img`))?.sha256||null;
        const sanitizedItem=await media.sanitize(item,itemPath);
        const qty=n(item.q??item.qty,1); const price=n(item.p??item.price??item.unitPrice);
        statements.push(insert('sj_transaction_items',
          ['id','transaction_id','line_no','product_id','product_name','qty','unit_price','line_total','cup_code','media_sha256','legacy_path','raw_json'],
          [`${txId}:${index+1}`,txId,index+1,productId,s(item.n||item.name||productId||`Item ${index+1}`),qty,price,n(item.lineTotal,qty*price),s(item.cp||item.cupCode)||null,mediaSha,itemPath,stableJson(sanitizedItem)]));
        counts.transactionItems++;
      }
    }

    for(const [expenseKey,expenseRaw] of Object.entries(expenseMap).sort(([a],[b])=>a.localeCompare(b))){
      const e=obj(expenseRaw);const id=s(e.id||expenseKey);const path=`${shiftPath}/opex/${expenseKey}`;const sanitized=await media.sanitize(e,path);
      const amount=n(e.a??e.amount??e.nominal);
      statements.push(insert('sj_expenses',
        ['id','operation_id','shift_id','business_date','created_at','amount','category','description','source','status','legacy_path','raw_json'],
        [id,s(e.operationId)||null,shiftId,businessDate,n(e.ts||e.createdAt,null),amount,s(e.category||e.kategori)||null,s(e.ket||e.description||e.note)||null,s(e.source||e.sumber)||null,s(e.status)||null,path,stableJson(sanitized)]));
      counts.expenses++;shiftParity.expenseTotal+=amount;parity.totals.expenseTotal+=amount;
    }
    parity.shifts[shiftId]=shiftParity;
  }

  for(const [refundKey,refundRaw] of Object.entries(obj(global.refunds)).sort(([a],[b])=>a.localeCompare(b))){
    const r=obj(refundRaw);const id=s(r.id||refundKey);const shiftId=s(r.shift||r.shiftId)||null;const path=`/global/refunds/${refundKey}`;const sanitized=await media.sanitize(r,path);const amount=n(r.total||r.amount);
    statements.push(insert('sj_refunds',
      ['id','operation_id','original_transaction_id','shift_id','business_date','created_at','total','reason','status','legacy_path','raw_json'],
      [id,s(r.operationId)||null,s(r.originalTxId||r.transactionId)||null,shiftId,shiftId?dateFromShiftId(shiftId):s(r.businessDate)||null,n(r.ts||r.createdAt,null),amount,s(r.reason||r.alasan)||null,s(r.status)||null,path,stableJson(sanitized)]));
    counts.refunds++;parity.totals.refundTotal+=amount;
    if(shiftId&&parity.shifts[shiftId])parity.shifts[shiftId].refundTotal+=amount;
  }

  for(const [auditKey,auditRaw] of Object.entries(obj(global.auditLogs)).sort(([a],[b])=>a.localeCompare(b))){
    const a=obj(auditRaw);const id=s(a.id||auditKey);const path=`/global/auditLogs/${auditKey}`;const sanitized=await media.sanitize(a,path);
    statements.push(insert('sj_audit_logs',
      ['id','operation_id','action','actor_id','actor_name','detail','created_at','legacy_path','raw_json'],
      [id,s(a.operationId)||null,s(a.action)||null,s(a.actorId||a.userId)||null,s(a.actorName||a.user)||null,s(a.detail||a.note)||null,n(a.ts||a.createdAt,null),path,stableJson(sanitized)]));
    counts.auditLogs++;
  }

  const mediaObjects=media.objects();counts.media=mediaObjects.length;
  for(const m of mediaObjects){
    statements.push(insert('sj_media_objects',
      ['sha256','r2_key','mime_type','byte_length','source_count','first_legacy_path','created_at'],
      [m.sha256,m.r2Key,m.mime,m.bytes,m.legacyPaths.length,m.legacyPaths[0],Date.now()]));
  }

  const sourceCanonical=stableJson(root);const sourceSha=sha(Buffer.from(sourceCanonical));
  const importId=`import-v1-${sourceSha.slice(0,24)}`;
  statements.push(insert('sj_import_ledger',
    ['id','operation_id','source_name','source_sha256','imported_at','schema_version','row_counts_json','parity_json','legacy_path'],
    [importId,importId,sourceName,sourceSha,Date.now(),1,stableJson(counts),stableJson(parity),`/${ROOT_KEY}`]));
  statements.push('COMMIT;','');

  const manifest={version:1,sourceName,sourceSha256:sourceSha,objects:mediaObjects};
  await writeFile(join(outputDir,'shadow_import.sql'),statements.join('\n'));
  await writeFile(join(outputDir,'r2_media_manifest.json'),JSON.stringify(manifest,null,2)+'\n');
  await writeFile(join(outputDir,'parity_summary.json'),JSON.stringify(parity,null,2)+'\n');
  return {outputDir,sourceSha256:sourceSha,counts,parity,media:manifest};
}

async function main(){
  const [inputPath,outputDir='migration-output']=process.argv.slice(2);
  if(!inputPath){
    console.error('Usage: node migration/cloudflare-d1/import-firebase-backup.mjs <firebase-backup.json> [output-dir]');
    process.exitCode=2;return;
  }
  const input=JSON.parse(await readFile(inputPath,'utf8'));
  const result=await buildShadowArtifacts(input,{outputDir,sourceName:inputPath});
  console.log(JSON.stringify({outputDir:result.outputDir,sourceSha256:result.sourceSha256,counts:result.counts},null,2));
}

const invoked=process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href;
if(invoked)await main();

export {buildShadowArtifacts,unwrapBackup};
