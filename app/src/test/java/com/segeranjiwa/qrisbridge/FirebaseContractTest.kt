package com.segeranjiwa.qrisbridge

private fun assertEq2(expected:Any?, actual:Any?, msg:String=""){ if(expected!=actual) error("Expected=$expected actual=$actual $msg") }
private fun assertTrue2(v:Boolean, msg:String){ if(!v) error(msg) }

fun firebaseContractMain(){
    assertEq2("https://segeranjiwa-id-default-rtdb.asia-southeast1.firebasedatabase.app", FirebaseConfig.DATABASE_URL)
    assertEq2("segeranjiwa_qris_beta_v1/signals/rVWbDXID", FirebasePaths.signal("rVWbDXID"))
    assertEq2("toko_segeranjiwa_v58/global/authUsers/uid-1", FirebasePaths.authUser("uid-1"))
    assertEq2("toko_segeranjiwa_v58/global/users/admin", FirebasePaths.user("admin"))
    assertTrue2(FirebasePaths.safeProviderId("ABC_12-x"), "safe ID")
    assertTrue2(!FirebasePaths.safeProviderId("../bad"), "reject path escape")
}
