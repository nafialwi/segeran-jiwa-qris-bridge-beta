package com.segeranjiwa.qrisbridge

import org.junit.Assert.*
import org.junit.Test

class QrisSignalRepositoryContractTest {
    @Test fun repeatedProviderIdCannotRewriteEvidence() {
        val repo = InMemorySignalRepository()
        assertEquals(WriteResult.CREATED, repo.upsert(QrisSignal("A", 6000), 1000L, "OWNER1"))
        assertEquals(WriteResult.ALREADY_EXISTS, repo.upsert(QrisSignal("A", 9999), 2000L, "OWNER1"))
        val row = repo.get("A")!!
        assertEquals(6000L, row.amount)
        assertEquals(1000L, row.firstSeenAt)
        assertEquals(2000L, row.lastSeenAt)
        assertEquals(1, repo.size())
    }
}
