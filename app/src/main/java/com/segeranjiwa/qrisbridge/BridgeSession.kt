package com.segeranjiwa.qrisbridge

data class BridgeSession(
    val idToken: String,
    val refreshToken: String,
    val uid: String,
    val username: String,
    val expiresAtEpochSec: Long
)
