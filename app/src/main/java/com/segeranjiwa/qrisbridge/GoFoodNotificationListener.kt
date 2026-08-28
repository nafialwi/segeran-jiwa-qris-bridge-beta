package com.segeranjiwa.qrisbridge

import android.app.Notification
import android.content.ComponentName
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import java.util.concurrent.ScheduledThreadPoolExecutor
import java.util.concurrent.TimeUnit

class GoFoodNotificationListener : NotificationListenerService() {
    companion object { const val GOFOOD_PACKAGE = "com.gojek.resto" }

    private val executor = ScheduledThreadPoolExecutor(1).apply { removeOnCancelPolicy = true }
    private lateinit var prefs: BridgePrefs

    override fun onCreate() {
        super.onCreate()
        prefs = BridgePrefs(applicationContext)
    }

    override fun onNotificationPosted(sbn: StatusBarNotification?) {
        if (sbn == null || sbn.packageName != GOFOOD_PACKAGE) return
        val callbackAt = System.currentTimeMillis()
        prefs.noteNotificationCallback(callbackAt)
        val parsed = parseNotification(sbn)
        if (parsed.isEmpty()) return

        val observed = prefs.observedProviderIds()
        val decision = NotificationSnapshotPolicy.decide(
            observedProviderIds = observed,
            current = parsed,
            firstObservation = observed.isEmpty()
        )
        prefs.rememberObservedProviderIds(decision.remember)
        if (decision.emit.isEmpty()) return

        executor.execute { deliver(decision.emit, callbackAt, retry = true) }
    }

    override fun onListenerConnected() {
        super.onListenerConnected()
        prefs.setListenerState(true)
        executor.execute {
            // Drain local evidence first. Then inspect only recent active notifications.
            try { QrisSignalRepository(applicationContext).drain() } catch (_: Exception) { scheduleDrainRetry() }
            recoverRecentActiveNotifications()
        }
    }

    override fun onListenerDisconnected() {
        prefs.setListenerState(false)
        try { requestRebind(ComponentName(this, GoFoodNotificationListener::class.java)) } catch (_: Exception) {}
        super.onListenerDisconnected()
    }

    override fun onNotificationRemoved(sbn: StatusBarNotification?) {
        // Provider IDs remain globally remembered; removing a notification must not make old payment IDs new again.
        super.onNotificationRemoved(sbn)
    }

    private fun recoverRecentActiveNotifications() {
        val now = System.currentTimeMillis()
        val rows = try { activeNotifications?.filter { it.packageName == GOFOOD_PACKAGE }.orEmpty() } catch (_: Exception) { emptyList() }
        for (sbn in rows) {
            val parsed = parseNotification(sbn)
            if (parsed.isEmpty()) continue
            val observed = prefs.observedProviderIds()
            val age = (now - sbn.postTime).coerceAtLeast(0L)
            if (age > BridgeRealtimePolicy.RECOVERY_WINDOW_MS) {
                // Old active notification is baseline only; never backfill historical QRIS on reconnect/install.
                prefs.rememberObservedProviderIds(observed + parsed.map { it.providerTransactionId })
                continue
            }
            val decision = NotificationSnapshotPolicy.decide(observed, parsed, firstObservation = observed.isEmpty())
            prefs.rememberObservedProviderIds(decision.remember)
            if (decision.emit.isNotEmpty()) deliver(decision.emit, now, retry = true)
        }
    }

    private fun parseNotification(sbn: StatusBarNotification): List<QrisSignal> {
        val extras = sbn.notification?.extras ?: return emptyList()
        val title = extras.getCharSequence(Notification.EXTRA_TITLE)?.toString()
        if (!title.orEmpty().trim().equals(QrisParser.ACCEPTED_TITLE, ignoreCase = true)) return emptyList()
        val blocks = mutableListOf<String>()
        extras.getCharSequence(Notification.EXTRA_TEXT)?.toString()?.let { blocks += it }
        extras.getCharSequence(Notification.EXTRA_BIG_TEXT)?.toString()?.let { blocks += it }
        extras.getCharSequenceArray(Notification.EXTRA_TEXT_LINES)?.forEach { it?.toString()?.let(blocks::add) }
        return QrisParser.parse(title, blocks)
    }

    private fun deliver(signals: List<QrisSignal>, detectedAt: Long, retry: Boolean) {
        try {
            val rows = signals.map { it.copy(detectedAt = detectedAt) }
            QrisSignalRepository(applicationContext).enqueueAndDrain(rows, detectedAt)
            prefs.setLastPipelineMs(System.currentTimeMillis() - detectedAt)
        } catch (_: Exception) {
            if (retry) scheduleDrainRetry()
        }
    }

    private fun scheduleDrainRetry() {
        executor.schedule({
            try {
                QrisSignalRepository(applicationContext).drain()
            } catch (_: Exception) {
                executor.schedule({ try { QrisSignalRepository(applicationContext).drain() } catch (_: Exception) {} }, BridgeRealtimePolicy.RETRY_SECOND_MS, TimeUnit.MILLISECONDS)
            }
        }, BridgeRealtimePolicy.RETRY_FAST_MS, TimeUnit.MILLISECONDS)
    }

    override fun onDestroy() {
        prefs.setListenerState(false)
        executor.shutdown()
        super.onDestroy()
    }
}
