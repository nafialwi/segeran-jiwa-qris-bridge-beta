# RC01-S10C-R5 Firebase Rules Gate

This directory is a **candidate builder and verifier**, not a deployment tool.

## Hard stops

- Do not publish a historical Rules fixture.
- Do not change `/toko_segeranjiwa_v58`, Inventory V2, finance paths, package ID, or frontend runtime as part of R5.
- Do not open `segeranjiwa_qris_beta_v1/.write`; it must stay `false`.
- Do not publish if the generated diff is anything other than the exact signal `$signalId` `.write` + `.validate` pair.
- Always preserve the exact CURRENT live Rules export as rollback evidence before publish.

## Build from current live export

Save the complete current Firebase RTDB Rules JSON outside tracked source, for example:

`database.rules.LIVE_EXPORT_R5.json`

Then run:

```bash
node firebase/r5/build-r5-candidate.mjs \
  --live database.rules.LIVE_EXPORT_R5.json \
  --out-dir /tmp/r5-rules
```

Review `/tmp/r5-rules/R5_RULES_GATE_REPORT.json` and `/tmp/r5-rules/R5_RULES_DIFF.txt` before any Firebase Console action.

The builder writes no network data and never publishes Rules.
