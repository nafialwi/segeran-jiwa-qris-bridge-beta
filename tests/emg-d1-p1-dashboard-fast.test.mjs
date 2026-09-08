import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync('src/compat/emg-d1-p1-dashboard-fast.js', 'utf8');

test('EMG-D1 P1 R7 dashboard compat adds no reader/timer/cache authority', () => {
  assert.doesNotMatch(source, /\b(?:db|firebase|database)\s*\.\s*ref\s*\(/i);
  assert.doesNotMatch(source, /setInterval\s*\(/);
  assert.doesNotMatch(source, /dashboard\.ownerModel\s*=/);
  assert.doesNotMatch(source, /dashboard\.renderOwner\s*=/);
  assert.doesNotMatch(source, /modelCache|prevCache|inFlight|REFRESH_TTL_MS|PREV_TTL_MS/);
});

test('EMG-D1 P1 R7 dashboard compat only decorates freshness copy and preserves model/render functions', () => {
  const originalModel=async()=>({sales:999}),originalRender=async()=>true;
  const dashboard={
    ownerHTML(model){return `<small>Terakhir tersinkronisasi • Hari ini</small><b>${model.sales}</b>`},
    ownerModel:originalModel,
    renderOwner:originalRender
  };
  const context={
    window:{SJRefinementRoleDashboardV100:dashboard},
    setTimeout(){throw new Error('R7 compat must not schedule refresh timers')},
    console
  };
  context.window.window=context.window;
  vm.createContext(context);vm.runInContext(source,context);
  assert.equal(dashboard.ownerModel,originalModel);
  assert.equal(dashboard.renderOwner,originalRender);
  assert.match(dashboard.ownerHTML({_sjFastLocal:true,sales:123}),/Data lokal • sedang memperbarui/);
  assert.equal(context.window.SJDashboardFastP1?.mode,'presentation-only');
});
