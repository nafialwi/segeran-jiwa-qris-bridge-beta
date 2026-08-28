from pathlib import Path
import sys
p = Path(__file__).resolve().parents[1] / '.github/workflows/build-apk.yml'
s = p.read_text()
checks = {
    'no_job_level_runner_temp': '${{ runner.temp }}' not in s,
    'uses_runner_temp_shell': '$RUNNER_TEMP/segeran-jiwa-qris-bridge.jks' in s,
    'exports_keystore_path': 'GITHUB_ENV' in s and 'BRIDGE_KEYSTORE_PATH' in s,
    'release_build': 'gradle :app:assembleRelease' in s,
    'unsigned_release_input': 'app/build/outputs/apk/release/app-release-unsigned.apk' in s,
    'zipalign_before_sign': '"$ZIPALIGN" -f -v 4 "$UNSIGNED_APK" "$ALIGNED_APK"' in s,
    'explicit_apksigner_sign': '"$APKSIGNER" sign' in s,
    'signature_verify': '"$APKSIGNER" verify --verbose --print-certs "$FINAL_APK"' in s,
    'pinned_identity': '2F9C280769BF6054278FE683D9B793965C47C9C4360E951B0DC702AE1E662695' in s,
    'artifact_release_name': 'Segeran-Jiwa-QRIS-Bridge-v0.3.0-beta-signed' in s,
    'final_hash': 'sha256sum "$FINAL_APK" > "$FINAL_APK.sha256"' in s,
    'no_debug_assemble': ':app:assembleDebug' not in s,
    'no_gradle_signed_apk_assumption': 'app/build/outputs/apk/release/app-release.apk' not in s,
}
failed=[k for k,v in checks.items() if not v]
if failed:
    print('WORKFLOW_RELEASE_CONTRACT_FAIL')
    for k in failed: print('FAIL', k)
    sys.exit(1)
print('WORKFLOW_RELEASE_CONTRACT_PASS')
