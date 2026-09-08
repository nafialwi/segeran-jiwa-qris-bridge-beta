import {
  calculateExpectedCash,
  constantTimeStringEqual,
  isAllowedOrigin,
  json,
  makeId,
  normalizeOperationId,
  normalizeSnapshot,
  quoteSale,
  sha256Hex,
  signEmergencyToken,
  toMoney,
  verifyEmergencyToken,
} from './core.js';

const PROD_HOST = 'segeran-jiwa-pos-preview.pages.dev';
const TOKEN_TTL_MS = 12 * 60 * 60 * 1000;
const AUTH_WINDOW_MS = 15 * 60 * 1000;
const AUTH_LOCK_MS = 30 * 60 * 1000;
const AUTH_MAX_FAILURES = 5;

function corsFor(request) {
  const origin = request.headers.get('origin') || '';
  if (!isAllowedOrigin(origin, PROD_HOST)) return null;
  return {
    'access-control-allow-origin': origin,
    'access-control-allow-methods': 'GET,POST,OPTIONS',
    'access-control-allow-headers': 'authorization,content-type',
    'access-control-max-age': '600',
    vary: 'Origin',
  };
}

function withCors(response, cors) {
  if (!cors) return response;
  const headers = new Headers(response.headers);
  for (const [k, v] of Object.entries(cors)) headers.set(k, v);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

function requireEnv(env) {
  if (!env?.SJ_EMERGENCY_DB) throw new Error('D1 binding SJ_EMERGENCY_DB belum tersedia');
  if (!env?.SJ_EMERGENCY_OWNER_KEY || !env?.SJ_EMERGENCY_SIGNING_KEY) throw new Error('Secret emergency belum tersedia');
}

async function bodyJson(request) {
  try { return await request.json(); } catch { throw new Error('Body JSON tidak valid'); }
}

async function actorFromRequest(request, env) {
  const auth = request.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  return verifyEmergencyToken(token, env.SJ_EMERGENCY_SIGNING_KEY);
}

async function getActiveSnapshot(env) {
  const row = await env.SJ_EMERGENCY_DB.prepare(
    'SELECT id, payload_json, checksum, created_at FROM emg_master_snapshots WHERE active=1 ORDER BY created_at DESC LIMIT 1'
  ).first();
  if (!row) throw new Error('Snapshot darurat belum disiapkan');
  return { id: row.id, checksum: row.checksum, createdAt: row.created_at, snapshot: JSON.parse(row.payload_json) };
}

async function authFingerprint(request, env) {
  const ip = request.headers.get('cf-connecting-ip') || 'unknown';
  return sha256Hex(`${env.SJ_EMERGENCY_SIGNING_KEY}:${ip}`);
}

async function handleAuth(request, env) {
  const payload = await bodyJson(request);
  const ownerKey = String(payload?.ownerKey || '').trim();
  const actorId = String(payload?.actorId || 'owner-emergency').trim().slice(0, 100) || 'owner-emergency';
  const actorName = String(payload?.actorName || 'OWNER').trim().slice(0, 120) || 'OWNER';
  const now = Date.now();
  const fingerprint = await authFingerprint(request, env);
  const attempt = await env.SJ_EMERGENCY_DB.prepare(
    'SELECT window_start, failures, locked_until FROM emg_auth_attempts WHERE fingerprint=?'
  ).bind(fingerprint).first();
  if (attempt?.locked_until && Number(attempt.locked_until) > now) {
    return json({ ok: false, error: 'Terlalu banyak percobaan. Coba lagi setelah lock berakhir.' }, 429);
  }

  const expectedHash = await sha256Hex(env.SJ_EMERGENCY_OWNER_KEY);
  const providedHash = await sha256Hex(ownerKey);
  if (!ownerKey || !constantTimeStringEqual(expectedHash, providedHash)) {
    let windowStart = Number(attempt?.window_start || now);
    let failures = Number(attempt?.failures || 0);
    if (now - windowStart > AUTH_WINDOW_MS) { windowStart = now; failures = 0; }
    failures += 1;
    const lockedUntil = failures >= AUTH_MAX_FAILURES ? now + AUTH_LOCK_MS : 0;
    await env.SJ_EMERGENCY_DB.prepare(
      `INSERT INTO emg_auth_attempts(fingerprint,window_start,failures,locked_until)
       VALUES(?,?,?,?)
       ON CONFLICT(fingerprint) DO UPDATE SET window_start=excluded.window_start,failures=excluded.failures,locked_until=excluded.locked_until`
    ).bind(fingerprint, windowStart, failures, lockedUntil).run();
    return json({ ok: false, error: failures >= AUTH_MAX_FAILURES ? 'Akses darurat dikunci sementara.' : 'Kunci Owner darurat salah.' }, 401);
  }

  await env.SJ_EMERGENCY_DB.prepare('DELETE FROM emg_auth_attempts WHERE fingerprint=?').bind(fingerprint).run();
  const tokenPayload = {
    sid: makeId('EMGSESSION'),
    actorId,
    actorName,
    role: 'manajemen',
    scope: 'emergency-owner',
    iat: now,
    exp: now + TOKEN_TTL_MS,
  };
  const token = await signEmergencyToken(tokenPayload, env.SJ_EMERGENCY_SIGNING_KEY);
  return json({ ok: true, token, expiresAt: new Date(tokenPayload.exp).toISOString(), actor: tokenPayload });
}

async function handleMasterSync(request, env, actor) {
  const raw = await bodyJson(request);
  const snapshot = normalizeSnapshot(raw?.snapshot || raw);
  const payloadJson = JSON.stringify(snapshot);
  const checksum = await sha256Hex(payloadJson);
  const id = makeId('EMGMASTER');
  const now = new Date().toISOString();
  const statements = [
    env.SJ_EMERGENCY_DB.prepare('UPDATE emg_master_snapshots SET active=0 WHERE active=1'),
    env.SJ_EMERGENCY_DB.prepare(
      'INSERT INTO emg_master_snapshots(id,created_at,created_by,version,payload_json,checksum,active) VALUES(?,?,?,?,?,?,1)'
    ).bind(id, now, actor.actorId, 1, payloadJson, checksum),
  ];
  for (const p of snapshot.products) {
    if (!p.trackStock || p.quantity == null) continue;
    statements.push(env.SJ_EMERGENCY_DB.prepare(
      `INSERT INTO emg_inventory_balance(product_id,qty,updated_at) VALUES(?,?,?)
       ON CONFLICT(product_id) DO UPDATE SET qty=excluded.qty,updated_at=excluded.updated_at`
    ).bind(p.id, p.quantity, now));
  }
  statements.push(env.SJ_EMERGENCY_DB.prepare(
    'INSERT INTO emg_audit(id,operation_id,action,actor_id,actor_name,detail_json,created_at,is_drill) VALUES(?,?,?,?,?,?,?,0)'
  ).bind(makeId('EMGAUD'), id, 'MASTER_SYNC', actor.actorId, actor.actorName, JSON.stringify({ checksum, products: snapshot.products.length }), now));
  await env.SJ_EMERGENCY_DB.batch(statements);
  return json({ ok: true, id, checksum, productCount: snapshot.products.length, createdAt: now });
}

async function handleMasterGet(env) {
  const active = await getActiveSnapshot(env);
  return json({ ok: true, ...active });
}

async function handleOpenShift(request, env, actor) {
  const p = await bodyJson(request);
  const operationId = normalizeOperationId(p.operationId);
  const existingOp = await env.SJ_EMERGENCY_DB.prepare('SELECT * FROM emg_shifts WHERE open_operation_id=?').bind(operationId).first();
  if (existingOp) return json({ ok: true, idempotent: true, shift: existingOp });
  const active = await env.SJ_EMERGENCY_DB.prepare("SELECT id FROM emg_shifts WHERE status='ACTIVE' ORDER BY opened_at DESC LIMIT 1").first();
  if (active) return json({ ok: false, error: 'Masih ada shift darurat aktif.' }, 409);
  const businessDate = String(p.businessDate || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(businessDate)) throw new Error('Tanggal shift tidak valid');
  const shiftCode = String(p.shiftCode || '').trim().toUpperCase().slice(0, 16);
  if (!shiftCode) throw new Error('Kode shift wajib');
  const openingCash = toMoney(p.openingCash || 0, 'kas awal');
  const cashierId = String(p.cashierId || actor.actorId).trim().slice(0, 100);
  const cashierName = String(p.cashierName || actor.actorName).trim().slice(0, 120);
  const isDrill = p.isDrill ? 1 : 0;
  const id = makeId('EMGSHIFT');
  const now = new Date().toISOString();
  await env.SJ_EMERGENCY_DB.batch([
    env.SJ_EMERGENCY_DB.prepare(
      `INSERT INTO emg_shifts(id,business_date,shift_code,status,cashier_id,cashier_name,opened_at,opening_cash,open_operation_id,is_drill)
       VALUES(?,?,?,'ACTIVE',?,?,?,?,?,?)`
    ).bind(id, businessDate, shiftCode, cashierId, cashierName, now, openingCash, operationId, isDrill),
    env.SJ_EMERGENCY_DB.prepare(
      `INSERT INTO emg_cash_events(id,operation_id,shift_id,kind,amount,note,created_at,actor_id,payload_json,reconciled_at,is_drill)
       VALUES(?,?,?,?,?,?,?,?,?,NULL,?)`
    ).bind(makeId('EMGCASH'), `${operationId}-OPENING`, id, 'OPENING', openingCash, 'Kas awal shift darurat', now, actor.actorId, '{}', isDrill),
    env.SJ_EMERGENCY_DB.prepare(
      'INSERT INTO emg_audit(id,operation_id,action,actor_id,actor_name,detail_json,created_at,is_drill) VALUES(?,?,?,?,?,?,?,?)'
    ).bind(makeId('EMGAUD'), operationId, 'SHIFT_OPEN', actor.actorId, actor.actorName, JSON.stringify({ id, businessDate, shiftCode, openingCash }), now, isDrill),
  ]);
  return json({ ok: true, shift: { id, businessDate, shiftCode, status: 'ACTIVE', cashierId, cashierName, openingCash, openedAt: now, isDrill: Boolean(isDrill) } });
}

async function handleActiveShift(env) {
  const row = await env.SJ_EMERGENCY_DB.prepare("SELECT * FROM emg_shifts WHERE status='ACTIVE' ORDER BY opened_at DESC LIMIT 1").first();
  return json({ ok: true, shift: row || null });
}

async function handleSale(request, env, actor) {
  const p = await bodyJson(request);
  const operationId = normalizeOperationId(p.operationId);
  const existing = await env.SJ_EMERGENCY_DB.prepare('SELECT * FROM emg_transactions WHERE operation_id=?').bind(operationId).first();
  if (existing) return json({ ok: true, idempotent: true, transaction: existing });
  const shift = await env.SJ_EMERGENCY_DB.prepare("SELECT * FROM emg_shifts WHERE id=? AND status='ACTIVE'").bind(String(p.shiftId || '')).first();
  if (!shift) return json({ ok: false, error: 'Shift darurat tidak aktif.' }, 409);
  const { snapshot } = await getActiveSnapshot(env);
  const quote = quoteSale(snapshot, p);
  for (const item of quote.items.filter((x) => x.trackStock)) {
    const balance = await env.SJ_EMERGENCY_DB.prepare('SELECT qty FROM emg_inventory_balance WHERE product_id=?').bind(item.productId).first();
    if (!balance || Number(balance.qty) < item.qty) return json({ ok: false, error: `Stok darurat ${item.productName} tidak cukup.` }, 409);
  }
  const txId = makeId('EMGTX');
  const now = new Date().toISOString();
  const isDrill = Number(shift.is_drill || 0);
  const statements = [
    env.SJ_EMERGENCY_DB.prepare(
      `INSERT INTO emg_transactions(id,operation_id,shift_id,created_at,cashier_id,cashier_name,method,subtotal,discount_total,total,cash_received,status,payload_json,reconciled_at,is_drill)
       VALUES(?,?,?,?,?,?,?,?,?,?,?,'COMPLETED',?,NULL,?)`
    ).bind(txId, operationId, shift.id, now, actor.actorId, actor.actorName, quote.method, quote.subtotal, quote.discountTotal, quote.total, quote.cashReceived, JSON.stringify({ quote }), isDrill),
  ];
  for (const item of quote.items) {
    statements.push(env.SJ_EMERGENCY_DB.prepare(
      `INSERT INTO emg_transaction_items(tx_id,product_id,product_name,qty,unit_price,cup_code,line_total,payload_json)
       VALUES(?,?,?,?,?,?,?,?)`
    ).bind(txId, item.productId, item.productName, item.qty, item.unitPrice, item.cupCode, item.lineTotal, '{}'));
    if (item.trackStock) {
      statements.push(env.SJ_EMERGENCY_DB.prepare(
        'UPDATE emg_inventory_balance SET qty=qty-?,updated_at=? WHERE product_id=?'
      ).bind(item.qty, now, item.productId));
    }
    statements.push(env.SJ_EMERGENCY_DB.prepare(
      `INSERT INTO emg_inventory_events(id,operation_id,shift_id,product_id,cup_code,delta,kind,created_at,actor_id,payload_json,reconciled_at,is_drill)
       VALUES(?,?,?,?,?,?,'SALE',?,?,?,NULL,?)`
    ).bind(makeId('EMGINV'), `${operationId}-${item.productId}`.slice(0, 96), shift.id, item.productId, item.cupCode || '', -item.qty, now, actor.actorId, '{}', isDrill));
  }
  statements.push(env.SJ_EMERGENCY_DB.prepare(
    'INSERT INTO emg_audit(id,operation_id,action,actor_id,actor_name,detail_json,created_at,is_drill) VALUES(?,?,?,?,?,?,?,?)'
  ).bind(makeId('EMGAUD'), operationId, 'SALE_COMPLETE', actor.actorId, actor.actorName, JSON.stringify({ txId, method: quote.method, total: quote.total }), now, isDrill));
  try {
    await env.SJ_EMERGENCY_DB.batch(statements);
  } catch (error) {
    const retry = await env.SJ_EMERGENCY_DB.prepare('SELECT * FROM emg_transactions WHERE operation_id=?').bind(operationId).first();
    if (retry) return json({ ok: true, idempotent: true, transaction: retry });
    throw error;
  }
  return json({ ok: true, transaction: { id: txId, operationId, shiftId: shift.id, createdAt: now, ...quote, isDrill: Boolean(isDrill) } });
}

async function handleExpense(request, env, actor) {
  const p = await bodyJson(request);
  const operationId = normalizeOperationId(p.operationId);
  const existing = await env.SJ_EMERGENCY_DB.prepare('SELECT * FROM emg_cash_events WHERE operation_id=?').bind(operationId).first();
  if (existing) return json({ ok: true, idempotent: true, event: existing });
  const shift = await env.SJ_EMERGENCY_DB.prepare("SELECT * FROM emg_shifts WHERE id=? AND status='ACTIVE'").bind(String(p.shiftId || '')).first();
  if (!shift) return json({ ok: false, error: 'Shift darurat tidak aktif.' }, 409);
  const amount = toMoney(p.amount, 'pengeluaran');
  if (amount <= 0) throw new Error('Pengeluaran harus lebih dari nol');
  const note = String(p.note || '').trim().slice(0, 300);
  if (!note) throw new Error('Keterangan pengeluaran wajib');
  const id = makeId('EMGCASH');
  const now = new Date().toISOString();
  const isDrill = Number(shift.is_drill || 0);
  await env.SJ_EMERGENCY_DB.batch([
    env.SJ_EMERGENCY_DB.prepare(
      `INSERT INTO emg_cash_events(id,operation_id,shift_id,kind,amount,note,created_at,actor_id,payload_json,reconciled_at,is_drill)
       VALUES(?,?,?,'EXPENSE',?,?,?,?,?,NULL,?)`
    ).bind(id, operationId, shift.id, amount, note, now, actor.actorId, '{}', isDrill),
    env.SJ_EMERGENCY_DB.prepare(
      'INSERT INTO emg_audit(id,operation_id,action,actor_id,actor_name,detail_json,created_at,is_drill) VALUES(?,?,?,?,?,?,?,?)'
    ).bind(makeId('EMGAUD'), operationId, 'EXPENSE', actor.actorId, actor.actorName, JSON.stringify({ id, shiftId: shift.id, amount, note }), now, isDrill),
  ]);
  return json({ ok: true, event: { id, operationId, shiftId: shift.id, amount, note, createdAt: now } });
}

async function shiftTotals(env, shiftId) {
  const cashSales = await env.SJ_EMERGENCY_DB.prepare("SELECT COALESCE(SUM(total),0) AS total FROM emg_transactions WHERE shift_id=? AND status='COMPLETED' AND method='TUNAI'").bind(shiftId).first();
  const cashIn = await env.SJ_EMERGENCY_DB.prepare("SELECT COALESCE(SUM(amount),0) AS total FROM emg_cash_events WHERE shift_id=? AND kind='CASH_IN'").bind(shiftId).first();
  const expenses = await env.SJ_EMERGENCY_DB.prepare("SELECT COALESCE(SUM(amount),0) AS total FROM emg_cash_events WHERE shift_id=? AND kind='EXPENSE'").bind(shiftId).first();
  const cashOut = await env.SJ_EMERGENCY_DB.prepare("SELECT COALESCE(SUM(amount),0) AS total FROM emg_cash_events WHERE shift_id=? AND kind='CASH_OUT'").bind(shiftId).first();
  const sales = await env.SJ_EMERGENCY_DB.prepare("SELECT COUNT(*) AS count,COALESCE(SUM(total),0) AS total FROM emg_transactions WHERE shift_id=? AND status='COMPLETED'").bind(shiftId).first();
  return {
    cashSales: Number(cashSales?.total || 0), cashIn: Number(cashIn?.total || 0), expenses: Number(expenses?.total || 0), cashOut: Number(cashOut?.total || 0),
    salesCount: Number(sales?.count || 0), salesTotal: Number(sales?.total || 0),
  };
}

async function handleCloseShift(request, env, actor) {
  const p = await bodyJson(request);
  const operationId = normalizeOperationId(p.operationId);
  const prior = await env.SJ_EMERGENCY_DB.prepare('SELECT * FROM emg_shifts WHERE close_operation_id=?').bind(operationId).first();
  if (prior) return json({ ok: true, idempotent: true, shift: prior });
  const shift = await env.SJ_EMERGENCY_DB.prepare("SELECT * FROM emg_shifts WHERE id=? AND status='ACTIVE'").bind(String(p.shiftId || '')).first();
  if (!shift) return json({ ok: false, error: 'Shift darurat tidak aktif atau sudah ditutup.' }, 409);
  const totals = await shiftTotals(env, shift.id);
  const expectedCash = calculateExpectedCash({ openingCash: shift.opening_cash, ...totals });
  const closingCash = toMoney(p.closingCash, 'kas aktual');
  const variance = closingCash - expectedCash;
  const note = String(p.note || '').trim().slice(0, 300);
  const now = new Date().toISOString();
  const isDrill = Number(shift.is_drill || 0);
  await env.SJ_EMERGENCY_DB.batch([
    env.SJ_EMERGENCY_DB.prepare(
      `UPDATE emg_shifts SET status='CLOSED',closed_at=?,closing_cash=?,expected_cash=?,variance=?,note=?,close_operation_id=? WHERE id=? AND status='ACTIVE'`
    ).bind(now, closingCash, expectedCash, variance, note, operationId, shift.id),
    env.SJ_EMERGENCY_DB.prepare(
      `INSERT INTO emg_cash_events(id,operation_id,shift_id,kind,amount,note,created_at,actor_id,payload_json,reconciled_at,is_drill)
       VALUES(?,?,?,'CLOSING',?,?,?,?,?,NULL,?)`
    ).bind(makeId('EMGCASH'), `${operationId}-CLOSING`, shift.id, closingCash, note || 'Closing shift darurat', now, actor.actorId, JSON.stringify({ expectedCash, variance }), isDrill),
    env.SJ_EMERGENCY_DB.prepare(
      'INSERT INTO emg_audit(id,operation_id,action,actor_id,actor_name,detail_json,created_at,is_drill) VALUES(?,?,?,?,?,?,?,?)'
    ).bind(makeId('EMGAUD'), operationId, 'SHIFT_CLOSE', actor.actorId, actor.actorName, JSON.stringify({ shiftId: shift.id, expectedCash, closingCash, variance, ...totals }), now, isDrill),
  ]);
  return json({ ok: true, shift: { ...shift, status: 'CLOSED', closed_at: now, closing_cash: closingCash, expected_cash: expectedCash, variance }, totals });
}

async function handleSummary(env) {
  const shift = await env.SJ_EMERGENCY_DB.prepare("SELECT * FROM emg_shifts WHERE status='ACTIVE' ORDER BY opened_at DESC LIMIT 1").first();
  if (!shift) return json({ ok: true, shift: null, totals: null });
  return json({ ok: true, shift, totals: await shiftTotals(env, shift.id) });
}

async function handleDrill(env, actor) {
  const id = makeId('EMGDRILL');
  const now = new Date().toISOString();
  await env.SJ_EMERGENCY_DB.batch([
    env.SJ_EMERGENCY_DB.prepare(
      'INSERT INTO emg_audit(id,operation_id,action,actor_id,actor_name,detail_json,created_at,is_drill) VALUES(?,?,?,?,?,?,?,1)'
    ).bind(id, id, 'PROVISION_DRILL', actor.actorId, actor.actorName, '{}', now),
    env.SJ_EMERGENCY_DB.prepare('DELETE FROM emg_audit WHERE id=?').bind(id),
  ]);
  return json({ ok: true, drill: 'PASS', at: now });
}

async function route(request, env) {
  requireEnv(env);
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, '') || '/';
  if (request.method === 'GET' && path === '/v1/health') {
    const schema = await env.SJ_EMERGENCY_DB.prepare("SELECT value FROM emg_meta WHERE key='schema_version'").first();
    return json({ ok: true, service: 'segeran-jiwa-emergency', schemaVersion: Number(schema?.value || 0), time: new Date().toISOString() });
  }
  if (request.method === 'POST' && path === '/v1/auth') return handleAuth(request, env);
  const actor = await actorFromRequest(request, env);
  if (request.method === 'GET' && path === '/v1/status') return json({ ok: true, actor, ...(await getActiveSnapshot(env).then((x) => ({ masterId: x.id, masterCreatedAt: x.createdAt })).catch(() => ({ masterId: null }))) });
  if (request.method === 'POST' && path === '/v1/master/sync') return handleMasterSync(request, env, actor);
  if (request.method === 'GET' && path === '/v1/master') return handleMasterGet(env);
  if (request.method === 'POST' && path === '/v1/shifts/open') return handleOpenShift(request, env, actor);
  if (request.method === 'GET' && path === '/v1/shifts/active') return handleActiveShift(env);
  if (request.method === 'POST' && path === '/v1/shifts/close') return handleCloseShift(request, env, actor);
  if (request.method === 'POST' && path === '/v1/sales') return handleSale(request, env, actor);
  if (request.method === 'POST' && path === '/v1/expenses') return handleExpense(request, env, actor);
  if (request.method === 'GET' && path === '/v1/summary') return handleSummary(env);
  if (request.method === 'POST' && path === '/v1/drill') return handleDrill(env, actor);
  return json({ ok: false, error: 'Endpoint tidak ditemukan' }, 404);
}

export default {
  async fetch(request, env) {
    const cors = corsFor(request);
    if (request.method === 'OPTIONS') {
      if (!cors) return json({ ok: false, error: 'Origin tidak diizinkan' }, 403);
      return withCors(new Response(null, { status: 204 }), cors);
    }
    if (!cors) return json({ ok: false, error: 'Origin tidak diizinkan' }, 403);
    try {
      return withCors(await route(request, env), cors);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Kesalahan internal';
      const status = /Token|Scope|kedaluwarsa|authorization/i.test(message) ? 401 : 400;
      return withCors(json({ ok: false, error: message }, status), cors);
    }
  },
};
