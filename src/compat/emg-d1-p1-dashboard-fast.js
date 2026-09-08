(function () {
  'use strict';

  const VERSION = 'EMG-D1-P1-DASHFAST-R4';
  const REFRESH_TTL_MS = 5 * 60 * 1000;
  const PREV_TTL_MS = 30 * 60 * 1000;
  const modelCache = Object.create(null);
  const prevCache = Object.create(null);
  const inFlight = Object.create(null);
  const lastAttempt = Object.create(null);

  function activeDateOnlyValue() {
    try { return String(activeDateOnly || ''); } catch (_) { return String(window.activeDateOnly || ''); }
  }
  function activeDateValue() {
    try { return String(activeDate || ''); } catch (_) { return String(window.activeDate || ''); }
  }
  function roleIsOwner() {
    let r = '';
    try { r = String(currentUserRole || '').toLowerCase(); } catch (_) { r = String(window.currentUserRole || '').toLowerCase(); }
    return r === 'manajemen' || r === 'owner';
  }
  function displayName() {
    let name = 'Pengguna';
    try { name = String(currentUserName || currentLoginId || 'Pengguna').trim(); } catch (_) { name = 'Pengguna'; }
    return name.toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase());
  }
  function cloud() {
    try { return cloudData || {}; } catch (_) { return window.cloudData || {}; }
  }
  function arr(v) {
    try { return sjArr(v); } catch (_) { return Array.isArray(v) ? v : Object.values(v || {}); }
  }
  function aggregateLocal(date) {
    const data = cloud();
    const shifts = {};
    const re = new RegExp(`^${String(date).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-S[123]$`);
    Object.keys(data || {}).forEach((key) => { if (re.test(key)) shifts[key] = data[key]; });
    const ad = activeDateValue();
    if (!Object.keys(shifts).length && ad && data[ad]) shifts[ad] = data[ad];
    try { return sjAggregateReport(shifts, 'daily', date); }
    catch (_) { return { sales: 0, txCount: 0, qty: 0, shiftRows: [] }; }
  }
  function buildOwnerModel(day, local) {
    const data = cloud();
    const d = data[activeDateValue()] || {};
    let cash = 0;
    try { cash = Number(window.SJCommercialVisualV5955?.cashModel(d)?.available) || 0; }
    catch (_) { try { cash = Number(sjShiftCashModel(d).expected) || 0; } catch (__) { cash = 0; } }
    let debt = 0;
    try { debt = Number(sjOutstanding('hutang')) || 0; } catch (_) { debt = 0; }
    const rests = arr(data.global?.restockRequests);
    const pending = rests.filter((x) => !['DONE', 'REJECTED', 'CANCELLED'].includes(String(x?.status || ''))).length;
    const menu = Array.isArray(data.global?.menu) ? data.global.menu : [];
    const products = menu.filter((p) => {
      try { return SJHarden.isActiveProduct(p) && sjTrackStock(p); } catch (_) { return false; }
    });
    const low = products.filter((p) => { try { return sjStatusStock(p) === 'menipis'; } catch (_) { return false; } });
    const out = products.filter((p) => { try { return sjStatusStock(p) === 'habis'; } catch (_) { return false; } });
    let debtCustomers = 0;
    try {
      debtCustomers = new Set(window.SJCommercialUIV5953.debtRows().filter((x) => Number(x._remaining) > 0).map((x) => String(x.customerId || x.nama || '')).filter(Boolean)).size;
    } catch (_) { debtCustomers = debt > 0 ? 1 : 0; }
    const model = {
      name: displayName(),
      online: typeof navigator === 'undefined' ? true : navigator.onLine !== false,
      date: activeDateOnlyValue(),
      sales: Number(day?.sales) || 0,
      txCount: Number(day?.txCount) || 0,
      cash,
      debt,
      debtCustomers,
      pending,
      low: low.length,
      out: out.length,
      _sjFastLocal: Boolean(local),
    };
    return model;
  }
  function exactCache(date) {
    const row = modelCache[date];
    return row && Date.now() - row.ts < REFRESH_TTL_MS ? row.model : null;
  }
  function renderModel(dashboard, model) {
    const root = document.getElementById('sjx-dashboard-root');
    if (!root || !roleIsOwner()) return false;
    root.innerHTML = dashboard.ownerHTML(model);
    try { document.body.classList.add('sjui02-dashboard-open'); } catch (_) {}
    try { window.SJRefinementShellV100?.refresh?.(); } catch (_) {}
    try { window.SJX?.updateBell?.(); } catch (_) {}
    return true;
  }
  async function fetchPreviousSales(date) {
    const cached = prevCache[date];
    if (cached && Date.now() - cached.ts < PREV_TTL_MS) return cached.sales;
    const insight = window.SJCommercialInsightV5954;
    if (!insight?.aggregateExact || !insight?.addDays) return null;
    try {
      const prevDate = insight.addDays(date, -1);
      const prev = await insight.aggregateExact(prevDate);
      const sales = Number(prev?.sales) || 0;
      prevCache[date] = { sales, ts: Date.now() };
      return sales;
    } catch (_) { return null; }
  }
  async function refreshExact(dashboard, date) {
    if (!date || (typeof navigator !== 'undefined' && navigator.onLine === false)) return null;
    if (inFlight[date]) return inFlight[date];
    const task = (async () => {
      try {
        const day = await window.SJX.dayModel();
        if (date !== activeDateOnlyValue()) return null;
        const model = buildOwnerModel(day, false);
        model.prevSales = await fetchPreviousSales(date);
        modelCache[date] = { model, ts: Date.now() };
        const view = document.getElementById('view5');
        if (!view || view.classList.contains('active')) renderModel(dashboard, model);
        return model;
      } catch (_) { return null; }
      finally { delete inFlight[date]; }
    })();
    inFlight[date] = task;
    return task;
  }
  function scheduleRefresh(dashboard, date) {
    const last = Number(lastAttempt[date] || 0);
    if (Date.now() - last < REFRESH_TTL_MS || inFlight[date]) return false;
    lastAttempt[date] = Date.now();
    setTimeout(() => { refreshExact(dashboard, date); }, 0);
    return true;
  }
  function install() {
    if (window.__SJ_EMG_D1_P1_DASH_FAST_R4) return true;
    const dashboard = window.SJRefinementRoleDashboardV100;
    if (!dashboard || typeof dashboard.ownerHTML !== 'function') return false;
    window.__SJ_EMG_D1_P1_DASH_FAST_R4 = true;
    const baseOwnerHTML = dashboard.ownerHTML.bind(dashboard);
    dashboard.ownerHTML = function (model) {
      let html = baseOwnerHTML(model);
      if (model?._sjFastLocal) {
        html = html.replace('Terakhir tersinkronisasi • Hari ini', 'Data lokal • memperbarui di latar belakang');
      }
      return html;
    };
    dashboard.ownerModel = function () {
      const date = activeDateOnlyValue();
      const exact = exactCache(date);
      if (exact) return exact;
      return buildOwnerModel(aggregateLocal(date), true);
    };
    dashboard.renderOwner = function () {
      const root = document.getElementById('sjx-dashboard-root');
      if (!root) return false;
      const date = activeDateOnlyValue();
      const model = dashboard.ownerModel();
      const rendered = renderModel(dashboard, model);
      scheduleRefresh(dashboard, date);
      return rendered;
    };
    window.SJDashboardFastP1 = Object.freeze({
      version: VERSION,
      refreshTtlMs: REFRESH_TTL_MS,
      previousTtlMs: PREV_TTL_MS,
      refresh: () => refreshExact(dashboard, activeDateOnlyValue()),
      status: () => ({ inFlight: Object.keys(inFlight).length, cachedDates: Object.keys(modelCache).length }),
    });
    return true;
  }

  if (!install()) {
    setTimeout(install, 0);
    setTimeout(install, 250);
  }
})();
