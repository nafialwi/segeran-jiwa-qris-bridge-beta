const freezeItems=(items)=>Object.freeze(items.map(item=>Object.freeze(item)));
const group=(layout,items)=>Object.freeze({layout,items:freezeItems(items)});

export const REQUIRED_REFERENCE_IDS=Object.freeze([
  'REF_01','REF_02_BOTTOM_NAV_MOTION','REF_03','REF_04','REF_05','REF_06','REF_07','REF_08','REF_09'
]);

export const VISUAL_ICON_MAP=Object.freeze({
  'Produk':'shopping-bag','Kategori':'category-grid','Bahan & Gudang':'warehouse-box','Pelanggan':'customers','Karyawan':'id-card',
  'Akun Saya':'account-circle','Pengguna':'users-access','Perangkat Aktif':'devices','Tampilan Aplikasi':'palette','Identitas Toko':'storefront',
  'Printer':'printer','Notifikasi':'bell','Keamanan & Sinkronisasi':'shield-lock','Aktivitas':'history','Diagnostik':'stethoscope',
  'Backup & Restore':'cloud-upload','Kelola Data Sensitif':'shield-alert','Keluar':'logout'
});

const item=(label,feature,note)=>Object.freeze({label,feature,icon:VISUAL_ICON_MAP[label],note});

export const SETTINGS_LAYOUT=Object.freeze({
  Toko:group('five-compact',[
    item('Produk','settings.products','Kelola produk dan varian'),
    item('Kategori','settings.categories','Kelola kategori produk'),
    item('Bahan & Gudang','settings.materials-warehouse','Kelola stok bahan dan gudang'),
    item('Pelanggan','settings.customers','Kelola data pelanggan'),
    item('Karyawan','settings.employees','Kelola data karyawan')
  ]),
  Akses:group('three-wide',[
    item('Akun Saya','settings.account','Kelola profil dan pengaturan akun'),
    item('Pengguna','settings.users','Kelola akses pengguna'),
    item('Perangkat Aktif','settings.devices','Kelola perangkat yang terhubung')
  ]),
  'Tampilan & Perangkat':group('three-wide',[
    item('Tampilan Aplikasi','ref01.appearance','Atur tema, bahasa, dan preferensi'),
    item('Identitas Toko','settings.store-identity','Nama, logo, dan informasi toko'),
    item('Printer','settings.printer','Kelola printer dan pengaturan cetak')
  ]),
  Sistem:group('four-compact',[
    item('Notifikasi','settings.notifications','Atur preferensi notifikasi'),
    item('Keamanan & Sinkronisasi','ref01.security','Atur keamanan dan sinkronisasi data'),
    item('Aktivitas','settings.activity','Riwayat aktivitas sistem'),
    item('Diagnostik','settings.diagnostics','Cek kesehatan sistem POS')
  ]),
  Data:group('full-width',[
    item('Backup & Restore','ref01.backup','Cadangkan atau pulihkan data toko Anda')
  ]),
  'Zona Sensitif':group('danger-full-width',[
    item('Kelola Data Sensitif','ref01.sensitive','Kelola, ekspor, atau hapus data sensitif toko')
  ]),
  logout:Object.freeze({label:'Keluar',feature:'ref01.logout',icon:VISUAL_ICON_MAP.Keluar})
});

const reference=(surfaces,visualAnchors,behavior,authority)=>Object.freeze({
  surfaces:Object.freeze(surfaces),visualAnchors:Object.freeze(visualAnchors),behavior:Object.freeze(behavior),authority:Object.freeze(authority),status:'implemented'
});

export const REFERENCE_MATRIX=Object.freeze({
  REF_01:reference(
    ['settings-home','profile-media'],
    ['grouped responsibility sections','profile photo card','sensitive zone + logout'],
    ['profile add/replace/remove','group navigation','manual logout'],
    ['SC03 settings feature registry','SJAccountV5964','SC04 logout authority']
  ),
  REF_02_BOTTOM_NAV_MOTION:reference(
    ['bottom-navigation'],
    ['five semantic destinations','single label authority','mint active capsule'],
    ['pressed scale feedback','200ms active motion','role-safe routing'],
    ['legacy showView + SC03 route/role guard']
  ),
  REF_03:reference(
    ['stock','customer-debt','operational-home','product-edit'],
    ['KPI summaries','list rows with status','operational action grid','photo-first edit form'],
    ['stock/debt drill-down','operational routing','photo/barcode edit'],
    ['SJFinalRefinementVC02A','existing debt authority','existing product writer']
  ),
  REF_04:reference(
    ['owner-dashboard','cashier-dashboard','sales','checkout'],
    ['role-specific dashboard','photo product grid','floating cart CTA','payment summary'],
    ['account/profile drill-down','product/cart actions','checkout method selection'],
    ['SJFinalRefinementVC01A','SJFinalRefinementVC01A2','processTransaction']
  ),
  REF_05:reference(
    ['shift-handover','closing-shift','refund-void','transaction-detail'],
    ['active-shift identity','cash denomination worksheet','selected transaction evidence','receipt/timeline actions'],
    ['stale shift recovery','handover/close','permission-aware refund/void','print/share receipt'],
    ['SJShift','existing refund/void authority','existing receipt authority']
  ),
  REF_06:reference(
    ['reports','notifications','product-manager','advanced-settings'],
    ['period KPI/trend','notification filter/history','product photo manager','grouped advanced responsibilities'],
    ['period/category drill-down','read/deep-link notification','add/replace product photo'],
    ['SJReportFoundationV010','SJX notifications','existing product writer']
  ),
  REF_07:reference(
    ['cart','barcode-scanner','restock','expense'],
    ['thumbnail cart rows','camera/manual scanner','restock status sections','structured expense form/history'],
    ['qty/remove/checkout','camera + manual fallback','request/approval routing','expense submit/history'],
    ['legacy cart authority','SJBarcodeV1','existing restock authority','existing expense writer']
  ),
  REF_08:reference(
    ['checkout','cash-payment','qris-wait','qris-resolution'],
    ['payment method cards','large cash total/change','QR/timer/status','success + ambiguity warning'],
    ['cash denomination/input','QRIS status check','ambiguous payment resolution'],
    ['processTransaction','SJQrisSignalBeta','existing QRIS resolver']
  ),
  REF_09:reference(
    ['transfer-kasbon','product-edit-detail','stock-adjustment','system-states'],
    ['transfer/kasbon sections','photo/barcode/stock form','stock mutation timeline','empty/loading/error/success/permission states'],
    ['transfer proof draft lifecycle','existing product save','reasoned stock adjustment','recoverable state actions'],
    ['existing payment writer','existing product writer','existing inventory writer','REF01 system state family']
  )
});

const evidence=(files,anchors)=>Object.freeze({
  files:Object.freeze(files),
  anchors:Object.freeze(anchors.map(x=>Object.freeze(x)))
});

export const REFERENCE_IMPLEMENTATION_EVIDENCE=Object.freeze({
  REF_01:evidence(
    ['src/ui/settings-refinement.js','src/ui/media-lifecycle.js','src/app/ref01-bootstrap.js'],
    [
      {file:'src/ui/settings-refinement.js',token:'sjr01-settings-page'},
      {file:'src/ui/media-lifecycle.js',token:'saveProfilePhoto'},
      {file:'src/app/ref01-bootstrap.js',token:'renderSettingsLanding'}
    ]
  ),
  REF_02_BOTTOM_NAV_MOTION:evidence(
    ['src/ui/bottom-nav.js','src/ui/role-nav-refinement.js','src/ui/ref01.css'],
    [
      {file:'src/ui/bottom-nav.js',token:'enhanceBottomNav'},
      {file:'src/ui/role-nav-refinement.js',token:'reconcileRoleNavigation'},
      {file:'src/ui/ref01.css',token:'--sj-ref-motion:200ms'}
    ]
  ),
  REF_03:evidence(
    ['baseline/legacy-v1.0.40.html','src/ui/icon-authority.js','src/ui/media-lifecycle.js'],
    [
      {file:'baseline/legacy-v1.0.40.html',token:'SJFinalRefinementVC02A'},
      {file:'src/ui/icon-authority.js',token:'installRefinementIconAuthority'},
      {file:'src/ui/media-lifecycle.js',token:"target==='product'"}
    ]
  ),
  REF_04:evidence(
    ['baseline/legacy-v1.0.40.html','src/ui/icon-authority.js','src/app/ref01-bootstrap.js'],
    [
      {file:'baseline/legacy-v1.0.40.html',token:'SJFinalRefinementVC01A'},
      {file:'baseline/legacy-v1.0.40.html',token:'SJFinalRefinementVC01A2'},
      {file:'src/app/ref01-bootstrap.js',token:'enhanceProfileAvatars'}
    ]
  ),
  REF_05:evidence(
    ['src/ui/shift-refinement.js','src/ui/critical-operational-refinement.js','src/ui/transaction-detail-refinement.js'],
    [
      {file:'src/ui/shift-refinement.js',token:'createStaleShiftAdapter'},
      {file:'src/ui/critical-operational-refinement.js',token:'sjr05-closing-overlay'},
      {file:'src/ui/transaction-detail-refinement.js',token:'sjr05-receipt-open'}
    ]
  ),
  REF_06:evidence(
    ['src/ui/report-refinement.js','src/ui/notification-refinement.js','src/ui/media-lifecycle.js'],
    [
      {file:'src/ui/report-refinement.js',token:'installReportRefinement'},
      {file:'src/ui/notification-refinement.js',token:'installNotificationRefinement'},
      {file:'src/ui/media-lifecycle.js',token:"target==='product'"}
    ]
  ),
  REF_07:evidence(
    ['baseline/legacy-v1.0.40.html','src/app/ref01-bootstrap.js','src/ui/refinement-contract.js'],
    [
      {file:'baseline/legacy-v1.0.40.html',token:'SJBarcodeV1'},
      {file:'src/app/ref01-bootstrap.js',token:'enhanceScanner'},
      {file:'src/ui/refinement-contract.js',token:'manualFallback:true'}
    ]
  ),
  REF_08:evidence(
    ['baseline/legacy-v1.0.40.html','src/ui/refinement-contract.js'],
    [
      {file:'baseline/legacy-v1.0.40.html',token:'async function processTransaction()'},
      {file:'baseline/legacy-v1.0.40.html',token:'SJQrisSignalBeta'},
      {file:'src/ui/refinement-contract.js',token:"Object.freeze({key:'Tunai'"}
    ]
  ),
  REF_09:evidence(
    ['src/app/ref01-bootstrap.js','src/ui/refinement-contract.js','src/ui/states.css'],
    [
      {file:'src/app/ref01-bootstrap.js',token:'sj-ref-transfer-draft'},
      {file:'src/ui/refinement-contract.js',token:"persistence:'draft-only-until-existing-writer'"},
      {file:'src/ui/states.css',token:'state'}
    ]
  )
});
