export const PRIMARY_ROUTES=Object.freeze({
  home:Object.freeze({key:'home',label:'Beranda',legacyView:5}),
  sales:Object.freeze({key:'sales',label:'Jual',legacyView:1}),
  operational:Object.freeze({key:'operational',label:'Operasional',legacyView:2}),
  reports:Object.freeze({key:'reports',label:'Laporan',legacyView:3}),
  settings:Object.freeze({key:'settings',label:'Pengaturan',legacyView:4,ownerOnly:true})
});

export const OPERATIONAL_CHILDREN=Object.freeze({
  1:Object.freeze({key:'shift',label:'Manajemen Shift',cashier:true}),
  3:Object.freeze({key:'stock',label:'Stok',cashier:true}),
  4:Object.freeze({key:'legacy-stock-bakaran',label:'Stok Bakaran',status:'legacy-hidden',cashier:false}),
  5:Object.freeze({key:'customer-debt',label:'Hutang Pelanggan',cashier:true}),
  6:Object.freeze({key:'employee-advance',label:'Kasbon Karyawan',cashier:false}),
  7:Object.freeze({key:'expense',label:'Pengeluaran',cashier:true}),
  9:Object.freeze({key:'restock',label:'Permintaan Restock',cashier:true}),
  10:Object.freeze({key:'shift-note',label:'Catatan Shift',cashier:true}),
  11:Object.freeze({key:'cash-movement',label:'Mutasi Kas',cashier:false}),
  12:Object.freeze({key:'refund-void',label:'Retur / Refund',cashier:false})
});

export const REPORT_CHILDREN=Object.freeze({
  1:Object.freeze({key:'daily',label:'Harian',cashier:false}),
  2:Object.freeze({key:'monthly',label:'Bulanan',cashier:false}),
  3:Object.freeze({key:'shift',label:'Shift',cashier:true}),
  4:Object.freeze({key:'transactions',label:'Transaksi',cashier:false}),
  5:Object.freeze({key:'analysis',label:'Analisis',cashier:false})
});

export const SETTINGS_CHILDREN=Object.freeze({
  1:Object.freeze({key:'products',label:'Produk'}),
  2:Object.freeze({key:'categories',label:'Kategori'}),
  4:Object.freeze({key:'store-identity',label:'Identitas Toko'}),
  5:Object.freeze({key:'users',label:'Pengguna'}),
  6:Object.freeze({key:'printer-device',label:'Perangkat & Printer'}),
  7:Object.freeze({key:'diagnostics',label:'Diagnostik'}),
  8:Object.freeze({key:'activity',label:'Aktivitas'}),
  9:Object.freeze({key:'customers',label:'Pelanggan'}),
  10:Object.freeze({key:'employees',label:'Karyawan'})
});

const VIEW_TO_ROUTE=Object.freeze(Object.fromEntries(Object.values(PRIMARY_ROUTES).map(route=>[route.legacyView,route.key])));
export function legacyViewToRoute(view){return VIEW_TO_ROUTE[Number(view)]??null}
export function routeToLegacyView(route){return PRIMARY_ROUTES[route]?.legacyView??null}
export function transactionParentRoute(){return 'sales'}
