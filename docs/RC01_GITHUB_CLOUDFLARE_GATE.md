# RC01-S07 — GitHub + Cloudflare Preview Gate

## Known GitHub authority

Existing repository confirmed by the user:

`https://github.com/nafialwi/segeran-jiwa-qris-bridge-beta`

User evidence shows:

- default branch: `main`;
- Bridge history branch: `qris-bridge-v0.3.0-archive`;
- `main` currently contains POS-style source/build folders.

The historical repository name must not trigger creation of a new repository.

## Known Cloudflare coordinate

Continuity context records:

- project: `segeran-jiwa-pos-preview`
- stable Pages coordinate: `https://segeran-jiwa-pos-preview.pages.dev`

The active Cloudflare production-branch binding and any custom production-domain mapping are **not verified by this local execution environment**.

## Safe release rule

Until branch binding is observed directly, **do not push RC-01 to `main`**. A `main` push could be production-connected.

Preferred preview branch name:

`rc01-v3.4-release-candidate`

This is a branch recommendation for the preview gate, not a remote action already performed.

## External gate procedure

Before any remote mutation:

1. inspect GitHub repository settings/history and confirm current `main` production state;
2. inspect Cloudflare Pages → project `segeran-jiwa-pos-preview` → Settings/Builds & deployments;
3. record the configured production branch;
4. verify whether non-production branches create Preview Deployments;
5. verify current production deployment/URL before touching source;
6. only then publish the RC via a non-production branch if preview isolation is confirmed;
7. return the exact Preview Deployment URL for real-device UAT.

## STOP conditions

Stop without push/deploy if:

- production branch cannot be confirmed;
- preview vs production behavior is ambiguous;
- repository shown is not the expected existing POS main structure;
- Cloudflare project differs from `segeran-jiwa-pos-preview` without an explicit migration decision;
- credentials/authenticated access are unavailable;
- any step would overwrite production v2.9.

## Current gate status

**EXTERNAL GATE — NOT EXECUTED REMOTELY.**

Reason: this execution container cannot reach/authenticate GitHub/Cloudflare and therefore cannot prove branch binding or safely mutate remote state.
