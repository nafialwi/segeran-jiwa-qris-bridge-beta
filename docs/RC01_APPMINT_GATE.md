# RC01-S09/S10 — AppMint Gate

## Current state

**APPMINT GATE: CLOSED**

Reason: RC-01 local automated gates are green, but the required GitHub/Cloudflare preview and consolidated real-device browser UAT have not yet produced evidence in this execution session.

## Gate can open only after

1. exact RC package/hash is fixed;
2. non-production Cloudflare preview is verified;
3. Owner + Kasir browser/mobile UAT is green for release-critical flows;
4. reconnect, Android Back, camera/barcode, QRIS, printer/share/PDF, notification/deep-link, closing/report have no unresolved release blocker;
5. F/A/V/R status is explicitly recorded.

## When OPEN

Use the **existing AppMint Segeran Jiwa POS project and signing/package identity**. RC-01 does not authorize creating a new package identity or new signing chain.

Install as an **UPDATE** candidate. If Android requires uninstall or reports signature/package conflict, STOP and preserve the existing installed production app.

## WebView UAT scope

The AppMint RC must specifically test:

- close/reopen session;
- Android Back;
- keyboard/IME;
- camera/barcode permission and lifecycle;
- QRIS behavior;
- printer;
- share/Save-as-PDF;
- notification/deep-link;
- status/system bar;
- offline/reconnect;
- background/resume lifecycle.

Successful completion is **W-PASS**.

## After AppMint UAT

- If no WebView-specific blocker exists: RC-01 can advance to Final Release Candidate / production approval checkpoint.
- If a bug exists only in WebView/AppMint: open **WIC-01** as one focused blocker batch.
- If a final release blocker remains after that: use **RC-FIX** only; no feature expansion or redesign.

## Production boundary

Even a successful AppMint RC does **not** itself authorize Cloudflare production promotion or production APK replacement. Final production cutover requires an explicit user approval checkpoint with current production commit/deployment/signing/rollback evidence recorded first.
