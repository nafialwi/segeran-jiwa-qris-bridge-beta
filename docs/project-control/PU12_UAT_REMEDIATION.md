# PU-12 — UAT Remediation

Status: COMPLETE

Code checkpoint:
- c5504a34e93274dc9477632f4fb01c67cd8f5ff2
- branch: work/r10-preuat-convergence

## Trigger

PU-11 Human UAT reproduced an Owner login timeout on the Windows browser even though the normal internet connection was healthy.

The UAT app itself was reachable at 127.0.0.1:4174, Firebase Auth emulator at 127.0.0.1:9099 was reachable, and the synthetic UAT database was healthy from inside WSL. The Windows host, however, could not connect directly to the Java Realtime Database Emulator on 127.0.0.1:9000.

This was an isolated UAT transport defect, not a production connectivity defect and not a Segeran Jiwa business-data defect.

## Root cause

On this PC/WSL environment:
- Node listeners on WSL loopback were reachable from Windows localhost;
- the Java Firebase Realtime Database Emulator loopback listener was not.

The browser-side UAT router previously pointed directly to Java RTDB port 9000, so the Windows browser timed out while reading the synthetic LEGACY login user.

## Remediation

The UAT-only topology is now:

- browser/application: 127.0.0.1:4174
- browser-facing RTDB TCP proxy: 127.0.0.1:9000 (Node, loopback only)
- internal Java RTDB emulator: 127.0.0.1:9001 (loopback only)
- Auth emulator: 127.0.0.1:9099
- Storage emulator: 127.0.0.1:9199

scripts/uat-rtdb-proxy.mjs is a raw TCP loopback bridge. This preserves HTTP, streaming and WebSocket traffic without binding any UAT service to 0.0.0.0.

Production routing, production Firebase configuration, production Rules, and production data were not changed.

## Evidence

TDD:
- targeted RED reproduced the missing bridge/9001 contract;
- targeted GREEN: 11/11 UAT environment tests passed.

Regression:
- serial regression: 794/794 passed;
- build: PASS;
- static syntax/diff checks: PASS.

Runtime:
- WSL app 4174: HTTP 200;
- WSL browser proxy 9000: HTTP 200;
- WSL internal Java RTDB 9001: HTTP 200;
- WSL Auth 9099: HTTP 200;
- Windows app 4174: HTTP 200;
- Windows RTDB proxy 9000: HTTP 200;
- Windows synthetic Owner read through proxy: HTTP 200;
- Windows Auth 9099: HTTP 200.

Isolation:
- demo Firebase project only;
- synthetic UAT seed only;
- loopback-only listeners;
- production writes: 0;
- production deploy: 0;
- production Rules publish: 0;
- main merge: 0.

## Resume

Resume PU-11 Human UAT.

Start with Owner login, then Owner -> Edit Produk. Continue the agreed UAT order: Cup / Pemakaian Stok / Item Stok, Bahan & Gudang, Cashier normal sale, retry, shortage, refund, VOID, Cup Control, responsive/mobile, modal/focus, and slow/offline/recovery.

Open another PU-12 remediation only if Human UAT finds a new defect.
