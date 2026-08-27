package com.segeranjiwa.qrisbridge

import android.content.Context
import org.json.JSONObject
import java.io.BufferedReader
import java.io.InputStreamReader
import java.net.HttpURLConnection
import java.net.URL
import java.net.URLEncoder

class FirebaseRestClient(context: Context) {
    private val prefs = BridgePrefs(context)

    data class HttpResult(val code: Int, val body: String, val etag: String? = null)

    fun signInOwner(username: String, pin: String): BridgeSession {
        val normalized = SegeranAuth.normalizeUsername(username)
        val (email, password, hash) = SegeranAuth.credentials(normalized, pin)
        val payload = JSONObject()
            .put("email", email)
            .put("password", password)
            .put("returnSecureToken", true)
        val r = request(
            method = "POST",
            url = "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FirebaseConfig.API_KEY}",
            body = payload.toString(),
            contentType = "application/json"
        )
        if (r.code !in 200..299) error("Firebase Auth gagal (${r.code})")
        val o = JSONObject(r.body)
        var s = BridgeSession(
            idToken = o.getString("idToken"),
            refreshToken = o.getString("refreshToken"),
            uid = o.getString("localId"),
            username = normalized,
            expiresAtEpochSec = System.currentTimeMillis() / 1000L + o.optString("expiresIn", "3600").toLong()
        )

        val map = getJson(FirebasePaths.authUser(s.uid), s.idToken)
        if (!map.optBoolean("active", false) || map.optString("role") != "manajemen" || map.optString("username") != normalized) {
            error("Akun bukan Owner aktif Segeran Jiwa")
        }
        val user = getJson(FirebasePaths.user(normalized), s.idToken)
        if (user.optString("role") != "manajemen") error("Role profil POS bukan Owner")
        val authUid = user.optString("authUid")
        if (authUid.isNotBlank() && authUid != s.uid) error("UID Firebase tidak cocok dengan profil POS")
        val pinHash = user.optString("pinHash")
        if (pinHash.isNotBlank() && pinHash != hash) error("PIN hash tidak cocok dengan profil POS")

        prefs.saveSession(s)
        return s
    }

    fun requireFreshSession(): BridgeSession {
        var s = prefs.session() ?: error("Owner belum login di QRIS Bridge")
        val now = System.currentTimeMillis() / 1000L
        if (s.expiresAtEpochSec - now > 300L) return s
        val body = "grant_type=refresh_token&refresh_token=" + URLEncoder.encode(s.refreshToken, "UTF-8")
        val r = request(
            method = "POST",
            url = "https://securetoken.googleapis.com/v1/token?key=${FirebaseConfig.API_KEY}",
            body = body,
            contentType = "application/x-www-form-urlencoded"
        )
        if (r.code !in 200..299) error("Sesi Owner perlu login ulang")
        val o = JSONObject(r.body)
        s = s.copy(
            idToken = o.getString("id_token"),
            refreshToken = o.optString("refresh_token", s.refreshToken),
            uid = o.optString("user_id", s.uid),
            expiresAtEpochSec = now + o.optString("expires_in", "3600").toLong()
        )
        prefs.saveSession(s)
        return s
    }

    fun getWithEtag(path: String, token: String): HttpResult =
        request("GET", dbUrl(path, token), headers = mapOf("X-Firebase-ETag" to "true"))

    fun putIfMatch(path: String, token: String, etag: String, body: JSONObject): HttpResult =
        request("PUT", dbUrl(path, token), body.toString(), "application/json", mapOf("if-match" to etag))

    fun patch(path: String, token: String, body: JSONObject): HttpResult =
        request("PATCH", dbUrl(path, token), body.toString(), "application/json")

    private fun getJson(path: String, token: String): JSONObject {
        val r = request("GET", dbUrl(path, token))
        if (r.code !in 200..299 || r.body == "null") error("Mapping Firebase tidak dapat dibaca")
        return JSONObject(r.body)
    }

    private fun dbUrl(path: String, token: String): String =
        "${FirebaseConfig.DATABASE_URL}/$path.json?auth=" + URLEncoder.encode(token, "UTF-8")

    private fun request(
        method: String,
        url: String,
        body: String? = null,
        contentType: String? = null,
        headers: Map<String, String> = emptyMap()
    ): HttpResult {
        val c = URL(url).openConnection() as HttpURLConnection
        c.requestMethod = method
        c.connectTimeout = 9000
        c.readTimeout = 9000
        c.setRequestProperty("Accept", "application/json")
        contentType?.let { c.setRequestProperty("Content-Type", it) }
        headers.forEach { (k, v) -> c.setRequestProperty(k, v) }
        if (body != null) {
            c.doOutput = true
            c.outputStream.use { it.write(body.toByteArray(Charsets.UTF_8)) }
        }
        val code = c.responseCode
        val stream = if (code in 200..399) c.inputStream else c.errorStream
        val text = stream?.let { s -> BufferedReader(InputStreamReader(s)).use { it.readText() } } ?: ""
        val etag = c.getHeaderField("ETag")
        c.disconnect()
        return HttpResult(code, text, etag)
    }
}
