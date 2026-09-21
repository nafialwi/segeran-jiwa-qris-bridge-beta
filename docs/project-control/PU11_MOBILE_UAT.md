# PU-11 Mobile UAT Harness

Status: UAT tooling only. Production, live Firebase, deployment, and main remain out of scope.

## One command

From the Legacy UAT worktree:

    npm run uat:mobile

The launcher automatically:

1. builds dist-ref01;
2. starts Firebase Database/Auth/Storage emulators on WSL loopback only;
3. restores the deterministic synthetic UAT seed unless SJ_UAT_KEEP_DATA=1;
4. keeps Java RTDB internal on 127.0.0.1:9001;
5. keeps the browser RTDB proxy on WSL 127.0.0.1:9000;
6. detects the current Windows private IPv4 address from the active default route;
7. starts a Windows-native TCP bridge bound only to that private IPv4 for ports 4174, 9000, 9099, and 9199;
8. injects the exact approved request host into the UAT Firebase emulator router;
9. rejects public/non-approved UAT browser hosts and external mutation attempts;
10. prints the phone URL and UAT credentials.

PC UAT remains available on http://127.0.0.1:4174.

Phone UAT uses the printed private-LAN URL, for example http://192.168.100.92:4174.

## Safety boundary

- Firebase project: demo-segeran-jiwa-uat
- Production writes: prohibited
- Production deploy/rules publish: prohibited
- Mobile bridge: private IPv4 only
- Java RTDB emulator port 9001: never bridged to LAN
- LAN clients accepted by the Windows bridge: RFC1918 private addresses only
- Closing the launcher or pressing Ctrl+C stops the emulator and bridge children.

## UAT identities

- Owner: owneruat / 2468
- Kasir: kasiruat / 1357
