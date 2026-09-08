#!/usr/bin/env bash
set -euo pipefail

WRANGLER=(npx --yes wrangler@latest)
DB_NAME="${SJ_EMG_D1_DB_NAME:-segeran-jiwa-emergency-db}"
WORKER_NAME="${SJ_EMG_D1_WORKER_NAME:-segeran-jiwa-emergency}"
OUTSIDE_DIR="${SJ_EMG_SECRET_DIR:-/workspaces/.sj-emg-d1-private}"
mkdir -p "$OUTSIDE_DIR"
chmod 700 "$OUTSIDE_DIR"
SECRET_JSON="$OUTSIDE_DIR/secrets.json"
OWNER_KEY_FILE="$OUTSIDE_DIR/OWNER_KEY.txt"
DEPLOY_LOG="/tmp/sj-emg-d1-deploy.log"

say(){ printf '\n[EMG-D1] %s\n' "$*"; }
fail(){ printf '\nHARD STOP: %s\n' "$*" >&2; exit 1; }

command -v node >/dev/null || fail "Node.js tidak tersedia"
command -v python3 >/dev/null || fail "python3 tidak tersedia"
command -v curl >/dev/null || fail "curl tidak tersedia"
command -v openssl >/dev/null || fail "openssl tidak tersedia"

say "Memeriksa login Cloudflare Wrangler"
if ! "${WRANGLER[@]}" whoami >/tmp/sj-emg-whoami.txt 2>&1; then
  echo "Cloudflare login diperlukan. Selesaikan login browser, lalu kembali ke terminal ini."
  "${WRANGLER[@]}" login || fail "Wrangler login gagal"
fi
"${WRANGLER[@]}" whoami || fail "Cloudflare authentication belum aktif"

say "Mencari / membuat D1 $DB_NAME"
LIST_JSON="$("${WRANGLER[@]}" d1 list --json)"
DB_ID="$(LIST_JSON="$LIST_JSON" python3 -c 'import json,os,sys; name=sys.argv[1]; rows=json.loads(os.environ.get("LIST_JSON","[]")); print(next((r.get("uuid") or r.get("id") or "" for r in rows if r.get("name")==name), ""))' "$DB_NAME")"
if [[ -z "$DB_ID" ]]; then
  CREATE_OUT="$("${WRANGLER[@]}" d1 create "$DB_NAME" --location apac 2>&1 | tee /dev/stderr)"
  DB_ID="$(printf '%s' "$CREATE_OUT" | grep -Eo '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}' | tail -1 || true)"
fi
[[ -n "$DB_ID" ]] || fail "Tidak berhasil mendapatkan D1 database UUID"

auto_config="emergency-d1/wrangler.toml"
cat > "$auto_config" <<CFG
name = "$WORKER_NAME"
main = "src/worker.js"
compatibility_date = "2026-09-07"
workers_dev = true
preview_urls = false

[secrets]
required = ["SJ_EMERGENCY_OWNER_KEY", "SJ_EMERGENCY_SIGNING_KEY"]

[[d1_databases]]
binding = "SJ_EMERGENCY_DB"
database_name = "$DB_NAME"
database_id = "$DB_ID"
CFG

say "Validasi schema D1 lokal"
"${WRANGLER[@]}" d1 execute "$DB_NAME" --local --file=emergency-d1/schema.sql --yes --config="$auto_config" >/tmp/sj-emg-d1-local-schema.txt
say "Apply schema D1 remote"
"${WRANGLER[@]}" d1 execute "$DB_NAME" --remote --file=emergency-d1/schema.sql --yes --config="$auto_config"

if [[ ! -s "$SECRET_JSON" ]]; then
  OWNER_KEY="SJ-EMG-$(openssl rand -hex 6 | tr '[:lower:]' '[:upper:]')"
  SIGNING_KEY="$(openssl rand -hex 32)"
  python3 - "$SECRET_JSON" "$OWNER_KEY" "$SIGNING_KEY" <<'PY'
import json,sys
p,owner,sign=sys.argv[1:]
with open(p,'w') as f: json.dump({'SJ_EMERGENCY_OWNER_KEY':owner,'SJ_EMERGENCY_SIGNING_KEY':sign},f)
PY
  chmod 600 "$SECRET_JSON"
else
  OWNER_KEY="$(python3 - "$SECRET_JSON" <<'PY'
import json,sys
print(json.load(open(sys.argv[1]))['SJ_EMERGENCY_OWNER_KEY'])
PY
)"
fi
printf '%s\n' "$OWNER_KEY" > "$OWNER_KEY_FILE"
chmod 600 "$OWNER_KEY_FILE"

say "Deploy Worker + D1 binding + secrets"
rm -f "$DEPLOY_LOG"
"${WRANGLER[@]}" deploy --config="$auto_config" --secrets-file="$SECRET_JSON" 2>&1 | tee "$DEPLOY_LOG"
WORKER_URL="$(grep -Eo 'https://[A-Za-z0-9.-]+\.workers\.dev' "$DEPLOY_LOG" | tail -1 || true)"
if [[ -z "$WORKER_URL" && -n "${SJ_EMERGENCY_API_BASE:-}" ]]; then WORKER_URL="${SJ_EMERGENCY_API_BASE%/}"; fi
[[ -n "$WORKER_URL" ]] || fail "Worker sudah dicoba deploy tetapi URL workers.dev tidak terbaca. Set SJ_EMERGENCY_API_BASE=https://...workers.dev lalu rerun script."

say "Menulis config client non-secret: $WORKER_URL"
sed "s|__SJ_EMERGENCY_API_BASE__|$WORKER_URL|g" src/compat/emg-d1-p1-config.js.in > src/compat/emg-d1-p1-config.js
rm -f src/compat/emg-d1-p1-config.js.in

say "Remote smoke: health -> auth -> authenticated D1 drill"
ORIGIN='https://segeran-jiwa-pos-preview.pages.dev'
HEALTH="$(curl -fsS -H "Origin: $ORIGIN" "$WORKER_URL/v1/health")" || fail "Worker health smoke gagal"
printf '%s' "$HEALTH" | grep -q '"ok":true' || fail "Worker health tidak OK"
AUTH="$(curl -fsS -H "Origin: $ORIGIN" -H 'Content-Type: application/json' --data "{\"ownerKey\":\"$OWNER_KEY\",\"actorId\":\"provision\",\"actorName\":\"PROVISION\"}" "$WORKER_URL/v1/auth")" || fail "Worker auth smoke gagal"
TOKEN="$(printf '%s' "$AUTH" | python3 -c 'import json,sys; print(json.load(sys.stdin).get("token",""))')"
[[ -n "$TOKEN" ]] || fail "Worker auth tidak menghasilkan token"
DRILL="$(curl -fsS -H "Origin: $ORIGIN" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' --data '{}' "$WORKER_URL/v1/drill")" || fail "D1 authenticated drill gagal"
printf '%s' "$DRILL" | grep -q '"drill":"PASS"' || fail "D1 drill tidak PASS"

cat <<RESULT

=== EMG-D1 P1 CLOUDFLARE PROVISION PASS ===
D1 database: $DB_NAME
D1 id:       $DB_ID
Worker:      $WORKER_URL
OWNER KEY:   $OWNER_KEY
OWNER KEY backup (Codespace only): $OWNER_KEY_FILE
IMPORTANT: simpan OWNER KEY di tempat aman. Secret signing tidak ditaruh di Git.
RESULT
