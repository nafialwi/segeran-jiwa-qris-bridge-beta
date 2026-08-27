package com.segeranjiwa.qrisbridge

import org.junit.Assert.*
import org.junit.Test

class FirebasePathsTest {
    @Test fun buildsOnlySafeProductionPaths() {
        assertEquals("segeranjiwa_qris_beta_v1/signals/rVWbDXID", FirebasePaths.signal("rVWbDXID"))
        assertEquals("toko_segeranjiwa_v58/global/authUsers/uid-1", FirebasePaths.authUser("uid-1"))
        assertTrue(FirebasePaths.safeProviderId("ABC_12-x"))
        assertFalse(FirebasePaths.safeProviderId("../bad"))
    }
}
