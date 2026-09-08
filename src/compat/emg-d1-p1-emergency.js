(function () {
  'use strict';

  const VERSION = 'EMG-D1-P1';
    const PROD_HOST = 'segeran-jiwa-pos-preview.pages.dev';
  const state = { token: '', mode: false, snapshot: null, shift: null, cart: Object.create(null), lastReceipt: null };

  const money = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(n || 0));
  const esc = (s) => String(s ?? '').replace(/[&<>'"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));
  const apiBase = () => String(window.SJEmergencyD1Config?.apiBase || '').replace(/\/$/, '');
  const isDrillHost = () => location.hostname !== PROD_HOST;
  const opId = (kind) => `EMG-${kind}-${Date.now().toString(36).toUpperCase()}-${crypto.getRandomValues(new Uint32Array(2)).join('-')}`;
  const detach = (el) => { if (el && el.parentNode) el.parentNode.removeChild(el); };

  async function api(path, options = {}, auth = true) {
    if (!apiBase()) throw new Error('Emergency API belum dikonfigurasi.');
    const headers = { 'content-type': 'application/json', ...(options.headers || {}) };
    if (auth) {
      if (!state.token) throw new Error('Autentikasi darurat diperlukan.');
      headers.authorization = `Bearer ${state.token}`;
    }
    const res = await fetch(`${apiBase()}${path}`, { ...options, headers, cache: 'no-store' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.ok === false) {
      if (res.status === 401) state.token = '';
      throw new Error(data.error || `Emergency API HTTP ${res.status}`);
    }
    return data;
  }

  function styles() {
    if (document.getElementById('sj-emg-d1-style')) return;
    const style = document.createElement('style');
    style.id = 'sj-emg-d1-style';
    style.textContent = `
      #sj-emg-launch{position:fixed;right:14px;bottom:82px;z-index:19990;border:0;border-radius:999px;background:#7f1d1d;color:#fff;padding:10px 14px;font:700 12px/1.2 system-ui;box-shadow:0 8px 25px #0004}
      #sj-emg-overlay{position:fixed;inset:0;z-index:20000;background:#f5f7fb;color:#172033;font-family:system-ui,-apple-system,sans-serif;overflow:auto}
      .sj-emg-top{position:sticky;top:0;z-index:2;background:#fff;border-bottom:1px solid #dbe2ea;padding:12px 14px;display:flex;gap:10px;align-items:center;justify-content:space-between}
      .sj-emg-title{font-weight:900}.sj-emg-sub{font-size:11px;color:#64748b}.sj-emg-wrap{max-width:760px;margin:auto;padding:12px 12px 90px}
      .sj-emg-card{background:#fff;border:1px solid #dce4ed;border-radius:16px;padding:14px;margin:10px 0;box-shadow:0 2px 10px #0000000a}
      .sj-emg-row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.sj-emg-grow{flex:1}.sj-emg-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}
      .sj-emg-btn{border:0;border-radius:11px;background:#1e293b;color:#fff;padding:10px 12px;font-weight:800}.sj-emg-btn.alt{background:#e2e8f0;color:#172033}.sj-emg-btn.danger{background:#991b1b}.sj-emg-btn.ok{background:#166534}.sj-emg-btn:disabled{opacity:.5}
      .sj-emg-input,.sj-emg-select{width:100%;box-sizing:border-box;border:1px solid #cbd5e1;border-radius:10px;padding:10px;background:#fff;margin:5px 0 9px;font-size:14px}
      .sj-emg-label{font-size:11px;font-weight:800;color:#475569;text-transform:uppercase;letter-spacing:.04em}
      .sj-emg-pill{display:inline-block;border-radius:999px;padding:5px 8px;font-size:10px;font-weight:900;background:#e2e8f0}.sj-emg-pill.on{background:#fee2e2;color:#991b1b}.sj-emg-pill.good{background:#dcfce7;color:#166534}
      .sj-emg-product{border:1px solid #dbe2ea;border-radius:13px;padding:10px;background:#fff}.sj-emg-product b{display:block}.sj-emg-product small{color:#64748b}
      .sj-emg-cartline{display:flex;gap:8px;align-items:center;border-bottom:1px dashed #e2e8f0;padding:7px 0}.sj-emg-cartline:last-child{border:0}
      .sj-emg-tabs{display:flex;gap:6px;overflow:auto;padding-bottom:3px}.sj-emg-tab{white-space:nowrap;border:1px solid #cbd5e1;background:#fff;border-radius:999px;padding:7px 10px;font-weight:800;font-size:12px}.sj-emg-tab.active{background:#172033;color:#fff}
      .sj-emg-note{font-size:12px;line-height:1.45;color:#475569}.sj-emg-alert{padding:10px;border-radius:10px;background:#fff7ed;color:#9a3412;font-size:12px}.sj-emg-success{padding:10px;border-radius:10px;background:#ecfdf5;color:#166534;font-size:12px}
      #sj-emg-toast{position:fixed;left:50%;bottom:22px;transform:translateX(-50%);z-index:21000;background:#111827;color:#fff;border-radius:10px;padding:9px 12px;font:700 12px system-ui;max-width:90vw}
      @media(max-width:520px){.sj-emg-grid{grid-template-columns:1fr 1fr}.sj-emg-top{align-items:flex-start}.sj-emg-wrap{padding-left:9px;padding-right:9px}}
    `;
    document.head.appendChild(style);
  }

  function toast(message) {
    detach(document.getElementById('sj-emg-toast'));
    const el = document.createElement('div'); el.id = 'sj-emg-toast'; el.textContent = message; document.body.appendChild(el); setTimeout(() => detach(el), 3600);
  }

  function cachedGlobal() {
    return (window.cloudData && window.cloudData.global) || {};
  }

  function pickMenu(raw) {
    if (Array.isArray(raw)) return raw;
    if (raw && typeof raw === 'object') return Object.entries(raw).map(([id, x]) => ({ id, ...(x || {}) }));
    return [];
  }

  function inventoryQty(globalData, productId) {
    const inv = globalData.inventory || {};
    const row = inv?.[productId];
    if (typeof row === 'number') return row;
    if (row && typeof row === 'object') {
      const values = ['qty', 'stock', 'stok', 'geraiQty', 'available'].map((k) => Number(row[k])).filter(Number.isFinite);
      if (values.length) return values[0];
    }
    return null;
  }

  function buildSnapshotFromCache() {
    const g = cachedGlobal();
    const menu = pickMenu(g.menu || g.products || g.produk);
    const categoriesRaw = g.kategori || g.categories || [];
    const categories = Array.isArray(categoriesRaw)
      ? categoriesRaw.map((x, i) => ({ id: x?.id || x?.code || `cat-${i + 1}`, name: x?.name || x?.nama || x?.n || String(x) }))
      : Object.entries(categoriesRaw || {}).map(([id, x]) => ({ id, name: x?.name || x?.nama || x?.n || String(x || id) }));
    const usersRaw = g.users || g.user || g.karyawan || {};
    const users = Array.isArray(usersRaw)
      ? usersRaw.map((x, i) => ({ id: x?.id || x?.uid || `user-${i + 1}`, name: x?.name || x?.nama || x?.n || '', role: x?.role || x?.r || '' }))
      : Object.entries(usersRaw || {}).map(([id, x]) => ({ id, name: x?.name || x?.nama || x?.n || id, role: x?.role || x?.r || '' }));
    const settings = g.settings || g.pengaturan || {};
    return {
      version: 1,
      capturedAt: new Date().toISOString(),
      store: { name: settings.namaToko || settings.storeName || 'Segeran Jiwa', qris: settings.qris || settings.qrisImage || g.qris || '' },
      categories,
      products: menu.filter((p) => p && p.active !== false && p.deleted !== true).map((p, i) => ({
        id: p.id || p.code || p.sku || `product-${i + 1}`,
        name: p.name || p.nama || p.n || '', price: Number(p.price ?? p.harga ?? p.p ?? 0), category: p.category || p.kategori || p.c || '',
        cupCode: p.cupCode || p.cp || '', trackStock: Boolean(p.trackStock || p.track_stock || p.stockTracked), quantity: inventoryQty(g, p.id || p.code || p.sku), order: p.order ?? i,
      })),
      users: users.map((u) => ({ id: u.id, name: u.name, role: u.role })),
    };
  }

  async function authenticate(ownerKey, actorId, actorName) {
    const data = await api('/v1/auth', { method: 'POST', body: JSON.stringify({ ownerKey, actorId, actorName }) }, false);
    state.token = data.token; return data;
  }

  async function ensureAuth() {
    if (state.token) return true;
    return new Promise((resolve) => {
      styles();
      const box = document.createElement('div'); box.id = 'sj-emg-auth'; box.innerHTML = `
        <div style="position:fixed;inset:0;z-index:20500;background:#0009;display:grid;place-items:center;padding:15px">
          <div class="sj-emg-card" style="max-width:380px;width:100%">
            <div class="sj-emg-title">Akses Mode Darurat D1</div><p class="sj-emg-note">Firebase tetap database utama. Kunci ini hanya membuka backend darurat Cloudflare D1.</p>
            <label class="sj-emg-label">Kunci Owner Darurat</label><input id="sj-emg-key" class="sj-emg-input" type="password" autocomplete="off">
            <label class="sj-emg-label">ID Operator</label><input id="sj-emg-actor-id" class="sj-emg-input" value="${esc(window.currentLoginId || 'owner-emergency')}">
            <label class="sj-emg-label">Nama Operator</label><input id="sj-emg-actor-name" class="sj-emg-input" value="${esc(window.currentUserName || 'OWNER')}">
            <div class="sj-emg-row"><button id="sj-emg-auth-go" class="sj-emg-btn ok sj-emg-grow">BUKA AKSES</button><button id="sj-emg-auth-cancel" class="sj-emg-btn alt">BATAL</button></div>
          </div>
        </div>`;
      document.body.appendChild(box);
      box.querySelector('#sj-emg-auth-cancel').onclick = () => { detach(box); resolve(false); };
      box.querySelector('#sj-emg-auth-go').onclick = async () => {
        const btn = box.querySelector('#sj-emg-auth-go'); btn.disabled = true;
        try {
          await authenticate(box.querySelector('#sj-emg-key').value, box.querySelector('#sj-emg-actor-id').value, box.querySelector('#sj-emg-actor-name').value);
          detach(box); toast('Akses D1 darurat aktif'); resolve(true);
        } catch (e) { alert(e.message); btn.disabled = false; }
      };
    });
  }

  async function refreshEmergencyData() {
    const [master, active] = await Promise.all([api('/v1/master'), api('/v1/shifts/active')]);
    state.snapshot = master.snapshot; state.shift = active.shift || null;
  }

  function cartLines() {
    if (!state.snapshot) return [];
    const byId = Object.create(null);
    for (const p of state.snapshot.products) byId[String(p.id)] = p;
    return Object.entries(state.cart).map(([id, qty]) => ({ product: byId[String(id)], qty })).filter((x) => x.product && x.qty > 0);
  }

  function cartTotal() { return cartLines().reduce((sum, x) => sum + Number(x.product.price || 0) * x.qty, 0); }

  function renderProducts(query = '') {
    const target = document.getElementById('sj-emg-products'); if (!target || !state.snapshot) return;
    const q = query.trim().toLowerCase();
    const list = state.snapshot.products.filter((p) => !q || p.name.toLowerCase().includes(q) || String(p.category).toLowerCase().includes(q));
    target.innerHTML = list.slice(0, 120).map((p) => `<div class="sj-emg-product"><b>${esc(p.name)}</b><small>${money(p.price)}${p.cupCode ? ` • ${esc(p.cupCode)}` : ''}${p.trackStock && p.quantity != null ? ` • Stok snapshot ${esc(p.quantity)}` : ''}</small><button class="sj-emg-btn alt" data-emg-add="${esc(p.id)}" style="width:100%;margin-top:7px">+ Tambah</button></div>`).join('') || '<div class="sj-emg-note">Produk tidak ditemukan.</div>';
    target.querySelectorAll('[data-emg-add]').forEach((b) => b.onclick = () => { const id = b.dataset.emgAdd; state.cart[id] = Number(state.cart[id] || 0) + 1; renderCart(); });
  }

  function renderCart() {
    const target = document.getElementById('sj-emg-cart'); if (!target) return;
    const lines = cartLines();
    target.innerHTML = lines.length ? lines.map(({ product: p, qty }) => `<div class="sj-emg-cartline"><div class="sj-emg-grow"><b>${esc(p.name)}</b><div class="sj-emg-note">${qty} × ${money(p.price)}</div></div><button class="sj-emg-btn alt" data-emg-minus="${esc(p.id)}">−</button><b>${money(p.price * qty)}</b></div>`).join('') : '<div class="sj-emg-note">Keranjang kosong.</div>';
    target.querySelectorAll('[data-emg-minus]').forEach((b) => b.onclick = () => { const id = b.dataset.emgMinus; const next = Number(state.cart[id] || 0) - 1; if (next > 0) state.cart[id] = next; else delete state.cart[id]; renderCart(); });
    document.getElementById('sj-emg-cart-total') && (document.getElementById('sj-emg-cart-total').textContent = money(cartTotal()));
  }

  async function syncMaster() {
    if (window.currentUserRole && window.currentUserRole !== 'manajemen') throw new Error('Hanya Owner/Manajemen yang boleh memperbarui snapshot darurat.');
    const snapshot = buildSnapshotFromCache();
    if (!snapshot.products.length) throw new Error('Data produk lokal belum tersedia. Buka POS normal terlebih dahulu.');
    const result = await api('/v1/master/sync', { method: 'POST', body: JSON.stringify({ snapshot }) });
    toast(`Snapshot darurat diperbarui: ${result.productCount} produk`); return result;
  }

  async function openShiftFromForm() {
    const businessDate = document.getElementById('sj-emg-shift-date').value;
    const shiftCode = document.getElementById('sj-emg-shift-code').value;
    const openingCash = Number(document.getElementById('sj-emg-opening-cash').value || 0);
    const cashierId = document.getElementById('sj-emg-cashier-id').value;
    const cashierName = document.getElementById('sj-emg-cashier-name').value;
    await api('/v1/shifts/open', { method: 'POST', body: JSON.stringify({ operationId: opId('SHIFT-OPEN'), businessDate, shiftCode, openingCash, cashierId, cashierName, isDrill: isDrillHost() }) });
    await refreshEmergencyData(); renderOverlay('shift'); toast('Shift darurat dibuka');
  }

  async function submitExpense() {
    if (!state.shift) throw new Error('Buka shift darurat terlebih dahulu.');
    const amount = Number(document.getElementById('sj-emg-expense-amount').value || 0);
    const note = document.getElementById('sj-emg-expense-note').value;
    await api('/v1/expenses', { method: 'POST', body: JSON.stringify({ operationId: opId('EXPENSE'), shiftId: state.shift.id, amount, note }) });
    document.getElementById('sj-emg-expense-amount').value = ''; document.getElementById('sj-emg-expense-note').value = ''; toast('Pengeluaran darurat tersimpan');
  }

  async function closeShiftFromForm() {
    if (!state.shift) throw new Error('Tidak ada shift darurat aktif.');
    const closingCash = Number(document.getElementById('sj-emg-closing-cash').value || 0);
    const note = document.getElementById('sj-emg-closing-note').value;
    if (!confirm('Tutup shift D1 darurat sekarang?')) return;
    const data = await api('/v1/shifts/close', { method: 'POST', body: JSON.stringify({ operationId: opId('SHIFT-CLOSE'), shiftId: state.shift.id, closingCash, note }) });
    state.shift = null; alert(`Shift darurat ditutup.\nKas seharusnya: ${money(data.shift.expected_cash)}\nKas aktual: ${money(data.shift.closing_cash)}\nSelisih: ${money(data.shift.variance)}`); renderOverlay('shift');
  }

  function paymentDialog() {
    if (!state.shift) return alert('Buka shift darurat terlebih dahulu.');
    if (!cartLines().length) return alert('Keranjang kosong.');
    const total = cartTotal();
    const qris = state.snapshot?.store?.qris || '';
    const box = document.createElement('div'); box.innerHTML = `<div style="position:fixed;inset:0;z-index:20500;background:#0009;display:grid;place-items:center;padding:12px"><div class="sj-emg-card" style="width:min(420px,96vw)"><div class="sj-emg-title">Pembayaran Darurat</div><div style="font-size:24px;font-weight:900;margin:8px 0">${money(total)}</div><label class="sj-emg-label">Metode</label><select id="sj-emg-pay-method" class="sj-emg-select"><option>TUNAI</option><option>TRANSFER</option><option>QRIS</option></select><div id="sj-emg-pay-extra"></div><div class="sj-emg-row"><button id="sj-emg-pay-ok" class="sj-emg-btn ok sj-emg-grow">KONFIRMASI & SIMPAN D1</button><button id="sj-emg-pay-cancel" class="sj-emg-btn alt">BATAL</button></div></div></div>`; document.body.appendChild(box);
    const method = box.querySelector('#sj-emg-pay-method'); const extra = box.querySelector('#sj-emg-pay-extra');
    const renderExtra = () => { if (method.value === 'TUNAI') extra.innerHTML = `<label class="sj-emg-label">Uang Diterima</label><input id="sj-emg-cash-received" class="sj-emg-input" inputmode="numeric" value="${Math.ceil(total / 1000) * 1000}">`; else if (method.value === 'QRIS') extra.innerHTML = `${qris ? `<img src="${esc(qris)}" alt="QRIS" style="display:block;max-width:220px;max-height:220px;margin:8px auto;border-radius:10px">` : '<div class="sj-emg-alert">Gambar QRIS tidak ada di snapshot. Gunakan QRIS fisik merchant.</div>'}<p class="sj-emg-note"><b>Manual verification:</b> cek mutasi merchant lalu tekan konfirmasi. Tidak ada bridge/polling QRIS.</p>`; else extra.innerHTML = '<p class="sj-emg-note">Pastikan transfer sudah masuk sebelum menekan konfirmasi.</p>'; };
    method.onchange = renderExtra; renderExtra();
    box.querySelector('#sj-emg-pay-cancel').onclick = () => detach(box);
    box.querySelector('#sj-emg-pay-ok').onclick = async () => {
      const btn = box.querySelector('#sj-emg-pay-ok'); btn.disabled = true;
      try {
        const data = await api('/v1/sales', { method: 'POST', body: JSON.stringify({ operationId: opId('SALE'), shiftId: state.shift.id, method: method.value, cashReceived: method.value === 'TUNAI' ? Number(box.querySelector('#sj-emg-cash-received')?.value || total) : total, items: cartLines().map((x) => ({ productId: x.product.id, qty: x.qty })) }) });
        state.lastReceipt = data.transaction; state.cart = Object.create(null); detach(box); renderCart(); alert(`Transaksi D1 tersimpan.\n${data.transaction.id}\nTotal: ${money(data.transaction.total)}${data.transaction.change ? `\nKembalian: ${money(data.transaction.change)}` : ''}`);
      } catch (e) { alert(e.message); btn.disabled = false; }
    };
  }

  function shell(activeTab = 'status') {
    const overlay = document.createElement('div'); overlay.id = 'sj-emg-overlay';
    overlay.innerHTML = `<div class="sj-emg-top"><div><div class="sj-emg-title">SEGERAN JIWA • MODE DARURAT D1</div><div class="sj-emg-sub">Firebase tetap utama • D1 hanya aktif setelah Owner memilihnya</div></div><button id="sj-emg-close" class="sj-emg-btn alt">Tutup Layar</button></div><div class="sj-emg-wrap"><div class="sj-emg-row"><span class="sj-emg-pill on">EMERGENCY</span><span class="sj-emg-pill ${isDrillHost() ? '' : 'good'}">${isDrillHost() ? 'PREVIEW / DRILL' : 'PRODUCTION MODE'}</span><span class="sj-emg-pill">${esc(VERSION)}</span></div><div class="sj-emg-tabs" style="margin-top:10px"><button class="sj-emg-tab" data-tab="status">Status</button><button class="sj-emg-tab" data-tab="pos">POS Darurat</button><button class="sj-emg-tab" data-tab="shift">Shift</button><button class="sj-emg-tab" data-tab="expense">Pengeluaran</button></div><div id="sj-emg-content"></div></div>`;
    document.body.appendChild(overlay); overlay.querySelector('#sj-emg-close').onclick = () => detach(overlay); overlay.querySelectorAll('[data-tab]').forEach((b) => { if (b.dataset.tab === activeTab) b.classList.add('active'); b.onclick = () => renderOverlay(b.dataset.tab); }); return overlay;
  }

  function renderStatus(content) {
    content.innerHTML = `<div class="sj-emg-card"><div class="sj-emg-title">Standby Emergency Backend</div><p class="sj-emg-note">Tidak ada failover otomatis. Normal POS tetap menulis ke Firebase. D1 hanya dipakai melalui layar ini setelah Owner membuka akses.</p><div class="sj-emg-row"><button id="sj-emg-health" class="sj-emg-btn alt">Cek D1</button><button id="sj-emg-sync" class="sj-emg-btn">Perbarui Snapshot dari POS Normal</button><button id="sj-emg-activate" class="sj-emg-btn danger">Aktifkan Operasional Darurat</button></div><div id="sj-emg-status-msg" class="sj-emg-note" style="margin-top:10px"></div></div><div class="sj-emg-card"><b>Batas P1</b><p class="sj-emg-note">Tunai, Transfer, QRIS manual, shift, pengeluaran, stok produk/event, dan audit tersedia. Kasbon, diskon kompleks, realtime dashboard, dan rekonsiliasi ke Firebase sengaja belum aktif. Rekonsiliasi adalah Prompt Besar 2.</p></div>`;
    content.querySelector('#sj-emg-health').onclick = async () => { try { const h = await api('/v1/health', {}, false); content.querySelector('#sj-emg-status-msg').innerHTML = `<div class="sj-emg-success">D1 ONLINE • schema ${esc(h.schemaVersion)} • ${esc(h.time)}</div>`; } catch (e) { content.querySelector('#sj-emg-status-msg').innerHTML = `<div class="sj-emg-alert">${esc(e.message)}</div>`; } };
    content.querySelector('#sj-emg-sync').onclick = async () => { try { await syncMaster(); } catch (e) { alert(e.message); } };
    content.querySelector('#sj-emg-activate').onclick = async () => { try { await refreshEmergencyData(); state.mode = true; renderOverlay(state.shift ? 'pos' : 'shift'); } catch (e) { alert(`Belum bisa aktif: ${e.message}\n\nPastikan snapshot darurat sudah disiapkan saat Firebase sehat.`); } };
  }

  function renderShift(content) {
    if (state.shift) {
      content.innerHTML = `<div class="sj-emg-card"><div class="sj-emg-title">Shift Darurat Aktif</div><p><b>${esc(state.shift.shift_code || state.shift.shiftCode)}</b> • ${esc(state.shift.business_date || state.shift.businessDate)}<br>${esc(state.shift.cashier_name || state.shift.cashierName)}<br>Kas awal: ${money(state.shift.opening_cash ?? state.shift.openingCash)}</p><label class="sj-emg-label">Kas Aktual Saat Tutup</label><input id="sj-emg-closing-cash" class="sj-emg-input" inputmode="numeric"><label class="sj-emg-label">Catatan</label><input id="sj-emg-closing-note" class="sj-emg-input"><button id="sj-emg-close-shift" class="sj-emg-btn danger">TUTUP SHIFT DARURAT</button></div>`;
      content.querySelector('#sj-emg-close-shift').onclick = () => closeShiftFromForm().catch((e) => alert(e.message));
    } else {
      const now = new Date(); const yyyy = now.getFullYear(); const mm = String(now.getMonth() + 1).padStart(2, '0'); const dd = String(now.getDate()).padStart(2, '0');
      content.innerHTML = `<div class="sj-emg-card"><div class="sj-emg-title">Buka Shift Darurat</div><p class="sj-emg-note">Shift ini hanya ada di D1. Jangan buka jika Firebase normal masih dipakai untuk transaksi.</p><label class="sj-emg-label">Tanggal Bisnis</label><input id="sj-emg-shift-date" class="sj-emg-input" type="date" value="${yyyy}-${mm}-${dd}"><label class="sj-emg-label">Shift</label><select id="sj-emg-shift-code" class="sj-emg-select"><option value="S1">Pagi / S1</option><option value="S2">Siang / S2</option><option value="S3">Malam / S3</option></select><label class="sj-emg-label">Kas Awal</label><input id="sj-emg-opening-cash" class="sj-emg-input" inputmode="numeric" value="0"><label class="sj-emg-label">ID Kasir</label><input id="sj-emg-cashier-id" class="sj-emg-input" value="${esc(window.currentLoginId || 'kasir-emergency')}"><label class="sj-emg-label">Nama Kasir</label><input id="sj-emg-cashier-name" class="sj-emg-input" value="${esc(window.currentUserName || 'KASIR DARURAT')}"><button id="sj-emg-open-shift" class="sj-emg-btn ok">BUKA SHIFT DARURAT</button></div>`;
      content.querySelector('#sj-emg-open-shift').onclick = () => openShiftFromForm().catch((e) => alert(e.message));
    }
  }

  function renderPos(content) {
    if (!state.snapshot) { content.innerHTML = '<div class="sj-emg-alert">Aktifkan operasional darurat dari tab Status terlebih dahulu.</div>'; return; }
    if (!state.shift) { content.innerHTML = '<div class="sj-emg-alert">Belum ada shift D1 aktif. Buka dari tab Shift.</div>'; return; }
    content.innerHTML = `<div class="sj-emg-card"><div class="sj-emg-row"><div class="sj-emg-grow"><div class="sj-emg-title">POS Darurat</div><div class="sj-emg-sub">${esc(state.snapshot.store?.name || 'Segeran Jiwa')} • Shift ${esc(state.shift.shift_code || '')}</div></div></div><input id="sj-emg-search" class="sj-emg-input" placeholder="Cari produk..."><div id="sj-emg-products" class="sj-emg-grid"></div></div><div class="sj-emg-card"><div class="sj-emg-title">Keranjang</div><div id="sj-emg-cart"></div><div class="sj-emg-row" style="margin-top:9px"><div class="sj-emg-grow"><b>Total</b><div id="sj-emg-cart-total" style="font-size:22px;font-weight:900">${money(0)}</div></div><button id="sj-emg-pay" class="sj-emg-btn ok">BAYAR</button></div></div>`;
    content.querySelector('#sj-emg-search').oninput = (e) => renderProducts(e.target.value); content.querySelector('#sj-emg-pay').onclick = paymentDialog; renderProducts(); renderCart();
  }

  function renderExpense(content) {
    if (!state.shift) { content.innerHTML = '<div class="sj-emg-alert">Buka shift D1 sebelum mencatat pengeluaran.</div>'; return; }
    content.innerHTML = `<div class="sj-emg-card"><div class="sj-emg-title">Pengeluaran Darurat</div><label class="sj-emg-label">Nominal</label><input id="sj-emg-expense-amount" class="sj-emg-input" inputmode="numeric"><label class="sj-emg-label">Keterangan</label><input id="sj-emg-expense-note" class="sj-emg-input" maxlength="300"><button id="sj-emg-expense-save" class="sj-emg-btn">SIMPAN PENGELUARAN D1</button></div>`; content.querySelector('#sj-emg-expense-save').onclick = () => submitExpense().catch((e) => alert(e.message));
  }

  async function renderOverlay(tab = 'status') {
    detach(document.getElementById('sj-emg-overlay'));
    const overlay = shell(tab); const content = overlay.querySelector('#sj-emg-content');
    if (state.mode && state.token) { try { await refreshEmergencyData(); } catch (e) { if (tab !== 'status') content.innerHTML = `<div class="sj-emg-alert">${esc(e.message)}</div>`; } }
    if (tab === 'status') renderStatus(content); else if (tab === 'shift') renderShift(content); else if (tab === 'pos') renderPos(content); else if (tab === 'expense') renderExpense(content);
  }

  async function openEmergency() {
    try {
      const ok = await ensureAuth(); if (!ok) return;
      await renderOverlay(state.mode ? (state.shift ? 'pos' : 'shift') : 'status');
    } catch (e) { alert(e.message); }
  }

  function installLauncher() {
    styles();
    if (!document.getElementById('sj-emg-launch')) {
      const b = document.createElement('button'); b.id = 'sj-emg-launch'; b.textContent = 'MODE DARURAT D1'; b.onclick = openEmergency; document.body.appendChild(b);
    }
    const mgmt = document.getElementById('mst-menu-view');
    if (mgmt && !mgmt.querySelector('[data-sj-emg-d1-card]')) {
      const card = document.createElement('div'); card.setAttribute('data-sj-emg-d1-card', 'true'); card.className = 'sj-emg-card'; card.innerHTML = `<div class="sj-emg-row"><div class="sj-emg-grow"><b>Mode Darurat D1</b><div class="sj-emg-note">Standby backend jika Firebase quota/down. Tidak aktif otomatis.</div></div><button class="sj-emg-btn danger">BUKA</button></div>`; card.querySelector('button').onclick = openEmergency; mgmt.appendChild(card);
    }
  }

  window.SJEmergencyD1 = Object.freeze({ version: VERSION, open: openEmergency, syncMaster, getState: () => ({ mode: state.mode, hasToken: Boolean(state.token), hasSnapshot: Boolean(state.snapshot), shiftId: state.shift?.id || null }) });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', installLauncher, { once: true }); else installLauncher();
  const observer = new MutationObserver(() => installLauncher());
  if (document.documentElement) observer.observe(document.documentElement, { childList: true, subtree: true });
})();
