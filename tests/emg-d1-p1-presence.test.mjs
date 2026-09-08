import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('EMG-D1 P1 emergency backend and client files exist', () => {
  for (const p of [
    'emergency-d1/schema.sql',
    'emergency-d1/src/core.js',
    'emergency-d1/src/worker.js',
    'src/compat/emg-d1-p1-emergency.js',
    'src/compat/emg-d1-p1-dashboard-fast.js',
  ]) assert.equal(fs.existsSync(p), true, `${p} harus ada`);
});
