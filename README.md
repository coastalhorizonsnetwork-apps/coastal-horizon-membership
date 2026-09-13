# Coastal Horizon Network — Cloudflare Worker

This repository is structured as a Cloudflare Worker with Static Assets.

## Deploy with Wrangler

npm install
npx wrangler login
npx wrangler secret put DISCORD_WEBHOOK_URL
npx wrangler deploy

When prompted for the secret, paste your regenerated Discord webhook URL.

## Cloudflare dashboard

Import this repository as a Worker, not a static-only Pages site. Then add:
Settings → Variables and Secrets → Secret

Name: DISCORD_WEBHOOK_URL

The webhook URL is intentionally not committed to GitHub.
