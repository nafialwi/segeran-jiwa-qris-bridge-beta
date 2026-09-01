# QA Handoff — Reports & Finished-Goods Inventory v2.6

After deployment, perform one consolidated UAT pass:

1. Reports as Owner
   - Open Reports → `Riwayat Penjualan`.
   - Change period/date and filters.
   - Open a transaction and confirm product names/qty/amounts are visible.
   - Toggle Top Products between `Jumlah Terjual` and `Omzet`.

2. Reports as Cashier
   - Open Reports → `Riwayat Penjualan`.
   - Confirm transaction/product detail is visible.
   - Confirm there is no Refund/VOID administrative action on the report surface.

3. Operational → `Stok & Gudang` as Owner
   - Confirm product-only balances show Gudang and Gerai.
   - `Terima ke Gudang` must open the existing purchase receiver with ingredient options removed from the selector.
   - `Kirim ke Gerai` must open the existing transfer writer with ingredient options removed.
   - `Stok Gerai` must open the existing Stock page.

4. Recipe area
   - If opened from advanced Bahan & Gudang, existing `Nonaktifkan` should read `Batalkan Rumus`.
   - Do not delete recipe history; cancelled formula should be nonactive.

5. Sales quantity stepper
   - Add a product and inspect the `− qty +` control.
   - Qty changes must still synchronize with Mini Cart and Checkout.
