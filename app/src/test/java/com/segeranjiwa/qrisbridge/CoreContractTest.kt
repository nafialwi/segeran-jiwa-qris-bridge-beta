package com.segeranjiwa.qrisbridge

private fun assertTrue(v:Boolean, msg:String){ if(!v) error(msg) }
private fun <T> assertEq(expected:T, actual:T, msg:String=""){ if(expected!=actual) error("Expected=$expected actual=$actual $msg") }

fun main(){
    val single = QrisParser.parse(
        "Pembayaran QRIS diterima!",
        listOf("Rp2.000 berhasil diterima. ID transaksi: rVWbDXID")
    )
    assertEq(listOf(QrisSignal("rVWbDXID", 2000)), single, "single")

    val aggregate = QrisParser.parse(
        "Pembayaran QRIS diterima!",
        listOf(
            "Rp6.000 berhasil diterima. ID transaksi: plk0FZID",
            "Rp1.000 berhasil diterima. ID transaksi: XQdGyuID",
            "Rp2.000 berhasil diterima. ID transaksi: rVWbDXID"
        )
    )
    assertEq(3, aggregate.size, "aggregate count")
    assertEq(setOf("plk0FZID","XQdGyuID","rVWbDXID"), aggregate.map{it.providerTransactionId}.toSet(), "aggregate ids")

    val duplicateSnapshot = QrisParser.parse(
        "Pembayaran QRIS diterima!",
        listOf(
            "Rp2.000 berhasil diterima. ID transaksi: rVWbDXID",
            "Rp2.000 berhasil diterima. ID transaksi: rVWbDXID"
        )
    )
    assertEq(1, duplicateSnapshot.size, "dedupe inside snapshot")

    val safeVariant = QrisParser.parse(
        "  pembayaran qris diterima!  ",
        listOf("Rp 6.000 berhasil diterima ID Transaksi: Case_1-x")
    )
    assertEq(listOf(QrisSignal("Case_1-x", 6000)), safeVariant, "safe observed formatting variant")

    assertEq("segeranjiwa_qris_beta_v1/signals/rVWbDXID", FirebasePaths.signal("rVWbDXID"), "signal isolated root")
    assertEq("toko_segeranjiwa_v58/global/authUsers/uid-1", FirebasePaths.authUser("uid-1"), "auth remains POS root")
    assertEq("toko_segeranjiwa_v58/global/users/fixture_owner", FirebasePaths.user("fixture_owner"), "profile remains POS root")

    assertTrue(QrisParser.parse("Pesanan baru", listOf("Rp2.000 berhasil diterima. ID transaksi: X")).isEmpty(), "unrelated title")
    assertTrue(QrisParser.parse("Pembayaran QRIS diterima!", listOf("RpABC berhasil diterima. ID transaksi: X")).isEmpty(), "malformed")

    assertEq("fixture_owner@auth.segeranjiwa.id", SegeranAuth.emailFor(" Fixture Owner "))
    assertEq("fe51a4d4fe662159e418815640f7e26164728aacbdccda921b84716fee4cac71", SegeranAuth.hashPin("fixture_owner","1234"))
    assertEq("SJ!59-fe51a4d4fe662159e418815640f7e2616472a9", SegeranAuth.passwordForHash("fe51a4d4fe662159e418815640f7e26164728aacbdccda921b84716fee4cac71"))

    val repo = InMemorySignalRepository()
    assertEq(WriteResult.CREATED, repo.upsert(QrisSignal("A",6000), 1000L, "OWNER1"))
    assertEq(WriteResult.ALREADY_EXISTS, repo.upsert(QrisSignal("A",9999), 2000L, "OWNER1"))
    val a = repo.get("A")!!
    assertEq(6000L, a.amount, "provider evidence immutable")
    assertEq(1000L, a.firstSeenAt)
    assertEq(2000L, a.lastSeenAt)
    assertEq(1, repo.size())
    val timed = QrisSignal("TIME1", 2000, detectedAt = 123456789L)
    assertEq(123456789L, timed.detectedAt, "notification detection time retained")

    val firstSingle = NotificationSnapshotPolicy.decide(emptySet(), listOf(QrisSignal("LIVE1",1000)), true)
    assertEq(listOf("LIVE1"), firstSingle.emit.map { it.providerTransactionId }, "single live notification emits immediately")
    val firstGroup = NotificationSnapshotPolicy.decide(emptySet(), listOf(QrisSignal("OLD1",1000),QrisSignal("OLD2",2000)), true)
    assertTrue(firstGroup.emit.isEmpty(), "first aggregate is baseline, not historical backfill")
    val update = NotificationSnapshotPolicy.decide(setOf("OLD1","OLD2"), listOf(QrisSignal("NEW3",3000),QrisSignal("OLD1",1000),QrisSignal("OLD2",2000)), false)
    assertEq(listOf("NEW3"), update.emit.map { it.providerTransactionId }, "grouped update emits only new provider id")
    assertEq(5000L, BridgeRealtimePolicy.TARGET_PIPELINE_MS, "realtime target")

    println("CORE_CONTRACT_PASS")
}
