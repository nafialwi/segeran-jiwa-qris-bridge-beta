import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyNotificationText, installNotificationRefinement } from '../src/ui/notification-refinement.js';

test('REF_06 notification presentation classifies action/QRIS/history without changing deep-link authority',()=>{
  assert.equal(classifyNotificationText('Stok hampir habis, perlu restock'),'action');
  assert.equal(classifyNotificationText('Pembayaran QRIS berhasil Rp 50.000'),'qris');
  assert.equal(classifyNotificationText('Backup database berhasil'),'history');
  assert.equal(classifyNotificationText('Pesanan baru diterima'),'all');
});

test('REF_06 notification refinement wraps existing renderer instead of replacing notification read/deep-link logic',()=>{
  let rendered=0,decorated=0;
  const runtime={SJX:{renderNotifications(){rendered++}},document:{getElementById(){return null}}};
  const api=installNotificationRefinement(runtime,{decorate(){decorated++}});
  assert.equal(api.installed,true);
  runtime.SJX.renderNotifications();
  assert.equal(rendered,1);
  assert.equal(decorated,1);
  assert.equal(installNotificationRefinement(runtime,{decorate(){}}),api);
});
