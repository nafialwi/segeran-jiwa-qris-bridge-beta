import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const files = [
  'src/compat/emg-d1-p1-dashboard-fast.js',
  'src/compat/emg-d1-p1-emergency.js',
];
const read = (p) => fs.readFileSync(p, 'utf8');
const mutation = /\.(?:set|update|transaction|remove)\s*\(/;

test('EMG-D1 P1 compat files stay outside SC04 direct-mutation token boundary', () => {
  for (const file of files) {
    const source = read(file);
    assert.doesNotMatch(source, mutation, `${file} must not look like an RTDB mutation source to SC04`);
  }
});

test('EMG-D1 P1 emergency credential/mode state is memory-only and not browser storage', () => {
  const source = read('src/compat/emg-d1-p1-emergency.js');
  assert.doesNotMatch(source, /(?:localStorage|sessionStorage)/i);
  assert.match(source, /token:\s*''/);
  assert.match(source, /mode:\s*false/);
});

test('EMG-D1 P1 dashboard/cart caches use plain objects, preserving behavior without Map.set tokens', () => {
  const dashboard = read('src/compat/emg-d1-p1-dashboard-fast.js');
  const emergency = read('src/compat/emg-d1-p1-emergency.js');
  assert.match(dashboard, /modelCache\s*=\s*Object\.create\(null\)/);
  assert.match(dashboard, /inFlight\s*=\s*Object\.create\(null\)/);
  assert.match(emergency, /cart:\s*Object\.create\(null\)/);
  assert.match(emergency, /const detach = \(el\)/);
});
