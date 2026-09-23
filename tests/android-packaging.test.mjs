import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT=dirname(dirname(fileURLToPath(import.meta.url)));

test('Capacitor Android identity points to REF01 build',()=>{
  const cfg=JSON.parse(readFileSync(join(ROOT,'capacitor.config.json'),'utf8'));
  assert.equal(cfg.appId,'id.segeranjiwa.pos');
  assert.equal(cfg.appName,'Segeran Jiwa POS');
  assert.equal(cfg.webDir,'dist-ref01');
  assert.equal(cfg.server.androidScheme,'https');
});

test('Android shell is branded and internet-capable without cleartext override',()=>{
  const manifest=readFileSync(join(ROOT,'android','app','src','main','AndroidManifest.xml'),'utf8');
  const strings=readFileSync(join(ROOT,'android','app','src','main','res','values','strings.xml'),'utf8');
  const styles=readFileSync(join(ROOT,'android','app','src','main','res','values','styles.xml'),'utf8');
  assert.match(manifest,/android:icon="@drawable\/sj_launcher"/);
  assert.match(manifest,/android\.permission\.INTERNET/);
  assert.doesNotMatch(manifest,/usesCleartextTraffic="true"/);
  assert.match(strings,/<string name="app_name">Segeran Jiwa POS<\/string>/);
  assert.match(styles,/windowSplashScreenAnimatedIcon">@drawable\/sj_launcher/);
});
