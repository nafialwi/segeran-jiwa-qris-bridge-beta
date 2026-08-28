package com.segeranjiwa.qrisbridge

import org.junit.Assert.*
import org.junit.Test

class NotificationSnapshotPolicyTest {
    private fun s(id:String, amount:Long=1000)=QrisSignal(id,amount)

    @Test fun firstSingleNotificationIsEmittedImmediately() {
        val d=NotificationSnapshotPolicy.decide(emptySet(), listOf(s("NEW1")), firstObservation=true)
        assertEquals(listOf("NEW1"), d.emit.map{it.providerTransactionId})
    }

    @Test fun firstGroupedSnapshotIsBaselinedToAvoidHistoricalFalseSignals() {
        val d=NotificationSnapshotPolicy.decide(emptySet(), listOf(s("OLD1"),s("OLD2"),s("OLD3")), firstObservation=true)
        assertTrue(d.emit.isEmpty())
        assertEquals(setOf("OLD1","OLD2","OLD3"), d.remember)
    }

    @Test fun groupedUpdateEmitsOnlyProviderIdsNotSeenBefore() {
        val d=NotificationSnapshotPolicy.decide(setOf("OLD1","OLD2"), listOf(s("NEW3"),s("OLD1"),s("OLD2")), firstObservation=false)
        assertEquals(listOf("NEW3"), d.emit.map{it.providerTransactionId})
    }

    @Test fun targetLatencyIsFiveSeconds() {
        assertEquals(5000L, BridgeRealtimePolicy.TARGET_PIPELINE_MS)
    }
}
