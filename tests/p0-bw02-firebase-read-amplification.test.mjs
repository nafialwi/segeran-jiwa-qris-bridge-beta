import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync,existsSync} from 'node:fs';

execFileSync(process.execPath,['scripts/build-ref01.mjs'],{stdio:'pipe'});
const html=readFileSync('dist-ref01/index.html','utf8');
const build=readFileSync('scripts/build-ref01.mjs','utf8');
const compatPath='src/compat/p0-bw02-bandwidth-hardening.js';
const compat=existsSync(compatPath)?readFileSync(compatPath,'utf8'):'';

test('P0-BW02 stops persisting product image payloads inside new transaction cartData',()=>{
  assert.doesNotMatch(html,/cartData:cart\.map\(i=>\(\{[^}]*img:i\.savedImg/);
  assert.doesNotMatch(html,/cartData:rows\.map\(function\(i\)\{var x=\{[^}]*img:i\.savedImg/);
  assert.match(build,/patchBw02TransactionPayload/);
});

test('P0-BW02 canonical sale returns exact transaction id after successful write',()=>{
  assert.match(html,/TX_WRITE_TIMEOUT[\s\S]{0,800}return txId/);
});

test('P0-BW02 recipe and HPP sale wrappers no longer full-scan shift transactions before and after each sale',()=>{
  assert.doesNotMatch(html,/before=\(await db\.ref\(DB_PATH\+'\/'\+shift\+'\/tx'\)\.once\('value'\)\)\.val\(\)\|\|\{\}/);
  assert.doesNotMatch(html,/COST_TX_BEFORE_TIMEOUT/);
  assert.doesNotMatch(html,/COST_TX_AFTER_TIMEOUT/);
  assert.match(html,/BW02_EXACT_TX_ID_REQUIRED/);
});

test('P0-BW02 refund costing resolves original transaction without full-shift tx read',()=>{
  const start=html.indexOf('async function findOriginalTransaction(refund)');
  const end=html.indexOf('async function persistRefundCosting',start);
  assert.ok(start>0&&end>start,'refund costing function must exist');
  const body=html.slice(start,end);
  assert.doesNotMatch(body,/DB_PATH\+'\/'\+shift\+'\/tx'\)\.once\('value'/);
  assert.match(body,/tx\/'\+needle/);
  assert.match(body,/orderByChild\('id'\)\.equalTo\(needle\)\.limitToFirst\(1\)/);
});

test('P0-BW02 removes recurring refund/costing recovery business-data polls',()=>{
  assert.doesNotMatch(html,/setInterval\(function\(\)\{try\{recoverRefundCosting\(\)\}catch\(_\)\{\}\},3000\)/);
  assert.doesNotMatch(html,/setInterval\(function\(\)\{try\{installSaleWrapper\(\);recoverCostingReservations\(\)\}catch\(_\)\{\}\},2500\)/);
  assert.match(html,/__SJ_BW02_REFUND_RECOVERY_TIMER_DISABLED/);
  assert.match(html,/__SJ_BW02_COST_RECOVERY_TIMER_DISABLED/);
});

test('P0-BW02 recovery bootstrap is event-driven and contains no interval loop',()=>{
  assert.ok(compat,'bandwidth compatibility module must exist');
  assert.match(compat,/child_added/);
  assert.match(compat,/recoverCostingReservations/);
  assert.match(compat,/recoverRefundCosting/);
  assert.doesNotMatch(compat,/setInterval\s*\(/);
  assert.doesNotMatch(compat,/\.ref\([^\n]+\+'\/tx'\)\.once\('value'\)/);
});

test('P0-BW02 login recovery does not consume its once-per-login guard before costing runtime is available',()=>{
  assert.match(compat,/var V=g\.SJCostingV1;if\(!V\)return false;loginKey=key;/);
});
