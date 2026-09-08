const textEncoder = new TextEncoder();

export function clampString(value, max = 160) {
  return String(value ?? '').trim().slice(0, max);
}

export function toMoney(value, field = 'amount') {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) throw new Error(`${field} tidak valid`);
  return Math.round(n);
}

export function toQty(value, field = 'qty') {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0 || n > 999) throw new Error(`${field} tidak valid`);
  return Math.round(n * 1000) / 1000;
}

export function isAllowedOrigin(origin, productionHost = 'segeran-jiwa-pos-preview.pages.dev') {
  if (!origin) return false;
  try {
    const url = new URL(origin);
    if (url.protocol !== 'https:') return false;
    return url.hostname === productionHost || url.hostname.endsWith(`.${productionHost}`);
  } catch {
    return false;
  }
}

export function normalizeOperationId(value) {
  const id = clampString(value, 96).toUpperCase();
  if (!/^EMG-[A-Z0-9-]{8,92}$/.test(id)) throw new Error('operationId tidak valid');
  return id;
}

export function normalizeSnapshot(input) {
  if (!input || typeof input !== 'object') throw new Error('snapshot tidak valid');
  const categoriesIn = Array.isArray(input.categories) ? input.categories : [];
  const productsIn = Array.isArray(input.products) ? input.products : [];
  const usersIn = Array.isArray(input.users) ? input.users : [];

  const categories = categoriesIn.slice(0, 100).map((x, idx) => ({
    id: clampString(x?.id || x?.code || `cat-${idx + 1}`, 80),
    name: clampString(x?.name || x?.nama || x?.n || `Kategori ${idx + 1}`, 120),
    order: Number.isFinite(Number(x?.order)) ? Number(x.order) : idx,
  }));

  const products = productsIn.slice(0, 1000).map((x, idx) => {
    const id = clampString(x?.id || x?.code || x?.sku || `product-${idx + 1}`, 100);
    const name = clampString(x?.name || x?.nama || x?.n, 160);
    if (!id || !name) throw new Error('produk snapshot tidak valid');
    const price = toMoney(x?.price ?? x?.harga ?? x?.p ?? 0, `harga ${name}`);
    const quantityRaw = x?.quantity ?? x?.stock ?? x?.stok;
    const quantity = quantityRaw == null || quantityRaw === '' ? null : Number(quantityRaw);
    return {
      id,
      name,
      price,
      category: clampString(x?.category || x?.kategori || x?.c || '', 100),
      cupCode: clampString(x?.cupCode || x?.cp || '', 32),
      trackStock: Boolean(x?.trackStock ?? x?.track_stock ?? x?.stockTracked ?? false),
      quantity: Number.isFinite(quantity) ? Math.max(0, Math.round(quantity * 1000) / 1000) : null,
      active: x?.active !== false,
      order: Number.isFinite(Number(x?.order)) ? Number(x.order) : idx,
    };
  }).filter((x) => x.active);

  const users = usersIn.slice(0, 100).map((x, idx) => ({
    id: clampString(x?.id || x?.uid || `user-${idx + 1}`, 100),
    name: clampString(x?.name || x?.nama || x?.n || `User ${idx + 1}`, 120),
    role: clampString(x?.role || x?.r || '', 40),
  }));

  const qrisRaw = clampString(input?.store?.qris || input?.qris || '', 600000);
  const safeQris = /^(data:image\/(png|jpeg|jpg|webp);base64,|https:\/\/)/i.test(qrisRaw) ? qrisRaw : '';

  return {
    version: 1,
    capturedAt: clampString(input.capturedAt || new Date().toISOString(), 64),
    store: {
      name: clampString(input?.store?.name || input?.storeName || 'Segeran Jiwa', 160),
      qris: safeQris,
    },
    categories,
    products,
    users,
  };
}

export function quoteSale(snapshot, payload) {
  const method = clampString(payload?.method, 20).toUpperCase();
  if (!['TUNAI', 'TRANSFER', 'QRIS'].includes(method)) throw new Error('Metode pembayaran tidak didukung di mode darurat');
  const itemIn = Array.isArray(payload?.items) ? payload.items : [];
  if (!itemIn.length || itemIn.length > 50) throw new Error('Keranjang mode darurat tidak valid');
  const productMap = new Map((snapshot?.products || []).map((p) => [String(p.id), p]));
  const aggregated = new Map();
  for (const line of itemIn) {
    const product = productMap.get(String(line?.productId || line?.id || ''));
    if (!product) throw new Error('Produk tidak tersedia pada snapshot darurat');
    const qty = toQty(line?.qty);
    aggregated.set(product.id, { product, qty: (aggregated.get(product.id)?.qty || 0) + qty });
  }
  let total = 0;
  const items = Array.from(aggregated.values()).map(({ product, qty }) => {
    qty = toQty(qty);
    const lineTotal = Math.round(product.price * qty);
    total += lineTotal;
    return {
      productId: product.id,
      productName: product.name,
      qty,
      unitPrice: product.price,
      lineTotal,
      cupCode: product.cupCode || '',
      trackStock: Boolean(product.trackStock),
    };
  });
  const cashReceived = method === 'TUNAI' ? toMoney(payload?.cashReceived ?? total, 'uang diterima') : total;
  if (method === 'TUNAI' && cashReceived < total) throw new Error('Uang diterima kurang dari total');
  return { method, items, subtotal: total, discountTotal: 0, total, cashReceived, change: Math.max(0, cashReceived - total) };
}

export function calculateExpectedCash({ openingCash = 0, cashSales = 0, cashIn = 0, expenses = 0, cashOut = 0 }) {
  return toMoney(openingCash) + toMoney(cashSales) + toMoney(cashIn) - toMoney(expenses) - toMoney(cashOut);
}

export function makeId(prefix = 'EMG') {
  const rand = crypto.getRandomValues(new Uint8Array(8));
  const hex = Array.from(rand, (x) => x.toString(16).padStart(2, '0')).join('').toUpperCase();
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${hex}`;
}

export function base64urlEncode(bytesOrString) {
  const bytes = typeof bytesOrString === 'string' ? textEncoder.encode(bytesOrString) : bytesOrString;
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export function base64urlDecodeToString(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const pad = normalized + '='.repeat((4 - normalized.length % 4) % 4);
  const binary = atob(pad);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

async function hmacBytes(secret, message) {
  const key = await crypto.subtle.importKey('raw', textEncoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
  const sig = await crypto.subtle.sign('HMAC', key, textEncoder.encode(message));
  return new Uint8Array(sig);
}

export async function signEmergencyToken(payload, secret) {
  const body = base64urlEncode(JSON.stringify(payload));
  const signature = base64urlEncode(await hmacBytes(secret, body));
  return `${body}.${signature}`;
}

export async function verifyEmergencyToken(token, secret, now = Date.now()) {
  if (!token || typeof token !== 'string' || !token.includes('.')) throw new Error('Token darurat tidak valid');
  const [body, signature] = token.split('.', 2);
  const expected = base64urlEncode(await hmacBytes(secret, body));
  if (!constantTimeStringEqual(expected, signature)) throw new Error('Token darurat tidak valid');
  const payload = JSON.parse(base64urlDecodeToString(body));
  if (!payload?.exp || Number(payload.exp) <= now) throw new Error('Token darurat kedaluwarsa');
  if (payload.scope !== 'emergency-owner') throw new Error('Scope token tidak valid');
  return payload;
}

export function constantTimeStringEqual(a, b) {
  const aa = String(a ?? '');
  const bb = String(b ?? '');
  let diff = aa.length ^ bb.length;
  const len = Math.max(aa.length, bb.length);
  for (let i = 0; i < len; i += 1) diff |= (aa.charCodeAt(i) || 0) ^ (bb.charCodeAt(i) || 0);
  return diff === 0;
}

export async function sha256Hex(value) {
  const digest = await crypto.subtle.digest('SHA-256', textEncoder.encode(String(value)));
  return Array.from(new Uint8Array(digest), (x) => x.toString(16).padStart(2, '0')).join('');
}

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers },
  });
}
