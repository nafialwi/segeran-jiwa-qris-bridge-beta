package com.segeranjiwa.qrisbridge

import android.content.Context
import org.json.JSONObject

class QrisSignalRepository(context: Context) {
    private val prefs = BridgePrefs(context)
    private val firebase = FirebaseRestClient(context)

    fun enqueueAndDrain(signal: QrisSignal): WriteResult? =
        enqueueAndDrain(listOf(signal), signal.detectedAt.takeIf { it > 0L } ?: System.currentTimeMillis()).lastOrNull()?.second

    fun enqueueAndDrain(signals: List<QrisSignal>, detectedAt: Long = System.currentTimeMillis()): List<Pair<String, WriteResult>> {
        signals.distinctBy { it.providerTransactionId }.forEach { signal ->
            prefs.enqueue(signal, signal.detectedAt.takeIf { it > 0L } ?: detectedAt)
        }
        return drain()
    }

    fun drain(): List<Pair<String, WriteResult>> {
        val session = firebase.requireFreshSession()
        val done = mutableListOf<Pair<String, WriteResult>>()
        for (row in prefs.queue()) {
            val signal = QrisSignal(row.id, row.amount)
            val result = upsert(signal, row.detectedAt, prefs.deviceId, session.idToken)
            if (result == WriteResult.CREATED) ensureReceivedEvent(signal, row.detectedAt, session.uid, session.username, session.idToken)
            prefs.removeQueued(row.id)
            prefs.setLastSignal(row.id, row.amount, result.name)
            done += row.id to result
        }
        return done
    }

    private fun ensureReceivedEvent(signal: QrisSignal, detectedAt: Long, actorUid: String, actorName: String, token: String) {
        val eventId = "${signal.providerTransactionId}__RECEIVED"
        val body = JSONObject()
            .put("eventId", eventId)
            .put("providerTransactionId", signal.providerTransactionId)
            .put("type", "QRIS_RECEIVED")
            .put("amount", signal.amount)
            .put("ts", detectedAt)
            .put("signalStatus", "DETECTED")
            .put("pendingId", JSONObject.NULL)
            .put("transactionId", JSONObject.NULL)
            .put("cashierId", JSONObject.NULL)
            .put("cashierName", JSONObject.NULL)
            .put("actorUid", actorUid)
            .put("actorName", actorName)
            .put("reason", JSONObject.NULL)
        val r = firebase.putIfAbsent(FirebasePaths.event(signal.providerTransactionId, "RECEIVED"), token, body)
        if (r.code !in 200..299 && r.code != 412) error("Gagal menulis event QRIS (${r.code})")
    }

    private fun upsert(signal: QrisSignal, detectedAt: Long, sourceDeviceId: String, token: String): WriteResult {
        val path = FirebasePaths.signal(signal.providerTransactionId)
        val current = firebase.getWithEtag(path, token)
        if (current.code !in 200..299) error("Gagal membaca signal (${current.code})")
        if (current.body.trim() != "null") {
            val patch = JSONObject().put("lastSeenAt", JSONObject().put(".sv", "timestamp"))
            val p = firebase.patch(path, token, patch)
            if (p.code !in 200..299) error("Gagal memperbarui signal (${p.code})")
            return WriteResult.ALREADY_EXISTS
        }
        val etag = current.etag ?: error("Firebase ETag tidak tersedia")
        val body = JSONObject()
            .put("provider", signal.provider)
            .put("amount", signal.amount)
            .put("firstSeenAt", detectedAt)
            .put("lastSeenAt", JSONObject().put(".sv", "timestamp"))
            .put("sourceDeviceId", sourceDeviceId)
            .put("status", "DETECTED")
            .put("matchedTransactionId", JSONObject.NULL)
            .put("matchedAt", JSONObject.NULL)
            .put("confirmedAt", JSONObject.NULL)
            .put("confirmedBy", JSONObject.NULL)
        val put = firebase.putIfMatch(path, token, etag, body)
        if (put.code in 200..299) return WriteResult.CREATED
        if (put.code == 412) return WriteResult.ALREADY_EXISTS
        error("Gagal menulis QRIS signal (${put.code})")
    }
}
