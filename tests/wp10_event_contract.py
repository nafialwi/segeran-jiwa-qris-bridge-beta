from pathlib import Path
root=Path(__file__).resolve().parents[1]
paths=(root/'app/src/main/java/com/segeranjiwa/qrisbridge/FirebaseConfig.kt').read_text()
repo=(root/'app/src/main/java/com/segeranjiwa/qrisbridge/QrisSignalRepository.kt').read_text()
client=(root/'app/src/main/java/com/segeranjiwa/qrisbridge/FirebaseRestClient.kt').read_text()
assert 'fun event(' in paths
assert 'RECEIVED' in paths and '/events/${id}__${s}' in paths
assert 'ensureReceivedEvent' in repo
assert 'QRIS_RECEIVED' in repo
assert 'putIfAbsent' in client
print('WP10_BRIDGE_EVENT_CONTRACT_PASS')
