# Prompt 5 — Shift Close + Quantity Stepper Corrective v2.5

## UAT root cause

### Historical stale shift close
UAT on 2026-08-29 showed three shifts reported ACTIVE/UNRESOLVED and selectable, but closing produced `Sesi aktif tidak ditemukan.`

The legacy shift record contains `shiftStatus/sessionControl/currentSessionId` and business totals but the matching `sessions/<currentSessionId>` record is absent. `SJShift.openCloseModal()` can render because it falls back to `{}`, while `SJShift.submitClose()` explicitly requires `d.sessions[sid]` and aborts when it is missing.

### Corrective behavior
`src/ui/legacy-shift-close-recovery.js` installs an Owner-only compatibility adapter around the existing `SJShift` close surface.

For an ACTIVE shift with a real existing `currentSessionId` but missing session record, it:
- reuses the existing session id; it never creates a second active session id;
- creates an in-memory recovery session so the existing closing calculations can execute;
- treats the existing shift totals as the session's business scope by using a zero baseline;
- delegates final persistence to the existing `SJOperationalHardening.verifiedShiftWrite('CLOSE', ...)` authority;
- enriches that same CLOSE update payload with recovery metadata (`recoveredLegacy`, recovery reason, cashier/opening context);
- does not add a Firebase mutation primitive to modular source.

Normal shifts that already have a valid session record are unchanged.

## Product quantity control refinement
The selected-product card stepper is tightened into a precise 108×40 control:
- three aligned columns: 38 / 32 / 38 px;
- subtle internal separators;
- centered quantity with tabular numerals;
- soft minus surface;
- primary-green plus surface;
- restrained tap feedback;
- existing cart/updateMenuBadges/quickAddCart/quickRemoveCart remain the only cart authority.

## Scanner
No functional scanner changes in v2.5. v2.4 UAT confirmed camera barcode matching works.

## Verification
- focused Sales/Shift UX suite: 14/14 PASS
- full `npm run verify:ref01`: 153/153 PASS, 0 FAIL
- SC-01 immutable compatibility hash remains `877dd5d80ad3cfbae9c8ded35ea37c426bf795392240adb96c38e62fc556154f`
- SC-02/SC-03/SC-04 gates PASS
- modular Firebase direct mutation gate: 0 violations
