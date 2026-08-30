# SC-01 Route & Menu Map

## Canonical bottom navigation found in baseline

- Beranda
- Jual
- Operasional
- Laporan
- Pengaturan

## Legacy tab IDs

- `tab1`
- `tab2`
- `tab3`
- `tab4`
- `tab5`

## Route/open/render function candidates

- `renderApp()`
- `showView()`
- `openOpr()`
- `closeOpr()`
- `openLap()`
- `closeLap()`
- `openMst()`
- `closeMst()`
- `renderMenu()`
- `openCartModal()`
- `renderStock()`
- `renderHutang()`
- `openPayModal()`
- `showReportFullscreen()`
- `renderTopSeller()`
- `showTxDay()`
- `renderMasterData()`
- `openAddMenu()`
- `openEditMasterModal()`
- `renderUsers()`
- `showModalInput()`
- `closeModalInput()`
- `showToast()`
- `showLoading()`
- `openModalHapusGranular()`
- `closeModalHapusGranular()`
- `open()`
- `renderTabs()`
- `renderWorkspace()`
- `renderSummary()`
- `renderIngredients()`
- `renderRecipes()`
- `renderExisting()`
- `renderTransfer()`
- `renderPurchase()`
- `renderOpname()`
- `renderMovementRows()`
- `renderMovements()`
- `showEstimateWarning()`
- `openVariantPicker()`
- `openRecipeDesktopCart()`
- `renderDashboardTiles()`
- `showWaiting()`
- `renderCommercialQrisState()`
- `renderAmbiguityResolver()`
- `renderWaiting()`
- `openQrisDismiss()`
- `openQrisEventDetail()`
- `openCameraScanner()`
- `renderCart()`
- `renderPayment()`
- `renderFloating()`
- `openDiscount()`
- `openSettings()`
- `renderSettings()`
- `openInitialCost()`
- `renderPurchaseCosting()`
- `renderProfitabilitySection()`
- `renderPurchaseHistory()`
- `showHTML()`
- `renderCategory()`
- `renderEvent()`
- `renderHome()`
- `showAll()`
- `openCategory()`
- `openEvent()`
- `openQrisPaymentSafe()`
- `renderOperations()`
- `renderStockHistory()`
- `renderRestock()`

## Operational route/function candidates

- `sjExpenseEntries()`
- `sjExpenseBreakdown()`
- `sjStockQty()`
- `sjTrackStock()`
- `sjMinStock()`
- `sjStatusStock()`
- `changeDateAndShift()`
- `openOpr()`
- `closeOpr()`
- `renderStock()`
- `lunasiKasbonKaryawan()`
- `addKasbonKaryawan()`
- `simpanKasbonKaryawan()`
- `populateKasbonList()`
- `filterKasbon()`
- `sjSaveExpense()`
- `deleteExpense()`
- `sjRenderStockModule()`
- `sjOpenRestock()`
- `sjSaveStock()`
- `sjPrintShiftReport()`
- `sjStopShiftDetailLive()`
- `sjCloseOwnerShiftDetail()`
- `sjBindOwnerShiftDrilldown()`
- `sjOwnerShiftLiveSummaryHTML()`
- `sjRenderOwnerShiftDetailData()`
- `sjOpenOwnerShiftDetail()`
- `sjCashCloseEnhanceShiftModal()`
- `allStockChoices()`
- `patchStockHelpers()`
- `isShiftSessionMismatch()`
- `refundAllocation()`
- `stockLineCost()`
- `remainingStock()`
- `applyExpensePurchase()`
- `patchExpenseDelete()`
- `transactionsFromShifts()`
- `profitabilityForShifts()`
- `refundCosting()`
- `refundRows()`
- `persistRefundCosting()`
- `applyRefundCostingToTx()`
- `recoverOneRefundCosting()`
- `recoverRefundCosting()`
- `refundNet()`
- `activeShiftKey()`
- `addShiftMeta()`
- `readShiftPeriod()`
- `collectShiftPeriod()`
- `shiftDetailForView()`
- `stockStats()`
- `setStockFilter()`
- `setStockSearch()`
- `renderStockHistory()`
- `lowStockRows()`
- `renderRestock()`

## Report route/function candidates

- `calcLaporan()`
- `reportHarian()`
- `showReportFullscreen()`
- `reportBulanan()`
- `exportCSV()`
- `sjAggregateReport()`
- `sjReportHTML()`
- `sjLoadReport()`
- `sjReportLines()`
- `sjMakeReportCanvas()`
- `sjExportReportImage()`
- `sjPrintShiftReport()`
- `installReportPatch()`

## Modal IDs (legacy surface inventory)

- `modal-add-menu`
- `modal-bayar`
- `modal-cart`
- `modal-edit-master`
- `modal-export`
- `modal-hapus-granular`
- `modal-input-custom`
- `modal-input-field`
- `modal-input-title`
- `modal-qris-fs`
- `modal-report-fs`
- `modal-sj-account`
- `modal-sj-discount`
- `modal-sj-expense`
- `modal-sj-payment`
- `modal-sj-qris-dismiss`
- `modal-sj-qris-event-detail`
- `modal-sj-qris-problem`
- `modal-sj-qris-wait`
- `modal-sj-shift-detail`
- `modal-sj-stock`
- `modal-sjcost-initial`
- `modal-sjinv`
- `modal-sjinv-variant`
- `modal-sjmux-quick`
- `modal-sjmux-ui`
- `modal-sjp2-confirm`
- `modal-sjp2-profile`
- `modal-sjp2-search`
- `modal-sjrel-restore`
- `modal-sjshift-close`
- `modal-sjshift-handover`
- `modal-sjux-bulk-category`
- `modal-sjux-category`
- `modal-sjx-notif`
- `modal-sjx-person`
- `modal-sjx-restock`
- `modal-struk-fs`
- `modal-tambah-kasbon`
- `modal-tx`

SC-03 must map every visible existing menu to one final renderer path; child checkout/payment flow remains under parent route **Jual**.