# SC-01 Checkpoint Status

## Scope completed

- v1.0.40 copied and hash-frozen as immutable migration authority.
- Monolith inventory generated for functions, scripts/styles, routes, Firebase path families, auth/session signals and QRIS contracts.
- Full target modular source tree scaffold created; it is intentionally **not wired to runtime** yet.
- Zero-dependency build copies the immutable baseline to `dist/index.html`.
- Zero-dependency local preview server created.
- Static contract verifier created.
- Inline JavaScript parse verifier created.
- Extraction map, legacy debt register and high-risk flow map documented.

## Explicitly not done in SC-01

- No business function extracted yet.
- No Firebase write moved yet.
- No UI/refinement change.
- No persistent login change.
- No GitHub/Cloudflare integration.
- No AppMint build/install.

## SC-01 exit criterion

SC-01 can close when a fresh `npm run verify` shows a byte-identical compatibility build, all tests green, all inline scripts parse, fixed contracts are present, and audit artifacts regenerate successfully.

## Next work package

SC-02 may begin only after SC-01 closes. SC-02 is Core/Data/Domain extraction with behavior equivalence—not visual refinement.
