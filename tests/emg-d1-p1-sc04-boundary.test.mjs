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

test('EMG-D1 P1 R7 dashboard compat has no second cache authority and emergency cart stays plain-object', () => {
  const dashboard = read('src/compat/emg-d1-p1-dashboard-fast.js');
  const emergency = read('src/compat/emg-d1-p1-emergency.js');
  assert.doesNotMatch(dashboard, /modelCache|prevCache|inFlight|REFRESH_TTL_MS|PREV_TTL_MS/);
  assert.doesNotMatch(dashboard, /dashboard\.ownerModel\s*=|dashboard\.renderOwner\s*=/);
  assert.match(emergency, /cart:\s*Object\.create\(null\)/);
  assert.match(emergency, /const detach = \(el\)/);
});
