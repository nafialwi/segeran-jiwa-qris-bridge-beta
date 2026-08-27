package com.segeranjiwa.qrisbridge

import java.security.spec.KeySpec
import javax.crypto.SecretKeyFactory
import javax.crypto.spec.PBEKeySpec

object SegeranAuth {
    private const val ITERATIONS = 120000
    private const val KEY_BITS = 256

    fun normalizeUsername(username: String): String = username.trim().lowercase()

    fun emailFor(username: String): String =
        normalizeUsername(username).replace(Regex("[^a-z0-9_.-]"), "_") + "@auth.segeranjiwa.id"

    fun hashPin(username: String, pin: String): String {
        val user = normalizeUsername(username)
        val spec: KeySpec = PBEKeySpec(
            pin.toCharArray(),
            ("segeranjiwa-v58:" + user).toByteArray(Charsets.UTF_8),
            ITERATIONS,
            KEY_BITS
        )
        val bytes = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256").generateSecret(spec).encoded
        return bytes.joinToString("") { "%02x".format(it.toInt() and 0xff) }
    }

    fun passwordForHash(hash: String): String {
        require(hash.length >= 36) { "PIN hash tidak valid" }
        return "SJ!59-" + hash.take(36) + "a9"
    }

    fun credentials(username: String, pin: String): Triple<String, String, String> {
        val hash = hashPin(username, pin)
        return Triple(emailFor(username), passwordForHash(hash), hash)
    }
}
