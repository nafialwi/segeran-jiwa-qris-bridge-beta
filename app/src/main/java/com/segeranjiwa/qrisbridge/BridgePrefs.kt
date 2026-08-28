package com.segeranjiwa.qrisbridge

import android.content.Context
import android.provider.Settings
import org.json.JSONArray
import org.json.JSONObject

data class PendingSignal(val id: String, val amount: Long, val detectedAt: Long)

class BridgePrefs(context: Context) {
    private val prefs = context.getSharedPreferences("sj_qris_bridge_beta", Context.MODE_PRIVATE)
    val deviceId: String = Settings.Secure.getString(context.contentResolver, Settings.Secure.ANDROID_ID)
        ?.takeIf { it.isNotBlank() } ?: "unknown-device"

    fun saveSession(s: BridgeSession) {
        prefs.edit()
            .putString("idToken", s.idToken)
            .putString("refreshToken", s.refreshToken)
            .putString("uid", s.uid)
            .putString("username", s.username)
            .putLong("expiresAt", s.expiresAtEpochSec)
            .apply()
    }

    fun session(): BridgeSession? {
        val id = prefs.getString("idToken", null) ?: return null
        val refresh = prefs.getString("refreshToken", null) ?: return null
        val uid = prefs.getString("uid", null) ?: return null
        val username = prefs.getString("username", null) ?: return null
        return BridgeSession(id, refresh, uid, username, prefs.getLong("expiresAt", 0L))
    }

    fun clearSession() {
        prefs.edit().remove("idToken").remove("refreshToken").remove("uid").remove("username").remove("expiresAt").apply()
    }

    fun enqueue(signal: QrisSignal, detectedAt: Long) {
        val rows = queue().toMutableList()
        if (rows.none { it.id == signal.providerTransactionId }) {
            rows += PendingSignal(signal.providerTransactionId, signal.amount, detectedAt)
            saveQueue(rows)
        }
    }

    fun queue(): List<PendingSignal> {
        val raw = prefs.getString("queue", "[]") ?: "[]"
        return try {
            val a = JSONArray(raw)
            buildList {
                for (i in 0 until a.length()) {
                    val o = a.optJSONObject(i) ?: continue
                    val id = o.optString("id")
                    val amount = o.optLong("amount", 0L)
                    val detectedAt = o.optLong("detectedAt", 0L)
                    if (FirebasePaths.safeProviderId(id) && amount > 0) add(PendingSignal(id, amount, detectedAt))
                }
            }
        } catch (_: Exception) { emptyList() }
    }

    fun removeQueued(id: String) = saveQueue(queue().filterNot { it.id == id })

    private fun saveQueue(rows: List<PendingSignal>) {
        val a = JSONArray()
        rows.forEach { r -> a.put(JSONObject().put("id", r.id).put("amount", r.amount).put("detectedAt", r.detectedAt)) }
        prefs.edit().putString("queue", a.toString()).apply()
    }

    fun setLastSignal(id: String, amount: Long, state: String) {
        prefs.edit().putString("lastId", id).putLong("lastAmount", amount).putString("lastState", state).putLong("lastAt", System.currentTimeMillis()).apply()
    }

    fun lastSignalLabel(): String {
        val id = prefs.getString("lastId", null) ?: return "-"
        val amount = prefs.getLong("lastAmount", 0L)
        val state = prefs.getString("lastState", "-")
        return "Rp${amount} • $id • $state"
    }
    fun observedProviderIds(): Set<String> {
        val raw = prefs.getString("observedProviderIds", "[]") ?: "[]"
        return try {
            val a = JSONArray(raw)
            buildSet { for (i in 0 until a.length()) { val id = a.optString(i); if (FirebasePaths.safeProviderId(id)) add(id) } }
        } catch (_: Exception) { emptySet() }
    }

    fun rememberObservedProviderIds(ids: Set<String>) {
        val existing = observedProviderIds().toMutableList()
        ids.forEach { if (it !in existing) existing += it }
        val keep = existing.takeLast(500)
        val a = JSONArray(); keep.forEach(a::put)
        prefs.edit().putString("observedProviderIds", a.toString()).apply()
    }

    fun setListenerState(connected: Boolean, at: Long = System.currentTimeMillis()) {
        prefs.edit().putBoolean("listenerConnected", connected).putLong(if (connected) "listenerConnectedAt" else "listenerDisconnectedAt", at).apply()
    }

    fun listenerConnected(): Boolean = prefs.getBoolean("listenerConnected", false)
    fun listenerConnectedAt(): Long = prefs.getLong("listenerConnectedAt", 0L)

    fun noteNotificationCallback(at: Long = System.currentTimeMillis()) {
        prefs.edit().putLong("lastNotificationCallbackAt", at).apply()
    }

    fun lastNotificationCallbackAt(): Long = prefs.getLong("lastNotificationCallbackAt", 0L)

    fun setLastPipelineMs(ms: Long) {
        prefs.edit().putLong("lastPipelineMs", ms.coerceAtLeast(0L)).putLong("lastPipelineAt", System.currentTimeMillis()).apply()
    }

    fun lastPipelineMs(): Long = prefs.getLong("lastPipelineMs", -1L)

}
