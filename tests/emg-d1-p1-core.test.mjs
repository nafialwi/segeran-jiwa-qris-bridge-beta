import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateExpectedCash,
  isAllowedOrigin,
  normalizeOperationId,
  normalizeSnapshot,
  quoteSale,
  signEmergencyToken,
  verifyEmergencyToken,
} from '../emergency-d1/src/core.js';

test('EMG-D1 P1 origin hanya mengizinkan Production dan hashed Preview Segeran Jiwa', () => {
  assert.equal(isAllowedOrigin('https://segeran-jiwa-pos-preview.pages.dev'), true);
  assert.equal(isAllowedOrigin('https://abc123.segeran-jiwa-pos-preview.pages.dev'), true);
  assert.equal(isAllowedOrigin('http://segeran-jiwa-pos-preview.pages.dev'), false);
  assert.equal(isAllowedOrigin('https://evil.pages.dev'), false);
});

test('EMG-D1 P1 snapshot membersihkan kredensial user dan mempertahankan mapping cup', () => {
  const snap = normalizeSnapshot({
    store: { name: 'Segeran Jiwa', qris: 'https://example.com/qris.png' },
    products: [{ id: 'kopi', name: 'Kopi', price: 10000, cupCode: 'c10p', trackStock: true, quantity: 7 }],
    users: [{ id: 'u1', name: 'Owner', role: 'manajemen', pin: '1234', password: 'secret' }],
  });
  assert.equal(snap.products[0].cupCode, 'c10p');
  assert.equal(snap.products[0].quantity, 7);
  assert.deepEqual(Object.keys(snap.users[0]).sort(), ['id', 'name', 'role']);
  assert.equal(JSON.stringify(snap).includes('1234'), false);
  assert.equal(JSON.stringify(snap).includes('secret'), false);
});

test('EMG-D1 P1 sale quote memakai harga snapshot server, bukan harga client', () => {
  const snapshot = normalizeSnapshot({ products: [{ id: 'p1', name: 'Es', price: 12000, cupCode: 'c10p' }] });
  const quote = quoteSale(snapshot, { method: 'QRIS', items: [{ productId: 'p1', qty: 2, price: 1 }] });
  assert.equal(quote.total, 24000);
  assert.equal(quote.items[0].unitPrice, 12000);
  assert.equal(quote.items[0].cupCode, 'c10p');
});

test('EMG-D1 P1 duplicate product lines digabung sebelum ledger dan stok', () => {
  const snapshot = normalizeSnapshot({ products: [{ id: 'p1', name: 'Es', price: 12000, cupCode: 'c10p', trackStock: true, quantity: 10 }] });
  const quote = quoteSale(snapshot, { method: 'TUNAI', cashReceived: 50000, items: [{ productId: 'p1', qty: 1 }, { productId: 'p1', qty: 2 }] });
  assert.equal(quote.items.length, 1);
  assert.equal(quote.items[0].qty, 3);
  assert.equal(quote.items[0].lineTotal, 36000);
  assert.equal(quote.total, 36000);
  assert.equal(quote.change, 14000);
});

test('EMG-D1 P1 kas tutup dihitung deterministik', () => {
  assert.equal(calculateExpectedCash({ openingCash: 80000, cashSales: 500000, cashIn: 20000, expenses: 30000, cashOut: 10000 }), 560000);
});

test('EMG-D1 P1 operationId fail-closed', () => {
  assert.equal(normalizeOperationId('EMG-SALE-ABCDEF12'), 'EMG-SALE-ABCDEF12');
  assert.throws(() => normalizeOperationId('sale-1'));
});

test('EMG-D1 P1 token HMAC menolak tamper dan expiry', async () => {
  const secret = '0123456789abcdef0123456789abcdef';
  const now = Date.now();
  const token = await signEmergencyToken({ scope: 'emergency-owner', exp: now + 60000, actorId: 'owner' }, secret);
  const decoded = await verifyEmergencyToken(token, secret, now);
  assert.equal(decoded.actorId, 'owner');
  await assert.rejects(() => verifyEmergencyToken(`${token}x`, secret, now));
  await assert.rejects(() => verifyEmergencyToken(token, secret, now + 120000));
});
