package com.segeranjiwa.qrisbridge

import org.junit.Assert.assertEquals
import org.junit.Test

class SegeranAuthTest {
    @Test fun matchesFrozenWebCredentialDerivation() {
        val hash = SegeranAuth.hashPin("fixture_owner", "1234")
        assertEquals("fe51a4d4fe662159e418815640f7e26164728aacbdccda921b84716fee4cac71", hash)
        assertEquals("fixture_owner@auth.segeranjiwa.id", SegeranAuth.emailFor("fixture_owner"))
        assertEquals("SJ!59-fe51a4d4fe662159e418815640f7e2616472a9", SegeranAuth.passwordForHash(hash))
    }
}
