#!/usr/bin/env bash
set -e

# Install dependencies
npm install -g @anthropic-ai/claude-code
npm install

# Bootstrap .env if not already present — builds fail without PUBLIC_POSTHOG_* vars.
# Real analytics credentials can be filled in later; the dummy values in .env.example
# are sufficient for local dev and CI builds.
if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env from .env.example"
fi

# Generate SvelteKit type declarations ($app types, path aliases, etc.)
npx svelte-kit sync

# Pre-create ~/.claude.json so Claude Code skips the onboarding wizard on first launch.
# Auth is handled separately via the CLAUDE_CODE_OAUTH_TOKEN Codespaces secret.
# Without this file, Claude treats every container rebuild as a first run and
# shows the full onboarding wizard (including the auth step) even when the token is present.
if [ ! -f "$HOME/.claude.json" ]; then
  cat > "$HOME/.claude.json" <<EOF
{
  "firstStartTime": "$(date -u +%Y-%m-%dT%H:%M:%S.000Z)",
  "hasCompletedOnboarding": true,
  "migrationVersion": 11,
  "opusProMigrationComplete": true,
  "sonnet1m45MigrationComplete": true
}
EOF
  echo "Created ~/.claude.json (onboarding bypass)"
fi
