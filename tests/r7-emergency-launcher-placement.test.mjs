import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync('src/compat/emg-d1-p1-emergency.js', 'utf8');

test('R7 emergency access is not installed as a floating document-body launcher', () => {
  assert.doesNotMatch(source, /#sj-emg-launch\s*\{/);
  assert.doesNotMatch(source, /b\.id\s*=\s*['"]sj-emg-launch['"][\s\S]{0,220}document\.body\.appendChild\(b\)/);
});

test('R7 emergency access remains available from the management card and keeps manual open binding', () => {
  assert.match(source, /data-sj-emg-d1-card/);
  assert.match(source, /Mode Darurat D1/);
  assert.match(source, /card\.querySelector\(['"]button['"]\)\.onclick\s*=\s*openEmergency/);
  assert.match(source, /Tidak aktif otomatis/);
});
