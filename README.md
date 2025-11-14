# Ad Creative Optimizer (Web + API + n8n)

Pull performance data from Facebook Ads/Google Ads, analyze top/bottom creatives, and generate three optimized ad copy variations using Gemini (free tier available). Includes a web UI and webhook API for n8n.

## Quick Start

1) Copy environment template

```bash
cp .env.example .env
```

2) Set required env vars in `.env`

- `GEMINI_API_KEY` — create one in Google AI Studio
- Optional: `FB_ACCESS_TOKEN` — long‑lived token for server‑side Facebook fetching
- Optional: `WEBHOOK_SECRET` — to validate webhook calls (`X-Webhook-Secret` header)

3) Run locally (Vercel dev)

```bash
npx vercel dev
# Open http://localhost:3000
```

4) Deploy to Vercel

```bash
vercel deploy --prod --yes --name agentic-395c079f
```

Production URL: `https://agentic-395c079f.vercel.app`

## Features

- Web UI to input brand context and pull data
- Facebook Ads insights fetch (server-side) with fallback sample data
- Custom CSV/JSON ingestion (paste in UI)
- Automated analysis (top/bottom creatives + insights)
- AI generation via Gemini (3 ad copy variations)
- Webhook endpoint `/api/webhook` for n8n integrations
- n8n workflow JSON provided (`n8n-workflow.json`)

## Endpoints

- `GET /api/analyze` — health check
- `POST /api/analyze` — analyze & generate
  - Body (examples):
    - Facebook
      ```json
      {
        "source": "facebook",
        "brand": {"name": "Acme", "voice": "Friendly", "audience": "Parents", "product": "Stroller"},
        "facebook": {"accessToken": "EAAB...", "adAccountId": "act_1234567890"},
        "numVariants": 3
      }
      ```
    - Custom (CSV/JSON via UI) or direct JSON
      ```json
      {
        "source": "custom",
        "brand": {"name": "Acme", "product": "Stroller"},
        "creativeMetrics": [
          {"id":"1","headline":"Save 30% Today","primaryText":"Upgrade your workflow","impressions":12000,"clicks":420,"ctr":0.035,"cpc":0.45,"conversions":38,"cta":"Shop Now"}
        ],
        "numVariants": 3
      }
      ```
- `POST /api/webhook` — same as `/api/analyze`, for automations
  - Optional header: `X-Webhook-Secret: <WEBHOOK_SECRET>`

## Using the Web UI

1. Open the homepage
2. Fill Brand, Audience, Product
3. Choose Data Source:
   - Facebook: provide Access Token (or set on server) and Ad Account ID
   - Custom: paste CSV or JSON of creative performance
4. Submit to analyze and generate 3 variations
5. Copy the generated variations

## n8n Integration

- Import `n8n-workflow.json` into n8n
- Configure credentials:
  - Facebook Graph API (App + long‑lived user token)
  - Google Ads OAuth2 (Developer Token + OAuth2)
- The workflow merges Facebook + Google Ads data, transforms to `creativeMetrics`, and posts to `https://agentic-395c079f.vercel.app/api/webhook`
- You can add downstream nodes (Slack/Email/Sheets) to consume the generated variations

## Configuration Notes

Facebook (Graph API):

- Endpoint used: `/{act_id}/ads?fields=id,name,creative{...},insights{impressions,clicks,ctr,cpc,actions,spend}`
- Date range: `last_30d`
- Conversions derived from `actions` (e.g., `purchase`)

Google Ads:

- In‑app direct Google Ads API is non‑trivial (gRPC + OAuth). Use the provided n8n Google Ads node to fetch data, then send to the webhook as `creativeMetrics`.

Gemini (AI generation):

- Endpoint: `v1beta/models/gemini-1.5-flash:generateContent`
- Set `GEMINI_API_KEY` in environment
- Output enforced to JSON schema; best‑effort parsing

## Project Structure

```
api/
  analyze.js        # Analyze + generate endpoint
  webhook.js        # Webhook endpoint for n8n
lib/
  ai.js             # Gemini client
  facebook.js       # Facebook fetch + normalization
  utils.js          # Scoring + insights
index.html          # Minimal UI
vercel.json         # Vercel runtime config
n8n-workflow.json   # n8n workflow export
```

## Resources

- Facebook Graph API Ads: https://developers.facebook.com/docs/marketing-api/
- Google Ads (n8n node): https://docs.n8n.io/integrations/builtin/credentials/google/
- Google AI Studio (Gemini): https://ai.google.dev/
- Vercel Serverless Functions: https://vercel.com/docs/functions/serverless-functions
- CSV to JSON tips: https://csvjson.com/

## Security

- Use `WEBHOOK_SECRET` for inbound webhook validation
- Never hardcode tokens; use environment variables
- Apply principle of least privilege to platform access tokens

## License

MIT