from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
APP = (ROOT / "app" / "build.gradle.kts").read_text(encoding="utf-8")
WF = (ROOT / ".github" / "workflows" / "build-apk.yml").read_text(encoding="utf-8")


def require(text: str, pattern: str, label: str) -> None:
    if not re.search(pattern, text, re.MULTILINE):
        raise AssertionError(f"missing contract: {label}")


def forbid(text: str, pattern: str, label: str) -> None:
    if re.search(pattern, text, re.MULTILINE):
        raise AssertionError(f"forbidden contract present: {label}")


# Android release identity stays stable.
require(APP, r'versionCode\s*=\s*4\b', 'versionCode=4')
require(APP, r'versionName\s*=\s*"0\.3\.0-beta"', 'versionName=0.3.0-beta')
require(APP, r'isDebuggable\s*=\s*false', 'release is non-debuggable')

# Gradle compiles an unsigned release; CI is the only signing boundary.
forbid(APP, r'signingConfigs\s*\{', 'Gradle signing config')
forbid(APP, r'signingConfig\s*=', 'Gradle release signing assignment')
forbid(APP, r'BRIDGE_KEYSTORE_', 'signing secrets referenced by Gradle')

# GitHub restores the stable key and explicitly signs the unsigned APK.
require(WF, r'BRIDGE_KEYSTORE_B64', 'GitHub keystore secret')
require(WF, r'BRIDGE_KEYSTORE_PASSWORD', 'GitHub keystore password secret')
require(WF, r'BRIDGE_KEY_ALIAS', 'GitHub alias secret')
require(WF, r'BRIDGE_KEY_PASSWORD', 'GitHub key password secret')
require(WF, r'base64\s+--decode', 'workflow decodes persistent keystore')
require(WF, r':app:testDebugUnitTest', 'unit tests remain before build')
require(WF, r':app:assembleRelease', 'unsigned release build')
require(WF, r'app-release-unsigned\.apk', 'unsigned release APK input')
require(WF, r'zipalign', 'explicit APK alignment')
require(WF, r'"\$APKSIGNER"\s+sign', 'explicit APK signing')
require(WF, r'--ks\s+"\$BRIDGE_KEYSTORE_PATH"', 'stable keystore used for signing')
require(WF, r'--ks-key-alias\s+"\$BRIDGE_KEY_ALIAS"', 'stable alias used for signing')
require(WF, r'--ks-pass\s+"env:BRIDGE_KEYSTORE_PASSWORD"', 'keystore password via environment')
require(WF, r'--key-pass\s+"env:BRIDGE_KEY_PASSWORD"', 'key password via environment')
require(WF, r'verify\s+--verbose\s+--print-certs', 'APK signature verification')
require(WF, r'2F9C280769BF6054278FE683D9B793965C47C9C4360E951B0DC702AE1E662695', 'pinned Bridge certificate SHA-256')
require(WF, r'Segeran-Jiwa-QRIS-Bridge-v0\.3\.0-beta\.apk', 'final signed artifact path')
require(WF, r'sha256sum', 'final APK SHA-256 manifest')
forbid(WF, r':app:assembleDebug', 'debug APK build')
forbid(WF, r'app-debug\.apk', 'debug APK artifact')

print('BRIDGE_RELEASE_IDENTITY_CONTRACT_PASS')
