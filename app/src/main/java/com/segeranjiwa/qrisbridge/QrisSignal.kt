package com.segeranjiwa.qrisbridge

data class QrisSignal(
    val providerTransactionId: String,
    val amount: Long,
    val provider: String = "GOFOOD_MERCHANT",
    val detectedAt: Long = 0L
)

data class StoredQrisSignal(
    val providerTransactionId: String,
    val provider: String,
    val amount: Long,
    val firstSeenAt: Long,
    val lastSeenAt: Long,
    val sourceDeviceId: String,
    val status: String = "DETECTED"
)

enum class WriteResult { CREATED, ALREADY_EXISTS }

class InMemorySignalRepository {
    private val rows = linkedMapOf<String, StoredQrisSignal>()

    fun upsert(signal: QrisSignal, now: Long, sourceDeviceId: String): WriteResult {
        val id = signal.providerTransactionId
        val old = rows[id]
        if (old == null) {
            rows[id] = StoredQrisSignal(
                providerTransactionId = id,
                provider = signal.provider,
                amount = signal.amount,
                firstSeenAt = now,
                lastSeenAt = now,
                sourceDeviceId = sourceDeviceId
            )
            return WriteResult.CREATED
        }
        rows[id] = old.copy(lastSeenAt = now)
        return WriteResult.ALREADY_EXISTS
    }

    fun get(id: String): StoredQrisSignal? = rows[id]
    fun size(): Int = rows.size
}
