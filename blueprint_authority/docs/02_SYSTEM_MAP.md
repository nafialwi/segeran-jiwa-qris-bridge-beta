# 02 — TARGET SYSTEM MAP

## A. Gambaran besar

```text
┌──────────────────────────────────────────────────────────────┐
│                      SEGERAN JIWA POS                        │
├──────────────────────────────────────────────────────────────┤
│ APP SHELL                                                    │
│ Bootstrap | Session | Router | Role Guard | Connectivity     │
├──────────────────────────────────────────────────────────────┤
│ UI SYSTEM                                                    │
│ Tokens | Typography | Icons | Components | States | Nav      │
├──────────────────────────────────────────────────────────────┤
│ FEATURE MODULES                                              │
│ Dashboard | Sales | Payments | Operational | Reports | Setup │
├──────────────────────────────────────────────────────────────┤
│ DOMAIN / BUSINESS ENGINE                                     │
│ Pricing | Transaction | Inventory | Purchase/WAC | Debt      │
│ Shift | Costing/HPP | Report Calculation | Refund/VOID       │
├──────────────────────────────────────────────────────────────┤
│ DATA / INTEGRATION                                           │
│ Firebase Adapter | QRIS Adapter | Local Session | Cache      │
├──────────────────────────────────────────────────────────────┤
│ EXTERNAL                                                     │
│ Firebase RTDB | Firebase Auth if active | Printer/Share      │
└──────────────────────────────────────────────────────────────┘
```

## B. Folder map target

```text
src/
├── app/
│   ├── bootstrap.js
│   ├── router.js
│   ├── route-contract.js
│   └── app-state.js
│
├── core/
│   ├── session-manager.js
│   ├── role-guard.js
│   ├── connectivity.js
│   ├── error-journal.js
│   ├── idempotency.js
│   └── legacy-bridge.js
│
├── data/
│   ├── firebase-client.js
│   ├── repositories/
│   │   ├── user-repository.js
│   │   ├── transaction-repository.js
│   │   ├── inventory-repository.js
│   │   ├── purchase-repository.js
│   │   ├── shift-repository.js
│   │   ├── debt-repository.js
│   │   ├── settings-repository.js
│   │   └── report-repository.js
│   ├── qris-adapter.js
│   └── local-store.js
│
├── domain/
│   ├── pricing-service.js
│   ├── transaction-service.js
│   ├── inventory-service.js
│   ├── purchase-wac-service.js
│   ├── debt-service.js
│   ├── shift-service.js
│   ├── refund-void-service.js
│   ├── costing-service.js
│   └── report-service.js
│
├── modules/
│   ├── dashboard/
│   │   ├── owner-dashboard.js
│   │   └── cashier-dashboard.js
│   ├── sales/
│   │   ├── product-list.js
│   │   ├── cart.js
│   │   ├── checkout.js
│   │   └── barcode.js
│   ├── payments/
│   │   ├── cash.js
│   │   ├── qris.js
│   │   ├── transfer.js
│   │   └── credit.js
│   ├── operational/
│   │   ├── operational-home.js
│   │   ├── stock.js
│   │   ├── restock.js
│   │   ├── expense.js
│   │   ├── shift.js
│   │   ├── closing.js
│   │   ├── shift-note.js
│   │   ├── refund-void.js
│   │   └── employee-advance.js
│   ├── reports/
│   │   ├── report-home.js
│   │   ├── sales-report.js
│   │   ├── product-report.js
│   │   ├── customer-report.js
│   │   ├── finance-report.js
│   │   └── evidence-detail.js
│   └── settings/
│       ├── settings-home.js
│       ├── products.js
│       ├── categories.js
│       ├── materials-warehouse.js
│       ├── customers.js
│       ├── employees.js
│       ├── account.js
│       ├── users.js
│       ├── devices.js
│       ├── appearance.js
│       ├── store-identity.js
│       ├── printer.js
│       ├── notifications.js
│       ├── security-sync.js
│       ├── activity.js
│       ├── diagnostics.js
│       └── backup-restore.js
│
└── ui/
    ├── tokens.css
    ├── typography.css
    ├── layout.css
    ├── components.css
    ├── states.css
    ├── icons.js
    ├── bottom-nav.js
    └── screen-shell.js
```

## C. Runtime flow

### Login / restore

```text
App start
  ↓
SessionManager.restore()
  ↓
No session --------------------------→ Login
  ↓ session exists
Validate user/device/role
  ↓ valid
Restore role + active shift context
  ↓
Dashboard
```

### Sale

```text
Product UI
  ↓
Cart module
  ↓
PricingService.quote()
  ↓
Checkout
  ↓
Payment module
  ↓
TransactionService.commit()
  ↓
InventoryService / DebtService / QRIS finalization
  ↓
Receipt + Success
```

### QRIS

```text
Checkout
  ↓
QRIS Adapter
  ↓
Existing SJQrisSignalBeta pending/matching/recovery contract
  ↓
WAITING ──→ MATCHED ──→ transaction finalization
   │            │
   │            └── evidence/status
   ├── AMBIGUOUS → resolution
   ├── ERROR/OFFLINE → retry/manual fallback contract
   └── CANCEL → safe cancellation only
```

### Reporting

```text
Report screen
  ↓
ReportService
  ↓
Read-only repositories / snapshots
  ↓
Analytics layer
  ↓
Category layer
  ↓
Evidence drill-down
```

## D. Data boundaries yang dibekukan

- POS root: `/toko_segeranjiwa_v58`
- QRIS separate root: `segeranjiwa_qris_beta_v1`
- business writes tetap melalui engine existing yang dimigrasikan;
- report renderer read-only;
- tidak ada schema/rules migration sebagai efek samping refactor source.

## E. Session architecture target

### Disimpan lokal

Session envelope minimal, misalnya:

- schemaVersion;
- userId;
- lastKnownRole;
- displayName cache;
- validatedAt;
- device identifier/reference jika sudah tersedia;
- optional last route yang aman;
- active shift reference hanya sebagai hint, authoritative state tetap dari data shift.

### Tidak disimpan

- PIN plaintext;
- password plaintext;
- token buatan sendiri yang dapat menggantikan authorization server-side.

### Restore policy

- `SECURE/HYBRID`: gunakan Firebase Auth persisted user bila tersedia sebagai sumber utama, lalu mapping user/role/device.
- `LEGACY`: local session envelope dapat memulihkan user pada device yang sama setelah mengecek record user dan policy yang memungkinkan.
- sensitive operation tetap boleh meminta PIN ulang.
- logout manual menghapus semua session envelope lokal dan auth session yang relevan.
- revoked device / disabled user / invalid role mapping memaksa logout.
