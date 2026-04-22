# Cloudflare Pages deployment

The frontend is a plain Vite SPA. Deploy with either the dashboard or Wrangler.

## Dashboard

1. Create a new Pages project, connect this repo.
2. **Build command**: `npm run build:frontend`
3. **Build output directory**: `frontend/dist`
4. **Root directory**: `/` (monorepo)
5. **Environment variables**:
   - `VITE_API_BASE_URL` — full URL to your Yandex API Gateway
     (e.g. `https://d5d...apigw.yandexcloud.net`).

## Wrangler (CI/CD)

```bash
npm ci
npm run build:frontend
npx wrangler pages deploy frontend/dist \
  --project-name=company-as-code \
  --branch=main
```

`CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` must be set. The workflow at
`.github/workflows/pages.yml` automates this on every push to `main`.

## Custom domain

Assign a custom domain from the Pages project settings. CORS on the backend is
already `*` so no extra config is needed.
