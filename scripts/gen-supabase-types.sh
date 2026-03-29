#!/usr/bin/env bash
# Regenerate types/supabase.ts from the hosted project.
# Requires one of (in .env.local or environment):
#   SUPABASE_ACCESS_TOKEN — https://supabase.com/dashboard/account/tokens
#   DATABASE_URL          — Project Settings → Database → URI (use pooler or direct; include ?sslmode=require if needed)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -f .env.local ]]; then
  set -a
  # shellcheck source=/dev/null
  source .env.local
  set +a
fi

OUT="types/supabase.ts"
PROJECT_REF="${SUPABASE_PROJECT_REF:-}"
if [[ -z "$PROJECT_REF" && -n "${NEXT_PUBLIC_SUPABASE_URL:-}" ]]; then
  PROJECT_REF="$(printf '%s' "$NEXT_PUBLIC_SUPABASE_URL" | sed -n 's|https://\([^.]*\)\.supabase\.co.*|\1|p')"
fi
PROJECT_REF="${PROJECT_REF:-rwqmvicsvkvfanblhocf}"

if [[ -n "${DATABASE_URL:-}" ]]; then
  echo "Generating types via DATABASE_URL → $OUT"
  exec npx --yes supabase gen types typescript --db-url "$DATABASE_URL" --schema public --schema storage > "$OUT"
fi

if [[ -n "${SUPABASE_ACCESS_TOKEN:-}" ]]; then
  export SUPABASE_ACCESS_TOKEN
  echo "Generating types via Supabase API (project $PROJECT_REF) → $OUT"
  exec npx --yes supabase gen types typescript --project-id "$PROJECT_REF" --schema public --schema storage > "$OUT"
fi

echo "Cannot generate types: set DATABASE_URL or SUPABASE_ACCESS_TOKEN in .env.local." >&2
echo "  • Token:  https://supabase.com/dashboard/account/tokens" >&2
echo "  • DB URI: Project → Settings → Database → Connection string" >&2
exit 1
