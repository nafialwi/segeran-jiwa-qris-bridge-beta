# 09 — ZERO-COST TOOLCHAIN & REPO ROADMAP

## 1. Toolchain yang disarankan sekarang

| Fungsi | Tool | Status |
|---|---|---|
| Development | PC | gunakan |
| Source code | JavaScript/CSS/HTML modular | gunakan |
| Version control | Git | gunakan |
| Remote source | GitHub | aktifkan setelah SC baseline siap |
| Mobile preview | Cloudflare static preview | aktifkan setelah GitHub |
| Backend | Firebase existing | pertahankan |
| APK wrapper | AppMint existing | gunakan hanya pada gate |
| Android Studio | belum perlu | tunda |
| Kotlin rewrite | tidak | tunda |
| Paid backend | tidak | zero-cost-first |

## 2. Workflow target

```text
PC
 ↓
source modular
 ↓
tests
 ↓
build
 ↓
dist/index.html
 ↓
GitHub
 ├──→ Cloudflare Preview → UAT HP
 └──→ AppMint package only at release gate
```

## 3. GitHub

Sebaiknya repo Segeran Jiwa terpisah dari TotalKu.

GitHub baru diperlukan ketika modular source sudah layak disimpan sebagai source authority.

Yang perlu disiapkan nanti hanya salah satu:

- URL repo kosong/baru; atau
- repo existing Segeran Jiwa jika memang sudah ada.

Tidak perlu memberikan credentials/password.

## 4. Cloudflare

Tujuan Cloudflare **hanya preview static** pada fase ini.

Keuntungan:

- UAT HP lewat URL;
- tidak perlu localhost setiap kali;
- tidak perlu install APK untuk visual/regression browser;
- deployment dapat mengikuti GitHub.

Tidak perlu Worker/API baru jika static hosting sudah cukup.

## 5. AppMint

Tetap dipakai sementara karena:

- user sudah mengenalnya;
- tidak perlu Android Studio;
- tidak perlu rewrite;
- output build tetap bisa single `index.html`.

AppMint tidak menjadi source authority. Ia hanya packaging gate.

## 6. Kapan pertimbangkan Capacitor/native?

Bukan sekarang.

Evaluasi ulang hanya jika setelah clean baseline terbukti ada bottleneck WebView nyata seperti:

- printer/native integration;
- camera/background permission;
- lifecycle;
- offline architecture yang terlalu kompleks;
- Android Back/plugin constraints.

Keputusan itu berdasarkan bukti setelah aplikasi stabil, bukan karena native terdengar lebih profesional.
