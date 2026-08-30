import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const BASE = join(ROOT, 'baseline', 'legacy-v1.0.40.html');
const EXPECTED = '877dd5d80ad3cfbae9c8ded35ea37c426bf795392240adb96c38e62fc556154f';
function sha(path){return createHash('sha256').update(readFileSync(path)).digest('hex')}

test('immutable baseline matches approved v1.0.40 hash', () => {
  assert.equal(sha(BASE), EXPECTED);
});

test('modular scaffold exposes required architecture boundaries', () => {
  const required = [
    'src/app/index.js','src/core/index.js','src/data/index.js','src/domain/index.js',
    'src/modules/index.js','src/ui/index.js','scripts/build.mjs','scripts/audit-monolith.mjs',
    'docs/SC01_EXTRACTION_MAP.md','docs/SC01_LEGACY_DEBT_REGISTER.md'
  ];
  for (const rel of required) assert.ok(existsSync(join(ROOT, rel)), `missing ${rel}`);
});

test('build produces byte-identical dist/index.html before extraction begins', () => {
  execFileSync(process.execPath, [join(ROOT, 'scripts', 'build.mjs')], { cwd: ROOT, stdio: 'pipe' });
  const dist = join(ROOT, 'dist', 'index.html');
  assert.ok(existsSync(dist));
  assert.equal(sha(dist), EXPECTED);
});

test('audit output captures fixed roots and structural counts', () => {
  execFileSync(process.execPath, [join(ROOT, 'scripts', 'audit-monolith.mjs')], { cwd: ROOT, stdio: 'pipe' });
  const auditPath = join(ROOT, 'audit', 'monolith-audit.json');
  assert.ok(existsSync(auditPath));
  const a = JSON.parse(readFileSync(auditPath, 'utf8'));
  assert.equal(a.fixedContracts.posRoot, 'toko_segeranjiwa_v58');
  assert.equal(a.fixedContracts.qrisRoot, 'segeranjiwa_qris_beta_v1');
  assert.equal(a.structure.styleBlocks, 23);
  assert.equal(a.structure.scriptBlocks, 40);
  assert.ok(a.functions.total > 100);
  assert.ok(a.firebase.writeSites.length > 10);
  assert.ok(a.layers.refinementMarkers.length >= 10);
});

test('all inline JavaScript blocks parse before structural extraction', () => {
  execFileSync(process.execPath, [join(ROOT, 'scripts', 'verify-inline-scripts.mjs')], { cwd: ROOT, stdio: 'pipe' });
  const p = join(ROOT, 'audit', 'inline-script-parse.json');
  assert.ok(existsSync(p));
  const r = JSON.parse(readFileSync(p, 'utf8'));
  assert.equal(r.inlineScriptBlocks, 40);
  assert.equal(r.failures.length, 0);
});

test('critical legacy contracts are still visible in compatibility dist', () => {
  const html = readFileSync(join(ROOT, 'dist', 'index.html'), 'utf8');
  const required = [
    'const DB_PATH="toko_segeranjiwa_v58"',
    'segeranjiwa_qris_beta_v1',
    'window.SJQrisSignalBeta',
    'processTransaction',
    'SJShift',
    'Penjualan', 'Operasional', 'Laporan', 'Pengaturan'
  ];
  for (const token of required) assert.ok(html.includes(token), `missing critical token: ${token}`);
});

test('zero-dependency local preview server is part of the scaffold', () => {
  assert.ok(existsSync(join(ROOT, 'scripts', 'dev-server.mjs')));
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
  assert.equal(pkg.scripts.dev, 'node scripts/dev-server.mjs');
});

test('SC-01 contract verifier reports zero violations', () => {
  execFileSync(process.execPath, [join(ROOT, 'scripts', 'verify-contracts.mjs')], { cwd: ROOT, stdio: 'pipe' });
  const p = join(ROOT, 'audit', 'contract-verification.json');
  assert.ok(existsSync(p));
  const r = JSON.parse(readFileSync(p, 'utf8'));
  assert.equal(r.violations.length, 0);
  assert.equal(r.baselineSha256, EXPECTED);
  assert.equal(r.distSha256, EXPECTED);
});
