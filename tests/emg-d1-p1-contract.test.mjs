import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

const read = (p) => fs.readFileSync(p, 'utf8');
const sha = (p) => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');

test('EMG-D1 P1 build-ref01 menyisipkan config/runtime setelah frozen authority tail', () => {
  const s = read('scripts/build-ref01.mjs');
  for (const token of ['DASHBOARD_FAST_P1_ENTRY', 'EMG_D1_P1_CONFIG_ENTRY', 'EMG_D1_P1_ENTRY', 'PRODUCT_CUP_UI_ENTRY', 'R6D_SALES_RECURSION_ENTRY', 'CLASSIC_ENTRY', 'S10A_CLASSIC_ENTRY', 'QRIS_MANUAL_ENTRY']) assert.match(s, new RegExp(token));
  const candidate = s.slice(s.indexOf('const candidate='));
  assert.ok(candidate.indexOf('${PRODUCT_CUP_UI_ENTRY}') < candidate.indexOf('${DASHBOARD_FAST_P1_ENTRY}'));
  assert.ok(candidate.indexOf('${DASHBOARD_FAST_P1_ENTRY}') < candidate.indexOf('${R6D_SALES_RECURSION_ENTRY}'));
  assert.ok(candidate.indexOf('${R6D_SALES_RECURSION_ENTRY}') < candidate.indexOf('${CLASSIC_ENTRY}'));
  assert.ok(candidate.indexOf('${CLASSIC_ENTRY}') < candidate.indexOf('${S10A_CLASSIC_ENTRY}'));
  assert.ok(candidate.indexOf('${S10A_CLASSIC_ENTRY}') < candidate.indexOf('${QRIS_MANUAL_ENTRY}'));
  assert.ok(candidate.indexOf('${QRIS_MANUAL_ENTRY}') < candidate.indexOf('${ENTRY}'));
  assert.ok(candidate.indexOf('${ENTRY}') < candidate.indexOf('${EMG_D1_P1_CONFIG_ENTRY}'));
  assert.ok(candidate.indexOf('${EMG_D1_P1_CONFIG_ENTRY}') < candidate.indexOf('${EMG_D1_P1_ENTRY}'));
});

test('EMG-D1 P1 client tidak mengganti processTransaction dan tidak memakai Firebase SDK', () => {
  const s = read('src/compat/emg-d1-p1-emergency.js');
  assert.doesNotMatch(s, /window\.processTransaction\s*=/);
  assert.doesNotMatch(s, /confirmQrisPayment\s*=/);
  assert.doesNotMatch(s, /firebase\.|db\.ref\(|\.once\(\s*['"]value|\.on\(\s*['"]value/);
  assert.match(s, /Tidak ada failover otomatis/);
  assert.match(s, /Manual verification/);
});

test('EMG-D1 P1 Worker punya idempotency dan D1 batch untuk operasi bisnis', () => {
  const s = read('emergency-d1/src/worker.js');
  assert.match(s, /operation_id TEXT|operationId/);
  assert.match(s, /SJ_EMERGENCY_DB\.batch/);
  assert.match(s, /SELECT \* FROM emg_transactions WHERE operation_id=\?/);
  const core = read('emergency-d1/src/core.js');
  assert.match(core, /\['TUNAI', 'TRANSFER', 'QRIS'\]/);
});

test('EMG-D1 P1 schema punya emergency ledger minimum dan CHECK inventory non-negative', () => {
  const s = read('emergency-d1/schema.sql');
  for (const table of ['emg_master_snapshots','emg_shifts','emg_transactions','emg_transaction_items','emg_cash_events','emg_inventory_balance','emg_inventory_events','emg_audit','emg_auth_attempts']) assert.match(s, new RegExp(`CREATE TABLE IF NOT EXISTS ${table}`));
  assert.match(s, /qty REAL NOT NULL CHECK\(qty >= 0\)/);
  assert.match(s, /operation_id TEXT NOT NULL UNIQUE/);
});

test('EMG-D1 P1 config final menunjuk Worker HTTPS, bukan placeholder', () => {
  const s = read('src/compat/emg-d1-p1-config.js');
  assert.doesNotMatch(s, /__SJ_EMERGENCY_API_BASE__/);
  assert.match(s, /https:\/\/[a-z0-9.-]+\.workers\.dev/i);
});

test('EMG-D1 P1 tidak mengubah frozen QRIS/manual/ref01 authority files dari HEAD', () => {
  const paths = ['src/compat/rc01-qris-deferred-settlement-compat.js','src/compat/rc01-qris-manual-bypass.js','src/ref01-entry.js'];
  assert.doesNotThrow(() => execFileSync('git', ['diff','--exit-code','HEAD','--',...paths], { stdio: 'pipe' }));
});

test('EMG-D1 P1 provision guard memeriksa openssl, required secrets, dan selalu menyimpan OWNER KEY lokal', () => {
  const s = read('scripts/emg-d1-p1-provision.sh');
  assert.match(s, /command -v openssl/);
  assert.match(s, /printf '%s\\n' "\$OWNER_KEY" > "\$OWNER_KEY_FILE"/);
  assert.match(s, /\[secrets\][\s\S]*required = \["SJ_EMERGENCY_OWNER_KEY", "SJ_EMERGENCY_SIGNING_KEY"\]/);
});
