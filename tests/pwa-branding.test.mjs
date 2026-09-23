import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT=dirname(dirname(fileURLToPath(import.meta.url)));

test('PWA manifest is Segeran Jiwa branded and standalone',()=>{
  const manifest=JSON.parse(readFileSync(join(ROOT,'src','pwa','manifest.webmanifest'),'utf8'));
  assert.equal(manifest.name,'Segeran Jiwa POS');
  assert.equal(manifest.short_name,'Segeran Jiwa');
  assert.equal(manifest.display,'standalone');
  assert.equal(manifest.theme_color,'#08783f');
  assert.ok(Array.isArray(manifest.icons)&&manifest.icons.length>=1);
});

test('REF01 build wires manifest, icon and service worker without fetch caching',()=>{
  const build=readFileSync(join(ROOT,'scripts','build-ref01.mjs'),'utf8');
  const sw=readFileSync(join(ROOT,'src','pwa','sw.js'),'utf8');
  assert.match(build,/manifest\.webmanifest/);
  assert.match(build,/register-pwa\.js/);
  assert.match(build,/cpSync\(join\(PWA_SOURCE,'sw\.js'\),join\(staging,'sw\.js'\)\)/);
  assert.doesNotMatch(sw,/addEventListener\(['"]fetch['"]/);
});
