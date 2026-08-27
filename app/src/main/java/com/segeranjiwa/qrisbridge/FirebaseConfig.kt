package com.segeranjiwa.qrisbridge

object FirebaseConfig {
    const val API_KEY = "AIzaSyDrGstIKhs3BsgEyaTCx_K431GqgHFv9uM"
    const val DATABASE_URL = "https://segeranjiwa-id-default-rtdb.asia-southeast1.firebasedatabase.app"
    const val POS_ROOT = "toko_segeranjiwa_v58"
    const val QRIS_ROOT = "segeranjiwa_qris_beta_v1"
}

object FirebasePaths {
    private val providerId = Regex("^[A-Za-z0-9_-]{1,120}$")
    private val simpleKey = Regex("^[A-Za-z0-9_.-]{1,160}$")

    fun safeProviderId(id: String): Boolean = providerId.matches(id)
    fun signal(id: String): String {
        require(safeProviderId(id)) { "Provider transaction ID tidak aman" }
        return "${FirebaseConfig.QRIS_ROOT}/signals/$id"
    }
    fun authUser(uid: String): String {
        require(simpleKey.matches(uid)) { "UID tidak aman" }
        return "${FirebaseConfig.POS_ROOT}/global/authUsers/$uid"
    }
    fun user(username: String): String {
        val u = SegeranAuth.normalizeUsername(username)
        require(simpleKey.matches(u)) { "Username tidak aman" }
        return "${FirebaseConfig.POS_ROOT}/global/users/$u"
    }
}
