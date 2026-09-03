import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { reconcileTransactionSurfaces } from '../src/ui/transaction-detail-refinement.js';

const root=process.cwd();
const read=(p)=>fs.readFileSync(path.join(root,p),'utf8');

test('refresh authority never changes selected date/shift and explicitly rerenders active surfaces',()=>{
  const src=read('src/compat/ref01-production-sales-compat.js');
  const refresh=src.match(/async function refreshNow\(\)[\s\S]*?\n}\nwindow\.SJRef01ProductionSalesCompat/)?.[0]||'';
  assert.ok(refresh.includes("ref(DB_PATH+'/global').once('value')"));
  assert.ok(refresh.includes('selectedShiftKey()'));
  assert.ok(!refresh.includes('changeDateAndShift('),'refresh must not invoke date/shift lifecycle');
  assert.ok(refresh.includes('renderSales()'),'sales rerender must be deterministic');
  assert.ok(refresh.includes("SJReportFoundationV010.refresh"),'report rerender must be deterministic');
});

test('REF-01 runtime no longer uses global click-to-enhance lifecycle',()=>{
  const src=read('src/app/ref01-bootstrap.js');
  const entry=read('src/ref01-entry.js');
  assert.ok(!/document\?\.addEventListener\?\.\('click',[\s\S]*?enhance\(\)/.test(src),'global click enhancer must be removed');
  assert.ok(src.includes('scheduleEnhance'),'runtime should expose deterministic scheduled enhancement');
  assert.ok(src.includes('createPresentationLifecycle'),'runtime must install the canonical deterministic presentation lifecycle');
  assert.ok(!src.includes('MutationObserver'),'REF-01 bootstrap must not use broad DOM observer fallback');
  assert.ok(!entry.includes('observe:true'),'entry must not opt back into broad observer lifecycle');
  assert.ok(src.includes('notificationRefinement?.syncUnreadBadge?.()'),'late legacy badge overrides must be reconciled to unread-only semantics');
});

test('cart mutations use one deterministic sales/cart synchronization helper',()=>{
  const src=read('src/compat/ref01-production-sales-compat.js');
  assert.ok(src.includes('function syncCartPresentation('));
  const add=src.match(/function addNormalProduct\(id\)[\s\S]*?\n}\nfunction adjustNormalProduct/)?.[0]||'';
  const adjust=src.match(/function adjustNormalProduct\(id,delta\)[\s\S]*?\n}\nfunction selectedShiftKey/)?.[0]||'';
  assert.ok(add.includes('syncCartPresentation('));
  assert.ok(adjust.includes('syncCartPresentation('));
  assert.ok(src.includes('window.quickAddCart=function(id){return window.SJRef01ProductionSalesCompat.addNormalProduct(id)}'));
});

test('notification bridge counts persistent unread events only',()=>{
  const src=read('src/compat/ref01-production-sales-compat.js');
  assert.ok(src.includes('function unreadNotificationCount()'));
  assert.ok(src.includes('SJHarden.notificationVisible'));
  assert.ok(src.includes('SJHarden.notificationRead'));
  const fn=src.match(/function unreadNotificationCount\(\)[\s\S]*?\n}/)?.[0]||'';
  assert.ok(!fn.includes('smartAlerts'));
  assert.ok(!fn.includes('qrisEventActionRows'));
  const notif=read('src/ui/notification-refinement.js');
  assert.ok(notif.includes('syncUnreadBadge'));
});

test('receipt reconciliation keeps one active receipt presentation',()=>{
  const classSet=(initial=[])=>{const s=new Set(initial);return {add:(x)=>s.add(x),remove:(x)=>s.delete(x),contains:(x)=>s.has(x),toggle:(x,v)=>v?s.add(x):s.delete(x),has:(x)=>s.has(x)}};
  const success1={removeCalled:false,remove(){this.removeCalled=true}};
  const success2={removeCalled:false,remove(){this.removeCalled=true}};
  const content={style:{display:''},classList:classSet(),dataset:{},setAttribute(){},removeAttribute(){}};
  const footer={style:{display:''},classList:classSet(),dataset:{},setAttribute(){},removeAttribute(){}};
  const modalInner={classList:classSet(),dataset:{}};
  const receipt={style:{display:'flex'},classList:classSet(),dataset:{},querySelector(sel){if(sel==='.modal')return modalInner;if(sel==='#struk-content')return content;if(sel==='.fs-footer')return footer;return null},querySelectorAll(sel){return sel==='.sjvc011-success'?[success1,success2]:[]}};
  const nav={setAttribute(){},removeAttribute(){}};
  const body={classList:classSet()};
  const document={body,getElementById(id){if(id==='bottom-nav')return nav;if(id==='modal-struk-fs')return receipt;return null},querySelector(){return null}};
  const result=reconcileTransactionSurfaces(document);
  assert.equal(result.receiptOpen,true);
  assert.equal(result.receiptPresentation,'success');
  assert.equal(success1.removeCalled,false);
  assert.equal(success2.removeCalled,true,'duplicate success surface removed');
  assert.equal(content.style.display,'none','legacy receipt hidden while success surface is active');
  assert.equal(footer.style.display,'none','legacy footer hidden while success surface is active');
});

test('current-user avatars expose upload/change/remove entry point through existing media lifecycle',()=>{
  const src=read('src/app/ref01-bootstrap.js');
  assert.ok(src.includes('openAvatarActions'));
  assert.ok(src.includes("data-ref01-avatar-action=\"upload\""));
  assert.ok(src.includes("data-ref01-avatar-action=\"initials\""));
  assert.ok(src.includes('media.saveProfilePhoto'));
  assert.ok(src.includes('media.removeProfilePhoto'));
});
