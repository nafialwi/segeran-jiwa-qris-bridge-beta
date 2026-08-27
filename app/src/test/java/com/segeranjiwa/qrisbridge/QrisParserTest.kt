package com.segeranjiwa.qrisbridge

import org.junit.Assert.*
import org.junit.Test

class QrisParserTest {
    @Test fun parsesSinglePayment() {
        val out = QrisParser.parse("Pembayaran QRIS diterima!", listOf("Rp2.000 berhasil diterima. ID transaksi: rVWbDXID"))
        assertEquals(listOf(QrisSignal("rVWbDXID", 2000)), out)
    }

    @Test fun parsesAllEntriesInAggregatedSnapshotAndDedupesRepeatedId() {
        val out = QrisParser.parse("Pembayaran QRIS diterima!", listOf(
            "Rp6.000 berhasil diterima. ID transaksi: plk0FZID\nRp1.000 berhasil diterima. ID transaksi: XQdGyuID\nRp2.000 berhasil diterima. ID transaksi: rVWbDXID",
            "Rp2.000 berhasil diterima. ID transaksi: rVWbDXID"
        ))
        assertEquals(3, out.size)
        assertEquals(setOf("plk0FZID","XQdGyuID","rVWbDXID"), out.map { it.providerTransactionId }.toSet())
    }

    @Test fun acceptsSafeObservedFormattingVariants() {
        val out = QrisParser.parse("  pembayaran qris diterima!  ", listOf("Rp 6.000 berhasil diterima ID Transaksi: Case_1-x"))
        assertEquals(listOf(QrisSignal("Case_1-x", 6000)), out)
    }

    @Test fun ignoresUnrelatedOrMalformedNotifications() {
        assertTrue(QrisParser.parse("Pesanan baru", listOf("Rp2.000 berhasil diterima. ID transaksi: X")).isEmpty())
        assertTrue(QrisParser.parse("Pembayaran QRIS diterima!", listOf("RpABC berhasil diterima. ID transaksi: X")).isEmpty())
    }
}
