package com.segeranjiwa.qrisbridge

import android.app.Activity
import android.content.ComponentName
import android.content.Intent
import android.net.Uri
import android.service.notification.NotificationListenerService
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import android.widget.Button
import android.widget.EditText
import android.widget.TextView
import android.widget.Toast
import java.text.NumberFormat
import java.util.Locale
import java.util.concurrent.Executors

class MainActivity : Activity() {
    private val executor = Executors.newSingleThreadExecutor()
    private val handler = Handler(Looper.getMainLooper())
    private lateinit var prefs: BridgePrefs

    private lateinit var txtAuth: TextView
    private lateinit var txtAccess: TextView
    private lateinit var txtLast: TextView
    private lateinit var txtRealtime: TextView
    private lateinit var inUsername: EditText
    private lateinit var inPin: EditText
    private lateinit var btnLogin: Button

    private val refresh = object : Runnable {
        override fun run() {
            refreshStatus()
            handler.postDelayed(this, 1500L)
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        prefs = BridgePrefs(this)
        txtAuth = findViewById(R.id.txtAuth)
        txtAccess = findViewById(R.id.txtAccess)
        txtLast = findViewById(R.id.txtLast)
        txtRealtime = findViewById(R.id.txtRealtime)
        inUsername = findViewById(R.id.inUsername)
        inPin = findViewById(R.id.inPin)
        btnLogin = findViewById(R.id.btnLogin)

        findViewById<Button>(R.id.btnAccess).setOnClickListener {
            startActivity(Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS))
        }
        findViewById<Button>(R.id.btnBackground).setOnClickListener {
            try { startActivity(Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS)) }
            catch (_: Exception) { startActivity(Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:$packageName"))) }
        }
        btnLogin.setOnClickListener { loginOwner() }
        findViewById<Button>(R.id.btnRetry).setOnClickListener { retryQueue() }
        findViewById<Button>(R.id.btnLogout).setOnClickListener {
            prefs.clearSession()
            toast("Akun Owner diputus dari Bridge")
            refreshStatus()
        }
        refreshStatus()
    }

    override fun onResume() {
        super.onResume()
        try { NotificationListenerService.requestRebind(ComponentName(this, GoFoodNotificationListener::class.java)) } catch (_: Exception) {}
        executor.execute { try { QrisSignalRepository(applicationContext).drain() } catch (_: Exception) {} }
        handler.post(refresh)
    }

    override fun onPause() {
        handler.removeCallbacks(refresh)
        super.onPause()
    }

    override fun onDestroy() {
        executor.shutdown()
        super.onDestroy()
    }

    private fun loginOwner() {
        val username = inUsername.text.toString().trim()
        val pin = inPin.text.toString()
        if (username.isBlank() || pin.length < 4) {
            toast("Isi username Owner dan PIN")
            return
        }
        btnLogin.isEnabled = false
        btnLogin.text = "Menghubungkan..."
        executor.execute {
            try {
                val session = FirebaseRestClient(applicationContext).signInOwner(username, pin)
                runOnUiThread {
                    inPin.setText("")
                    btnLogin.isEnabled = true
                    btnLogin.text = "Hubungkan Akun Owner"
                    toast("Owner ${session.username} terhubung")
                    refreshStatus()
                }
                try { QrisSignalRepository(applicationContext).drain() } catch (_: Exception) {}
            } catch (e: Exception) {
                runOnUiThread {
                    inPin.setText("")
                    btnLogin.isEnabled = true
                    btnLogin.text = "Hubungkan Akun Owner"
                    toast(e.message ?: "Login gagal")
                    refreshStatus()
                }
            }
        }
    }

    private fun retryQueue() {
        executor.execute {
            try {
                val results = QrisSignalRepository(applicationContext).drain()
                runOnUiThread { toast(if (results.isEmpty()) "Tidak ada signal tertunda" else "${results.size} signal diproses") }
            } catch (e: Exception) {
                runOnUiThread { toast(e.message ?: "Belum bisa mengirim signal") }
            }
        }
    }

    private fun refreshStatus() {
        val session = prefs.session()
        txtAuth.text = if (session == null) "Firebase Owner: BELUM LOGIN" else "Firebase Owner: TERHUBUNG • ${session.username}"
        txtAccess.text = if (hasNotificationAccess()) "Notification Access: ON" else "Notification Access: OFF"
        txtLast.text = "Signal terakhir: ${formatLast(prefs.lastSignalLabel())}\nQueue tertunda: ${prefs.queue().size}"
        val ms = prefs.lastPipelineMs()
        val listener = if (prefs.listenerConnected()) "TERHUBUNG" else "MENUNGGU SISTEM"
        txtRealtime.text = when {
            ms < 0 -> "Listener background: $listener\nLatensi pipeline: belum terukur • target ≤5 detik"
            ms <= BridgeRealtimePolicy.TARGET_PIPELINE_MS -> "Listener background: $listener\nLatensi pipeline terakhir: ${ms} ms • target ≤5 detik ✓"
            else -> "Listener background: $listener\nLatensi pipeline terakhir: ${ms} ms • di atas target 5 detik"
        }
    }

    private fun hasNotificationAccess(): Boolean {
        val flat = Settings.Secure.getString(contentResolver, "enabled_notification_listeners") ?: return false
        val component = ComponentName(this, GoFoodNotificationListener::class.java).flattenToString()
        return flat.contains(component) || flat.contains(packageName)
    }

    private fun formatLast(raw: String): String {
        if (raw == "-") return raw
        val parts = raw.split(" • ")
        if (parts.size < 3) return raw
        val amount = parts[0].removePrefix("Rp").toLongOrNull() ?: return raw
        val f = NumberFormat.getNumberInstance(Locale("id", "ID")).format(amount)
        return "Rp$f • ${parts[1]} • ${parts[2]}"
    }

    private fun toast(text: String) = Toast.makeText(this, text, Toast.LENGTH_LONG).show()
}
