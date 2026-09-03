# RC01-S10B Targeted Real-Device UAT — Pending-Write Traceability

Use only the Cloudflare Preview generated from the S10B RC branch. Do not use Production.

## UAT-A — Capture the stuck writer without creating new traffic

1. Open S10B Preview and wait 20–30 seconds. Do not create a sale, QRIS, restock, Firebase diagnostic test, or settings mutation.
2. If `MENUNGGU KONFIRMASI FIREBASE` is visible, open **Pengaturan → Diagnostik**.
3. Locate **FIREBASE WRITE TRACE** and capture one screenshot that includes:
   - `P3 Pending N`;
   - `Traced N`;
   - `Untraced N`;
   - `server connected/disconnected`;
   - every displayed active method/path/age.
4. Wait until any active write passes 15 seconds. Capture the same section again if it changes to `STUCK`.

PASS for traceability: at least one active path is visible when P3 Pending > 0, or an explicit `Untraced > 0` mismatch is visible. The red banner itself is not required to disappear in S10B.

## UAT-B — Refresh reproducibility

1. Refresh the same Preview once.
2. Wait 20–30 seconds without actions.
3. Re-open Diagnostics and capture FIREBASE WRITE TRACE.
4. Compare path/method with UAT-A.

Interpretation:
- Same path repeats: strong root-cause candidate.
- Different paths: capture all; there may be multiple startup writers.
- `P3 Pending > 0`, `Traced 0`, `Untraced > 0`: accounting/instrumentation mismatch; do not patch a writer yet.
- `P3 Pending 0` and banner still red: stale sync UI; capture dashboard + trace box.

## UAT-C — Evidence preservation

Do not press `TEST FIREBASE READ/WRITE`, `BERSIHKAN ERROR LOG`, security migration buttons, or create a new QRIS transaction until the trace evidence is reviewed. Historical error rows may remain; S10B evidence is the FIREBASE WRITE TRACE box and any new `SYNC_WRITE_STUCK` entry.
