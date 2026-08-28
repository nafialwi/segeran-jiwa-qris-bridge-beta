package com.segeranjiwa.qrisbridge

data class SnapshotDecision(
    val emit: List<QrisSignal>,
    val remember: Set<String>,
    val baselinedHistoricalGroup: Boolean = false
)

/**
 * Protects the Bridge from Android/GoFood grouped-notification snapshots that
 * repeat older provider IDs. Provider ID remains the evidence/dedupe key.
 *
 * Safety rule for a fresh install/rebind with no observed IDs:
 * - one payment line: emit immediately;
 * - multiple payment lines: treat as a baseline snapshot and emit none.
 * Later grouped updates emit only IDs that were not previously observed.
 */
object NotificationSnapshotPolicy {
    fun decide(
        observedProviderIds: Set<String>,
        current: List<QrisSignal>,
        firstObservation: Boolean
    ): SnapshotDecision {
        val distinct = current.distinctBy { it.providerTransactionId }
        val currentIds = distinct.map { it.providerTransactionId }.toSet()
        if (distinct.isEmpty()) return SnapshotDecision(emptyList(), observedProviderIds)

        if (firstObservation && observedProviderIds.isEmpty() && distinct.size > 1) {
            return SnapshotDecision(emptyList(), currentIds, baselinedHistoricalGroup = true)
        }

        val fresh = distinct.filter { it.providerTransactionId !in observedProviderIds }
        return SnapshotDecision(fresh, observedProviderIds + currentIds)
    }
}

object BridgeRealtimePolicy {
    /** Target from NotificationListener callback to Firebase write under normal connectivity. */
    const val TARGET_PIPELINE_MS = 5_000L
    /** Only recent active notifications are eligible for reconnect recovery. */
    const val RECOVERY_WINDOW_MS = 60_000L
    const val RETRY_FAST_MS = 2_000L
    const val RETRY_SECOND_MS = 5_000L
}
