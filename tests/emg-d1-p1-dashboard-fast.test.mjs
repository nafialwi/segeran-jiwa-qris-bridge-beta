import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync('src/compat/emg-d1-p1-dashboard-fast.js', 'utf8');

test('EMG-D1 P1 R2 dashboard fast path tidak membuat Firebase reader/timer periodik baru', () => {
  assert.doesNotMatch(source, /\b(?:db|firebase|database)\s*\.\s*ref\s*\(/i);
  assert.doesNotMatch(source, /setInterval\s*\(/);
  assert.match(source, /REFRESH_TTL_MS\s*=\s*5\s*\*\s*60\s*\*\s*1000/);
  assert.match(source, /Data lokal • memperbarui di latar belakang/);
});

test('EMG-D1 P1 R2 Beranda owner render dari cloudData sebelum exact Firebase refresh', async () => {
  let dayReads = 0;
  const timers = [];
  const root = { innerHTML: '' };
  const view5 = { classList: { contains: () => true } };
  const body = { classList: { add() {} } };
  const dashboard = {
    ownerHTML(model) { return `sales=${model.sales};local=${model._sjFastLocal ? 1 : 0}`; },
    ownerModel: async () => ({ sales: 999 }),
    renderOwner: async () => false,
  };
  const context = {
    window: {
      SJRefinementRoleDashboardV100: dashboard,
      SJX: { dayModel: async () => { dayReads += 1; return { sales: 999, txCount: 9 }; } },
      SJCommercialVisualV5955: { cashModel: () => ({ available: 80000 }) },
      SJCommercialUIV5953: { debtRows: () => [] },
      SJCommercialInsightV5954: { addDays: () => '2026-09-06', aggregateExact: async () => ({ sales: 500 }) },
      SJRefinementShellV100: { refresh() {} },
    },
    document: { getElementById: (id) => id === 'sjx-dashboard-root' ? root : id === 'view5' ? view5 : null, body },
    navigator: { onLine: true },
    cloudData: { global: { menu: [], restockRequests: [] }, '2026-09-07-S1': { omset: 123000 } },
    activeDateOnly: '2026-09-07', activeDate: '2026-09-07-S1', currentUserRole: 'manajemen', currentUserName: 'OWNER', currentLoginId: 'owner',
    sjAggregateReport: () => ({ sales: 123000, txCount: 3 }), sjArr: (v) => Array.isArray(v) ? v : Object.values(v || {}),
    sjOutstanding: () => 0, SJHarden: { isActiveProduct: () => true }, sjTrackStock: () => false, sjStatusStock: () => 'aman',
    sjShiftCashModel: () => ({ expected: 80000 }),
    setTimeout: (fn) => { timers.push(fn); return timers.length; }, clearTimeout() {}, Date, Map, Set, Object, Array, Number, String, Boolean, RegExp, Promise, console,
  };
  context.window.window = context.window;
  Object.assign(context.window, {
    cloudData: context.cloudData,
    currentUserRole: context.currentUserRole,
    currentUserName: context.currentUserName,
    currentLoginId: context.currentLoginId,
    activeDateOnly: context.activeDateOnly,
    activeDate: context.activeDate,
  });
  vm.createContext(context);
  vm.runInContext(source, context);
  const out = context.window.SJRefinementRoleDashboardV100.renderOwner();
  assert.equal(out, true);
  assert.match(root.innerHTML, /sales=123000;local=1/);
  assert.equal(dayReads, 0, 'exact Firebase read tidak boleh memblokir render pertama');
  assert.ok(timers.length >= 1, 'background refresh harus dijadwalkan');
  timers.shift()();
  await new Promise((resolve) => setImmediate(resolve));
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(dayReads, 1, 'exact refresh berjalan setelah UI sudah tampil');
});
