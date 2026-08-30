# SC-04 Source Workflow

## Target authority chain

```text
modular source
  -> npm run verify:sc04
  -> dist-sc04 candidate
  -> Git commit
  -> GitHub repository (source authority)
  -> Cloudflare static preview (UAT only)
  -> AppMint only at release gate
```

## Zero-cost constraints

- GitHub is source/version authority; AppMint is not.
- Cloudflare is static preview only in this phase. No Worker/API is required.
- Do not enable Firebase billing, Blaze, new paid backend services, or change Firebase Rules/schema for SC-04.
- `dist/index.html` remains the exact v1.0.40 rollback artifact. `dist-sc04/` is the modular candidate.

## GitHub binding

The project can be initialized and committed locally without credentials. To bind the source checkpoint to GitHub, only an empty/existing repository URL is required. Credentials/passwords must not be placed in this package.

Suggested remote operation once a repository URL is available:

```bash
git remote add origin <REPOSITORY_URL>
git push -u origin main
```

If the remote already exists, inspect it before pushing and never force-push without explicit approval.

## Cloudflare preview binding

After GitHub is authoritative, connect the repository to a zero-cost static Pages-style preview if the available Cloudflare account/project supports it. Build command can be `npm run build:sc04`; output directory is `dist-sc04`. No Firebase backend migration is part of preview setup.
