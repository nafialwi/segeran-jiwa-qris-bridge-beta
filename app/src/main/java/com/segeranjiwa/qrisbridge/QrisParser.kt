package com.segeranjiwa.qrisbridge

object QrisParser {
    const val ACCEPTED_TITLE = "Pembayaran QRIS diterima!"

    private val payment = Regex(
        "Rp\\s*([0-9.]+)\\s+berhasil\\s+diterima\\.?\\s*ID\\s+transaksi:\\s*([A-Za-z0-9_-]+)",
        RegexOption.IGNORE_CASE
    )

    fun parse(title: String?, textBlocks: List<String>): List<QrisSignal> {
        if (!title.orEmpty().trim().equals(ACCEPTED_TITLE, ignoreCase = true)) return emptyList()
        val out = mutableListOf<QrisSignal>()
        for (block in textBlocks) {
            for (match in payment.findAll(block)) {
                val amount = match.groupValues[1].replace(".", "").toLongOrNull() ?: continue
                val id = match.groupValues[2].trim()
                if (amount <= 0 || id.isBlank()) continue
                out += QrisSignal(providerTransactionId = id, amount = amount)
            }
        }
        return out.distinctBy { it.providerTransactionId }
    }
}
