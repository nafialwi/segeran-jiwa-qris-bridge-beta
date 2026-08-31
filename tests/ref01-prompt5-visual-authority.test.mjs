import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  REFERENCE_MATRIX,
  SETTINGS_LAYOUT,
  VISUAL_ICON_MAP,
  REQUIRED_REFERENCE_IDS
} from '../src/ui/refinement-visual-contract.js';
import { renderSettingsMarkup } from '../src/ui/settings-refinement.js';
import { enhanceBottomNav } from '../src/ui/bottom-nav.js';

const labels=(items)=>items.map(x=>x.label);

test('Prompt 5 maps every one of the nine refinement authorities to concrete runtime surfaces and behavior',()=>{
  assert.deepEqual(REQUIRED_REFERENCE_IDS,[
    'REF_01','REF_02_BOTTOM_NAV_MOTION','REF_03','REF_04','REF_05','REF_06','REF_07','REF_08','REF_09'
  ]);
  assert.deepEqual(Object.keys(REFERENCE_MATRIX),REQUIRED_REFERENCE_IDS);
  for(const [id,entry] of Object.entries(REFERENCE_MATRIX)){
    assert.ok(entry.surfaces.length>=1,`${id}: surfaces`);
    assert.ok(entry.visualAnchors.length>=3,`${id}: visual anchors`);
    assert.ok(entry.behavior.length>=1,`${id}: behavior`);
    assert.ok(entry.authority.length>=1,`${id}: authority`);
    assert.equal(entry.status,'implemented',`${id}: must not be conceptual-only`);
  }
});

test('Prompt 5 Settings layout follows REF_01 group geometry instead of one generic grid',()=>{
  assert.equal(SETTINGS_LAYOUT.Toko.layout,'five-compact');
  assert.equal(SETTINGS_LAYOUT.Akses.layout,'three-wide');
  assert.equal(SETTINGS_LAYOUT['Tampilan & Perangkat'].layout,'three-wide');
  assert.equal(SETTINGS_LAYOUT.Sistem.layout,'four-compact');
  assert.equal(SETTINGS_LAYOUT.Data.layout,'full-width');
  assert.equal(SETTINGS_LAYOUT['Zona Sensitif'].layout,'danger-full-width');
  assert.deepEqual(labels(SETTINGS_LAYOUT.Toko.items),['Produk','Kategori','Bahan & Gudang','Pelanggan','Karyawan']);
  assert.deepEqual(labels(SETTINGS_LAYOUT.Akses.items),['Akun Saya','Pengguna','Perangkat Aktif']);
  assert.equal(SETTINGS_LAYOUT.logout.label,'Keluar');
});

test('Prompt 5 uses a refinement icon vocabulary matching visible responsibilities, not fallback box icons',()=>{
  const exact={
    Produk:'shopping-bag',Kategori:'category-grid','Bahan & Gudang':'warehouse-box',Pelanggan:'customers',Karyawan:'id-card',
    'Akun Saya':'account-circle',Pengguna:'users-access','Perangkat Aktif':'devices','Tampilan Aplikasi':'palette',
    'Identitas Toko':'storefront',Printer:'printer',Notifikasi:'bell','Keamanan & Sinkronisasi':'shield-lock',
    Aktivitas:'history',Diagnostik:'stethoscope','Backup & Restore':'cloud-upload','Kelola Data Sensitif':'shield-alert',Keluar:'logout'
  };
  for(const [label,icon] of Object.entries(exact)) assert.equal(VISUAL_ICON_MAP[label],icon,label);
});

test('Prompt 5 Settings renderer contains REF_01 hierarchy, profile photo surface, sensitive separator and logout',()=>{
  const html=renderSettingsMarkup({
    name:'Owner Utama',roleLabel:'Owner / Pemilik',photoURL:'https://example.invalid/a.jpg',synced:true,syncLabel:'Hari ini 09:41'
  });
  assert.match(html,/class="sjr01-settings-page"/);
  assert.match(html,/>Pengaturan</);
  assert.match(html,/Kelola toko, pengguna, dan sistem POS Anda/);
  assert.match(html,/sjr01-profile-photo/);
  assert.match(html,/data-ref01-profile="choose"/);
  assert.match(html,/data-ref01-layout="five-compact"/);
  assert.match(html,/data-ref01-layout="three-wide"/);
  assert.match(html,/data-ref01-layout="four-compact"/);
  assert.match(html,/data-ref01-layout="full-width"/);
  assert.match(html,/sjr01-sensitive-separator/);
  assert.match(html,/data-ref01-feature="ref01.logout"/);
});

test('Prompt 5 bottom-nav reconciliation keeps the existing semantic label as the sole visible label authority',()=>{
  const label={nodeType:1,textContent:'Dashboard'};
  const direct={nodeType:3,textContent:'Dashboard',remove(){button.childNodes=button.childNodes.filter(x=>x!==direct)}};
  const icon={innerHTML:''};
  const button={
    dataset:{},childNodes:[{nodeType:1},label,direct],classList:{toggle(){}},
    querySelector(sel){if(sel==='.nav-icon')return icon;if(sel==='.sjui01-nav-label')return label;return null},
    insertAdjacentText(_where,text){this.childNodes.push({nodeType:3,textContent:text})}
  };
  const nav={dataset:{},setAttribute(){}};
  const document={getElementById(id){if(id==='tab5')return button;if(id==='bottom-nav')return nav;return null}};
  enhanceBottomNav(document,'home');
  assert.equal(label.textContent,'Beranda');
  assert.equal(button.childNodes.filter(x=>x.nodeType===3&&String(x.textContent||'').trim()).length,0);
});

test('Prompt 5 CSS contains reference-specific settings geometry and 180-220ms navigation motion',()=>{
  const css=readFileSync('src/ui/ref01.css','utf8');
  assert.match(css,/--sj-ref-motion:\s*200ms/);
  assert.match(css,/\.sjr01-grid--five-compact/);
  assert.match(css,/\.sjr01-grid--three-wide/);
  assert.match(css,/\.sjr01-grid--four-compact/);
  assert.match(css,/\.sjr01-settings-logout/);
  assert.match(css,/transform:\s*scale\(\.95\)/);
});

import { installRefinementIconAuthority, LEGACY_ICON_MAP } from '../src/ui/icon-authority.js';

test('Prompt 5 installs one icon authority over legacy refinement renderers so VC01/VC02 cannot drift stylistically',()=>{
  let priorCalls=0;
  const runtime={SJPro:{icon(){priorCalls++;return 'legacy'}}};
  const api=installRefinementIconAuthority(runtime);
  assert.equal(api.installed,true);
  assert.equal(LEGACY_ICON_MAP.package,'warehouse-box');
  assert.equal(LEGACY_ICON_MAP.cart,'sale');
  assert.match(runtime.SJPro.icon('package'),/^<svg/);
  assert.match(runtime.SJPro.icon('bell'),/^<svg/);
  assert.equal(priorCalls,0);
  assert.equal(installRefinementIconAuthority(runtime),api);
});

test('Prompt 5 profile photo surface exposes replace and explicit remove lifecycle when a photo exists',()=>{
  const html=renderSettingsMarkup({name:'Owner Utama',roleLabel:'Owner / Pemilik',photoURL:'https://example.invalid/avatar.jpg'});
  assert.match(html,/data-ref01-profile="choose"/);
  assert.match(html,/data-ref01-profile="remove"/);
  assert.match(html,/Hapus foto profil/);
});

import { REFERENCE_IMPLEMENTATION_EVIDENCE } from '../src/ui/refinement-visual-contract.js';
import { existsSync } from 'node:fs';

test('Prompt 5 nine-reference authority has concrete implementation evidence instead of image-count-only coverage',()=>{
  assert.deepEqual(Object.keys(REFERENCE_IMPLEMENTATION_EVIDENCE),REQUIRED_REFERENCE_IDS);
  for(const id of REQUIRED_REFERENCE_IDS){
    const evidence=REFERENCE_IMPLEMENTATION_EVIDENCE[id];
    assert.ok(evidence.files.length>=1,`${id}: implementation files`);
    assert.ok(evidence.anchors.length>=1,`${id}: source anchors`);
    for(const file of evidence.files) assert.equal(existsSync(file),true,`${id}: missing ${file}`);
    for(const anchor of evidence.anchors){
      assert.equal(existsSync(anchor.file),true,`${id}: missing anchor file ${anchor.file}`);
      assert.match(readFileSync(anchor.file,'utf8'),new RegExp(anchor.token.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')),`${id}: anchor ${anchor.token}`);
    }
  }
});
