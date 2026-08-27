package com.segeranjiwa.qrisbridge

import android.app.Notification
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import java.util.concurrent.Executors

class GoFoodNotificationListener : NotificationListenerService() {
    companion object {
        const val GOFOOD_PACKAGE = "com.gojek.resto"
    }

    private val executor = Executors.newSingleThreadExecutor()

    override fun onNotificationPosted(sbn: StatusBarNotification?) {
        if (sbn == null || sbn.packageName != GOFOOD_PACKAGE) return
        val extras = sbn.notification?.extras ?: return
        val title = extras.getCharSequence(Notification.EXTRA_TITLE)?.toString()
        if (!title.orEmpty().trim().equals(QrisParser.ACCEPTED_TITLE, ignoreCase = true)) return

        val blocks = mutableListOf<String>()
        extras.getCharSequence(Notification.EXTRA_TEXT)?.toString()?.let { blocks += it }
        extras.getCharSequence(Notification.EXTRA_BIG_TEXT)?.toString()?.let { blocks += it }
        val lines = extras.getCharSequenceArray(Notification.EXTRA_TEXT_LINES)
        lines?.forEach { it?.toString()?.let(blocks::add) }

        val parsed = QrisParser.parse(title, blocks)
        if (parsed.isEmpty()) return

        val detectedAt = System.currentTimeMillis()
        executor.execute {
            val repository = QrisSignalRepository(applicationContext)
            parsed.forEach { signal ->
                try {
                    repository.enqueueAndDrain(signal.copy(detectedAt = detectedAt))
                } catch (_: Exception) {
                    // Signal terstruktur sudah masuk queue lokal; akan dicoba ulang dari UI/notification berikutnya.
                }
            }
        }
    }

    override fun onListenerConnected() {
        super.onListenerConnected()
        executor.execute {
            try { QrisSignalRepository(applicationContext).drain() } catch (_: Exception) {}
        }
    }

    override fun onDestroy() {
        executor.shutdown()
        super.onDestroy()
    }
}
