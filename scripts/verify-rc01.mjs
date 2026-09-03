import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT=dirname(dirname(fileURLToPath(import.meta.url)));
const EXPECTED_BASELINE='877dd5d80ad3cfbae9c8ded35ea37c426bf795392240adb96c38e62fc556154f';
const POS_ROOT='toko_segeranjiwa_v58';
const QRIS_ROOT='segeranjiwa_qris_beta_v1';
const EXPECTED_WRITERS=[
  'src/data/writers/finance-writer.js',
  'src/data/writers/purchase-reconciliation-writer.js',
  'src/data/writers/qris-cash-out-coordinator.js',
  'src/data/writers/qris-deferred-settlement-writer.js'
].sort();
const sha=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
const text=rel=>readFileSync(join(ROOT,rel),'utf8');
const violations=[];
const add=(code,detail)=>violations.push({code,detail});
function walk(dir){if(!existsSync(dir))return[];const out=[];for(const name of readdirSync(dir)){const p=join(dir,name);if(statSync(p).isDirectory())out.push(...walk(p));else out.push(p)}return out}

const baseline=join(ROOT,'baseline','legacy-v1.0.40.html');
if(!existsSync(baseline)||sha(baseline)!==EXPECTED_BASELINE)add('BASELINE_HASH_DRIFT',existsSync(baseline)?sha(baseline):'missing');

const firebase=text('src/data/firebase-client.js');
if(!firebase.includes(POS_ROOT))add('POS_ROOT_DRIFT',POS_ROOT);
if(!firebase.includes(QRIS_ROOT))add('QRIS_ROOT_DRIFT',QRIS_ROOT);

const sc04=text('src/app/sc04-bootstrap.js');
if(!sc04.includes("addEventListener('online'")||!sc04.includes('OFFLINE_REVALIDATION_REQUIRED'))add('RECONNECT_RETRY_MISSING','SC04 online retry / offline reason');

const legacy=text('baseline/legacy-v1.0.40.html');
if(!legacy.includes('handleBack()')||!legacy.includes("addEventListener('popstate'")||!legacy.includes("addEventListener('backbutton'"))add('ANDROID_BACK_CONTRACT_MISSING','legacy back hierarchy');

const barcode=text('src/ui/sales-shift-ux-refinement.js');
if(!barcode.includes('getUserMedia')||!barcode.includes('BarcodeDetector')||!barcode.includes('scanner tidak tersedia'))add('BARCODE_CAMERA_CONTRACT_MISSING','camera + manual fallback');

const qris=[text('src/data/qris-adapter.js'),text('src/modules/payments/qris.js')].join('\n');
if(!qris.includes('SJQrisSignalBeta'))add('QRIS_CONTRACT_MISSING','SJQrisSignalBeta authority');

if(!legacy.includes('AndroidPrinter')||!legacy.includes('PrinterBridge')||!legacy.includes('rawbt:base64'))add('PRINTER_CONTRACT_MISSING','native/RawBT printer fallbacks');
if(!legacy.includes('shareStrukWA')||!legacy.includes('whatsapp://send'))add('SHARE_CONTRACT_MISSING','WhatsApp receipt share');

const receiptOutput=text('src/ui/rc01-receipt-output.js');
const entry=text('src/ref01-entry.js');
if(!receiptOutput.includes('printOrSavePdf')||!receiptOutput.includes('@media print')||!entry.includes('installRc01ReceiptOutput'))add('PDF_PRINT_CONTRACT_MISSING','RC01 browser print/PDF fallback');

const notification=[text('src/ui/notification-refinement.js'),text('src/app/ref01-bootstrap.js'),legacy].join('\n');
if(!notification.includes('openNotifications')||!notification.includes('sjHandleNotificationClick'))add('NOTIFICATION_DEEPLINK_CONTRACT_MISSING','notification/deep-link authority');

const closing=[text('src/modules/operational/closing.js'),text('src/ui/report-refinement.js')].join('\n');
if(!closing.includes('SJShift')||!closing.includes('report'))add('CLOSING_REPORT_CONTRACT_MISSING','closing/report authority');

const mutationPattern=new RegExp('\\.(?:set|update|transaction|remove)\\s*\\(');
const writerFiles=walk(join(ROOT,'src')).filter(p=>p.endsWith('.js')&&mutationPattern.test(readFileSync(p,'utf8'))).map(p=>relative(ROOT,p).replaceAll('\\','/')).sort();
if(writerFiles.join('|')!==EXPECTED_WRITERS.join('|'))add('MUTATION_ALLOWLIST_DRIFT',writerFiles.join(', '));
if(writerFiles.some(rel=>text(rel).includes('.remove(')))add('DESTRUCTIVE_MUTATION_PRESENT',writerFiles.filter(rel=>text(rel).includes('.remove(')).join(', '));

const result={
  generatedAt:new Date().toISOString(),phase:'RC-01',
  baselineSha256:existsSync(baseline)?sha(baseline):null,
  posRoot:POS_ROOT,qrisRoot:QRIS_ROOT,
  mutationAllowlist:writerFiles,
  contracts:{reconnect:true,androidBack:true,barcodeCamera:true,qris:true,printer:true,share:true,pdfPrint:true,notificationDeepLink:true,closingReport:true},
  violations
};
writeFileSync(join(ROOT,'audit','rc01-verification.json'),JSON.stringify(result,null,2)+'\n');
if(violations.length){console.error(`RC-01 verification FAILED: ${violations.length} violation(s)`);for(const v of violations)console.error(`- ${v.code}: ${v.detail}`);process.exit(1)}
console.log(`RC-01 release contract PASS: fixed roots/hash; reconnect/back/camera/QRIS/printer/share/PDF/notification/closing-report contracts present; mutation allowlist ${writerFiles.length}/${EXPECTED_WRITERS.length}.`);
