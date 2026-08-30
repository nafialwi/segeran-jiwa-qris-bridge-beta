# SC-01 QRIS Contract Map

> HIGH RISK — existing `SJQrisSignalBeta` is the migration authority; SC-01 does not rewrite it.

- QRIS root occurrences: **2**
- SJQrisSignalBeta occurrences: **11**
- pending tokens: **241**
- MATCHED tokens: **93**
- ambiguous tokens: **48**
- ensureWaitingPending occurrences: **7**
- cancelWaiting occurrences: **9**

## Must remain true through migration

- pending creation/recovery remains one engine;
- matching and active pending identity remain authoritative;
- ambiguity cannot become false success;
- manual fallback/cancel safety remains;
- QR is not usable before real pending readiness;
- no duplicate transaction finalization;
- QRIS root remains separate from POS root.

## Key symbols

- `qris`
- `qrisSales`
- `qrisConfigurationGuard`
- `QRIS_EVENT_SUFFIX`
- `qrisEventId`
- `qrisEventActionable`
- `QRIS_UNMATCHED`
- `QRIS_AMBIGUOUS`
- `QRIS_MATCHED`
- `qrisPermanentDeleteEligibility`
- `SJQrisSignalBeta`
- `QRIS_DB_PATH`
- `qrisPricingFingerprint`
- `qrisRef`
- `qrisEventTypeSuffix`
- `qrisEventFor`
- `QRIS_RECEIVED`
- `QRIS_EVENT_CREATE`
- `QRIS_INBOX_STATE`
- `qrisEventActionableRuntime`
- `qrisEventRows`
- `qrisEventHistoryRows`
- `qrisEventActionRows`
- `QRIS_CONFIRMED`
- `QRIS_PENDING_EXPIRE`
- `QRIS_PENDING_CREATE`
- `QRIS_COMMERCIAL_WAIT`
- `QRIS_CANCEL`
- `QRIS_AMBIGUITY_RESOLVE`
- `QRIS_MATCH`
- `QRIS_MATCH_STATE`
- `QRIS_FINALIZE`
- `QRIS_RECOVERY`
- `qrisOperationalRows`
- `qrisHistoryRows`
- `qrisTypeLabel`
- `QRIS_DISMISSED`
- `qrisTypeClass`
- `qrisEventCard`
- `qrisEvent`
- `QRIS_INBOX_BULK`
- `QRIS_DISMISS`
- `qrisEventOpen`
- `QRIS_NOTIF_PATCH`
- `qrisProvider`
- `QRIS_GRANULAR_DELETE`
- `QRIS_SIGNAL_LISTENER`
- `QRIS_PENDING_LISTENER`
- `QRIS_EVENT_LISTENER`
- `QRIS_INBOX_LISTENER`
- `QRIS_MANUAL_LINK`
- `QRIS_CONTRACT`
- `qrisExpiry`
- `QRIS_UNMATCHED_TOAST_RE`
- `qrisGateBusy`
- `qrisPendingRow`
- `qrisPage`
- `qrisOpen`
- `qrisPendingExpiry`
- `QRIS_PENDING_CREATE_UI_GATE`