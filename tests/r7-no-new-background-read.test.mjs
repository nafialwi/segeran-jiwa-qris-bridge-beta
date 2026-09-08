import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const touched = [
  'src/app/rc01-runtime-loading-hardening.js',
  'src/app/r7-read-coordinator.js',
  'src/ui/owner-dashboard-hybrid.js',
  'src/compat/emg-d1-p1-dashboard-fast.js',
  'src/ui/report-refinement.js',
  'src/ui/sales-shift-ux-refinement.js',
  'src/ui/finance-v33-workspace.js',
  'src/compat/emg-d1-p1-emergency.js',
];

const sources = touched.map((file) => [file, fs.readFileSync(file, 'utf8')]);

test('R7 touched read/UI files add no polling interval or persistent Firebase value listener', () => {
  for (const [file, source] of sources) {
    assert.doesNotMatch(source, /\bsetInterval\s*\(/, `${file} must not add polling`);
    assert.doesNotMatch(source, /\.on\s*\(\s*['"]value['"]/, `${file} must not add persistent value listeners`);
  }
});

test('R7 presentation/UI files contain no Firebase SDK access or RTDB writer call', () => {
  const uiFiles = sources.filter(([file]) => file !== 'src/app/rc01-runtime-loading-hardening.js');
  for (const [file, source] of uiFiles) {
    assert.doesNotMatch(source, /\bfirebase\s*\./, `${file} must not call Firebase SDK directly`);
    assert.doesNotMatch(source, /\.(?:set|update|remove)\s*\(/, `${file} must not write RTDB data`);
  }
});

test('R7 does not add localStorage persistence to touched files', () => {
  for (const [file, source] of sources) assert.doesNotMatch(source, /\blocalStorage\b/, `${file} must remain in-memory only`);
});
