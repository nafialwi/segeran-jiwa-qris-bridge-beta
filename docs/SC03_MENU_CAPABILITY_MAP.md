# SC-03 Menu and Capability Map

SC-03 preserves the live v1.0.40 menu contract. It does not add REF-01-only menu items merely because they exist in visual authority references.

## Primary routes

| Route | Legacy view | Owner | Cashier |
|---|---:|---:|---:|
| Beranda | 5 | yes | yes |
| Jual | 1 | yes | yes |
| Operasional | 2 | yes | yes |
| Laporan | 3 | yes | yes |
| Pengaturan | 4 | yes | **no** |

Transaction children `cart`, `checkout`, and every `payment:*` route always keep `Jual` as their parent in `app-state.js`.

## Operational children

| ID | Capability | Owner | Cashier | SC-03 status |
|---:|---|---:|---:|---|
| 1 | Manajemen Shift | yes | yes | mapped |
| 3 | Stok | yes | yes | mapped |
| 4 | Stok Bakaran legacy | no | no | **hidden; not revived** |
| 5 | Hutang Pelanggan | yes | yes | mapped |
| 6 | Kasbon Karyawan | yes | no | mapped |
| 7 | Pengeluaran | yes | yes | mapped |
| 9 | Permintaan Restock | yes | yes | mapped |
| 10 | Catatan Shift | yes | yes | mapped |
| 11 | Mutasi Kas | yes | no | mapped |
| 12 | Retur / Refund | yes | no | mapped |

## Report children

| ID | Capability | Owner | Cashier |
|---:|---|---:|---:|
| 1 | Harian | yes | no |
| 2 | Bulanan | yes | no |
| 3 | Shift | yes | yes |
| 4 | Transaksi | yes | no |
| 5 | Analisis | yes | no |

## Settings children

All current Settings children are Owner-only: 1 Produk, 2 Kategori, 4 Identitas Toko, 5 Pengguna, 6 Perangkat & Printer, 7 Diagnostik, 8 Aktivitas, 9 Pelanggan, 10 Karyawan.

The module boundaries `appearance` and `security-sync` are intentionally `deferred`. Appearance is REF-01 visual-refinement scope; security/session persistence is SC-04/future scope. SC-03 does not synthesize new routes for either.
