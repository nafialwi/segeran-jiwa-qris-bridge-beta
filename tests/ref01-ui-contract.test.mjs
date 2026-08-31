import test from 'node:test';
import assert from 'node:assert/strict';
import { ICONS, renderIcon } from '../src/ui/icons.js';
import { PRIMARY_NAV, navState, enhanceBottomNav } from '../src/ui/bottom-nav.js';
import { SETTINGS_GROUPS, PAYMENT_METHODS, REPORT_HEADLINES, IMPLICIT_CAPABILITIES, RESPONSIVE_TARGETS } from '../src/ui/refinement-contract.js';
import { SYSTEM_STATES, stateModel } from '../src/ui/screen-shell.js';
import { readFile } from 'node:fs/promises';

const minimumIcons=['home','sale','operations','reports','settings','cash','users','inventory','shift','note','refund','employee','printer','bell','security','activity','diagnostics','backup','camera','image'];

test('REF-01 semantic icon registry covers the frozen IA with SVG-only output',()=>{
  for(const name of minimumIcons) assert.ok(ICONS[name],`missing icon ${name}`);
  const svg=renderIcon('home',{size:20,label:'Beranda'});
  assert.match(svg,/^<svg/);
  assert.match(svg,/aria-label="Beranda"/);
  assert.doesNotMatch(svg,/[\p{Extended_Pictographic}]/u);
});

test('REF-01 primary navigation is exactly five semantic tabs with a 200ms active motion contract',()=>{
  assert.deepEqual(PRIMARY_NAV.map(x=>x.label),['Beranda','Jual','Operasional','Laporan','Pengaturan']);
  assert.deepEqual(PRIMARY_NAV.map(x=>x.route),['home','sales','operational','reports','settings']);
  const state=navState('reports');
  assert.equal(state.find(x=>x.route==='reports').active,true);
  assert.equal(state.filter(x=>x.active).length,1);
  assert.equal(state[0].motionMs,200);
});

test('REF-01 Settings IA contains all grouped responsibilities and separates sensitive actions',()=>{
  assert.deepEqual(Object.keys(SETTINGS_GROUPS),['Toko','Akses','Tampilan & Perangkat','Sistem','Data','Zona Sensitif']);
  const labels=Object.values(SETTINGS_GROUPS).flat().map(x=>x.label);
  for(const label of ['Produk','Kategori','Bahan & Gudang','Pelanggan','Karyawan','Akun Saya','Pengguna','Perangkat Aktif','Tampilan Aplikasi','Identitas Toko','Printer','Notifikasi','Keamanan & Sinkronisasi','Aktivitas','Diagnostik','Backup & Restore']) assert.ok(labels.includes(label),label);
  assert.ok(SETTINGS_GROUPS['Zona Sensitif'].every(x=>x.sensitive===true));
});

test('REF-01 checkout/report/state contracts preserve business semantics instead of demo values',()=>{
  assert.deepEqual(PAYMENT_METHODS.map(x=>x.key),['Tunai','QRIS','Transfer','Kasbon']);
  assert.deepEqual(REPORT_HEADLINES,['Total Penjualan','Transaksi','Laba Kotor']);
  assert.equal(stateModel('empty').recoverable,true);
  assert.equal(stateModel('permission').recoverable,false);
  assert.deepEqual(SYSTEM_STATES,['loading','empty','error','success','offline','permission','retry']);
  assert.equal(IMPLICIT_CAPABILITIES.unknownHpp.display,'Belum tersedia');
  assert.equal(IMPLICIT_CAPABILITIES.transferProof.persistence,'draft-only-until-existing-writer');
});

test('REF-01 implicit visual logic includes photo lifecycle, scanner fallback and stale shift recovery',()=>{
  assert.deepEqual(IMPLICIT_CAPABILITIES.productPhoto.actions,['add','preview','replace','remove']);
  assert.equal(IMPLICIT_CAPABILITIES.productPhoto.persistence,'existing-product-writer');
  assert.deepEqual(IMPLICIT_CAPABILITIES.profilePhoto.actions,['add','preview','replace','remove']);
  assert.equal(IMPLICIT_CAPABILITIES.barcode.manualFallback,true);
  assert.equal(IMPLICIT_CAPABILITIES.staleShift.autoClose,false);
  assert.equal(IMPLICIT_CAPABILITIES.staleShift.closingAuthority,'existing-SJShift');
});

test('REF-01 responsive source encodes mobile/tablet/desktop and 44px touch targets',async()=>{
  assert.deepEqual(RESPONSIVE_TARGETS.mobile,[320,390,430]);
  const css=await readFile(new URL('../src/ui/ref01.css',import.meta.url),'utf8');
  assert.match(css,/--sj-ref-motion:\s*200ms/);
  assert.match(css,/min-height:\s*44px/);
  assert.match(css,/@media\s*\(min-width:\s*768px\)/);
  assert.match(css,/@media\s*\(min-width:\s*1200px\)/);
});


test('REF-01 bottom navigation reconciles the existing UI01 label span without adding a second visible label',()=>{
  const icon={innerHTML:''};

  const label={
    nodeType:1,
    className:'sjui01-nav-label',
    textContent:'Beranda'
  };

  const button={
    dataset:{},
    childNodes:[],
    classList:{toggle(){}},

    querySelector(sel){
      if(sel==='.nav-icon') return icon;
      if(sel==='.sjui01-nav-label') return label;
      return null;
    },

    insertAdjacentText(_where,text){
      this.childNodes.push({
        nodeType:3,
        textContent:text
      });
    }
  };

  const legacyText={
    nodeType:3,
    textContent:'Dashboard',

    remove(){
      button.childNodes=
        button.childNodes.filter(x=>x!==legacyText);
    }
  };

  button.childNodes=[
    {nodeType:1},
    label,
    legacyText
  ];

  const nav={
    dataset:{},
    setAttribute(){}
  };

  const document={
    getElementById(id){
      if(id==='tab5') return button;
      if(id==='bottom-nav') return nav;
      return null;
    }
  };

  enhanceBottomNav(document,'home');

  const directVisibleText=
    button.childNodes.filter(
      x=>x.nodeType===3 &&
      String(x.textContent||'').trim()
    );

  assert.equal(label.textContent,'Beranda');

  assert.equal(
    directVisibleText.length,
    0,
    'existing semantic label span must be the sole label authority'
  );
});
