import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';

const ROOT=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const errors=[];
const add=(code,msg)=>errors.push(`${code}: ${msg}`);
const read=rel=>fs.readFileSync(path.join(ROOT,rel),'utf8');
const exists=rel=>fs.existsSync(path.join(ROOT,rel));
const sha256=rel=>crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT,rel))).digest('hex');

const pkg=JSON.parse(read('package.json'));
const [vmaj,vmin]=String(pkg.version||'0.0.0').split('.').map(Number);if(vmaj<3||(vmaj===3&&vmin<2))add('VERSION',`expected >=3.2.0, got ${pkg.version}`);
const frozen='877dd5d80ad3cfbae9c8ded35ea37c426bf795392240adb96c38e62fc556154f';
if(!exists('baseline/legacy-v1.0.40.html'))add('FROZEN_MISSING','baseline/legacy-v1.0.40.html');
else if(sha256('baseline/legacy-v1.0.40.html')!==frozen)add('FROZEN_HASH','legacy baseline changed');

for(const rel of [
  'src/domain/inventory-v32-analytics.js',
  'src/ui/inventory-workspace-v32.js',
  'src/domain/report-v28-analytics.js',
  'src/ui/report-refinement.js',
  'src/ui/finished-goods-warehouse-refinement.js',
  'src/ui/owner-dashboard-hybrid.js'
])if(!exists(rel))add('FILE_MISSING',rel);

const workspace=read('src/ui/inventory-workspace-v32.js');
for(const label of ['Ringkasan','Stok','Aktivitas','Lainnya'])if(!workspace.includes(`'${label}'`)&&!workspace.includes(`>${label}<`))add('INV_TAB',label);
for(const label of ['Perlu Transfer','Perlu Beli','Cek Stok Fisik','Catat Pembelian','Pindahkan Stok'])if(!workspace.includes(label))add('INV_UX',label);
for(const token of ['legacyOpen','data-v32-inventory-search','updateStockList'])if(!workspace.includes(token))add('INV_CONTRACT',token);
for(const token of ['.set(','.update(','.transaction(','.remove('])if(workspace.includes(token))add('NEW_WRITER',`inventory workspace contains ${token}`);

const analytics=read('src/domain/inventory-v32-analytics.js');
for(const token of ['CHECK_PHYSICAL','TRANSFER','BUY','SAFE'])if(!analytics.includes(token))add('INV_SEMANTICS',token);
for(const token of ['inventoryActivityTimeline','Pindah Stok','Gudang → Gerai'])if(!analytics.includes(token))add('INV_ACTIVITY',token);
for(const token of ['renderInventoryItemDetailV32','data-v32-inventory-open-item','data-v32-inventory-activity-item','data-v32-inventory-action=\"edit-rules\"','data-edit-ing'])if(!workspace.includes(token))add('INV_DETAIL',token);
const css=read('src/ui/ref01.css');
for(const token of ['.sj-v32-inv-actions>button>span:first-child{grid-row:1/3','.sj-v32-inv-activity{','.sj-v32-inv-detail{'])if(!css.includes(token))add('INV_PRESENTATION',token);

const finished=read('src/ui/finished-goods-warehouse-refinement.js');
if(finished.includes("role==='owner'||role===null"))add('ROLE_FAIL_OPEN','Finished Goods still treats null as Owner');
for(const token of ['Gudang','Gerai','Set Stok Gudang','Transfer ke Gerai','Pembelian (Advanced)'])if(!finished.includes(token))add('FG_CONTRACT',token);
for(const token of ['renderFinishedGoodsDetailV32','data-v32-fg-open-detail','openProductDetail',"field.style.display='none'"])if(!finished.includes(token))add('FG_DETAIL',token);
for(const token of ['__SJ_V32_INVENTORY_WORKSPACE',"openAction?.('opname','product',productId","openAction?.('transfer','product',productId","openAction?.('purchase','product',productId","open?.('activity')"])if(!finished.includes(token))add('FG_V3_ROUTE',token);
for(const token of ['.set(','.update(','.transaction(','.remove('])if(finished.includes(token))add('NEW_WRITER',`finished goods contains ${token}`);

const ux=read('src/ui/v31-ux-polish.js');
if(!ux.includes('__SJ_V32_INVENTORY_WORKSPACE')||ux.includes("SJInventoryV2?.open?.('summary')"))add('INV_RUNTIME_ENTRY','Operasional Bahan & Gudang can still bypass V3');
if(!finished.includes('function requireV3Inventory'))add('FG_FAIL_CLOSED','missing V3 inventory requirement');
for(const direct of ["SJInventoryV2?.open?.('purchase')","SJInventoryV2?.open?.('transfer')","SJInventoryV2?.open?.('opname')","SJInventoryV2?.open?.('movements')"])if(finished.includes(direct))add('FG_LEGACY_FALLBACK',direct);
const refBootstrap=read('src/app/ref01-bootstrap.js');
for(const token of ['let inventoryWorkspace=installInventoryWorkspaceV32(runtime)','function ensureInventoryWorkspaceV32()','settings.materials-warehouse','ensureInventoryWorkspaceV32();'])if(!refBootstrap.includes(token))add('INV_RUNTIME_INSTALL',token);

const reportDomain=read('src/domain/report-v28-analytics.js');
if(!reportDomain.includes('chartBucketModeForScope'))add('REPORT_BUCKET','chartBucketModeForScope');
if(!/label:`Minggu \${n}`/.test(reportDomain))add('REPORT_BUCKET','weekly month label');
const reportUi=read('src/ui/report-refinement.js');
if(!reportUi.includes('data-v32-chart-bucket'))add('REPORT_UI','adaptive chart bucket evidence missing');

const dash=read('src/ui/owner-dashboard-hybrid.js');
if(!/applyScope\?\.\('day'/.test(dash))add('DASH_SCOPE','day scope');
if(!/setFilter\?\.\('shift'/.test(dash))add('DASH_SCOPE','shift filter');
if(!dash.includes('openHistory'))add('DASH_SCOPE','openHistory');

for(const rel of ['src/domain/report-v28-analytics.js','src/ui/report-refinement.js','src/ui/owner-dashboard-hybrid.js']){
  const src=read(rel);
  for(const token of ['.set(','.update(','.transaction(','.remove('])if(src.includes(token))add('NEW_WRITER',`${rel} contains ${token}`);
}

if(errors.length){console.error(errors.join('\n'));process.exit(1)}
console.log('V3.2 Reporting + Inventory guard PASS: adaptive report buckets, semantic Bahan/Gudang workspace, RC4 runtime presentation containment, clickable inventory actions, Finished Goods V3 routing, dashboard scoped deep-links, frozen baseline exact, no new modular writer tokens.');
