const item=(key,label,icon,feature,{sensitive=false,note=''}={})=>Object.freeze({key,label,icon,feature,sensitive,note});

export const SETTINGS_GROUPS=Object.freeze({
  'Toko':Object.freeze([
    item('products','Produk','product','settings.products'),
    item('categories','Kategori','category','settings.categories'),
    item('materials','Bahan & Gudang','inventory','settings.materials-warehouse'),
    item('customers','Pelanggan','users','settings.customers'),
    item('employees','Karyawan','employee','settings.employees')
  ]),
  'Akses':Object.freeze([
    item('account','Akun Saya','employee','settings.account'),
    item('users','Pengguna','users','settings.users'),
    item('devices','Perangkat Aktif','device','settings.devices')
  ]),
  'Tampilan & Perangkat':Object.freeze([
    item('appearance','Tampilan Aplikasi','palette','ref01.appearance'),
    item('store','Identitas Toko','store','settings.store-identity'),
    item('printer','Printer','printer','settings.printer')
  ]),
  'Sistem':Object.freeze([
    item('notifications','Notifikasi','bell','settings.notifications'),
    item('security','Keamanan & Sinkronisasi','security','ref01.security'),
    item('activity','Aktivitas','activity','settings.activity'),
    item('diagnostics','Diagnostik','diagnostics','settings.diagnostics')
  ]),
  'Data':Object.freeze([
    item('backup','Backup & Restore','backup','ref01.backup')
  ]),
  'Zona Sensitif':Object.freeze([
    item('delete-selected','Kelola Data Sensitif','security','ref01.sensitive',{sensitive:true,note:'Aksi destruktif wajib deliberate dan terpisah.'})
  ])
});

export const PAYMENT_METHODS=Object.freeze([
  Object.freeze({key:'Tunai',icon:'cash'}),Object.freeze({key:'QRIS',icon:'image'}),Object.freeze({key:'Transfer',icon:'backup'}),Object.freeze({key:'Kasbon',icon:'note'})
]);
export const REPORT_HEADLINES=Object.freeze(['Total Penjualan','Transaksi','Laba Kotor']);
export const REPORT_CATEGORIES=Object.freeze(['Penjualan','Produk','Pelanggan','Keuangan']);
export const RESPONSIVE_TARGETS=Object.freeze({mobile:Object.freeze([320,390,430]),tablet:768,desktop:1200,touch:44});
export const SCREEN_FAMILIES=Object.freeze(['dashboard','sales','cart','checkout','payments','operational','shift-closing','refund-void','reports','settings','system-states']);
export const IMPLICIT_CAPABILITIES=Object.freeze({
  productPhoto:Object.freeze({actions:Object.freeze(['add','preview','replace','remove']),persistence:'existing-product-writer'}),
  storeImages:Object.freeze({actions:Object.freeze(['add','preview','replace','remove']),persistence:'existing-store-settings-writer'}),
  profilePhoto:Object.freeze({actions:Object.freeze(['add','preview','replace','remove']),persistence:'existing-storage-plus-firebase-auth-profile'}),
  barcode:Object.freeze({camera:true,manualFallback:true,manualSurface:'sales-search'}),
  transferProof:Object.freeze({actions:Object.freeze(['add','preview','replace','remove']),persistence:'draft-only-until-existing-writer'}),
  unknownHpp:Object.freeze({display:'Belum tersedia',zeroWhenUnknown:false}),
  staleShift:Object.freeze({showDate:true,showDuration:true,showOverdue:true,autoClose:false,closingAuthority:'existing-SJShift'}),
  badges:Object.freeze({source:'real-runtime-state',demoValues:false})
});
