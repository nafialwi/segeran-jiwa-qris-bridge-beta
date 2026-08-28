from pathlib import Path
root=Path(__file__).resolve().parents[1]
listener=(root/'app/src/main/java/com/segeranjiwa/qrisbridge/GoFoodNotificationListener.kt').read_text()
prefs=(root/'app/src/main/java/com/segeranjiwa/qrisbridge/BridgePrefs.kt').read_text()
main=(root/'app/src/main/java/com/segeranjiwa/qrisbridge/MainActivity.kt').read_text()
policy=(root/'app/src/main/java/com/segeranjiwa/qrisbridge/NotificationSnapshotPolicy.kt').read_text()
assert 'onListenerDisconnected' in listener and 'requestRebind' in listener
assert 'activeNotifications' in listener and 'RECOVERY_WINDOW_MS' in listener
assert 'NotificationSnapshotPolicy.decide' in listener
assert 'scheduleDrainRetry' in listener
assert 'TARGET_PIPELINE_MS = 5_000L' in policy
assert 'lastPipelineMs' in prefs and 'listenerConnected' in prefs
assert 'ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS' in main
print('WP9_BACKGROUND_CONTRACT_PASS')
