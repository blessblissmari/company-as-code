# Company-as-Code

Define your company the way you define infrastructure. Describe sales, marketing, support,
goals and strategy — YandexGPT generates the playbooks, workflows, SOPs, org structure,
bottlenecks, optimization ideas, and what-if simulations that make it run.

**Live demo:** https://company-as-code.pages.dev

## Architecture

```
┌──────────────────────┐   HTTPS   ┌─────────────────────────┐   HTTPS   ┌───────────────────┐
│  React + Vite SPA    │ ────────► │ Yandex API Gateway       │ ────────► │ Yandex Cloud      │
│  Cloudflare Pages    │           │ (OpenAPI 3.0, CORS, path │           │ Function `cac-api`│
│                      │           │  routing)                │           │ Node 18 CJS       │
└──────────────────────┘           └─────────────────────────┘           └─────────┬─────────┘
                                                                                    │
                                                                ┌───────────────────┼───────────────────┐
                                                                ▼                   ▼                   ▼
                                                    ┌───────────────────┐ ┌───────────────────┐ ┌───────────────────┐
                                                    │ YandexGPT         │ │ Yandex Object     │ │ MCP / OpenClaw    │
                                                    │ (foundation model)│ │ Storage (JSON     │ │ adapter stub      │
                                                    │                   │ │  objects, SigV4)  │ │ (feature flag)    │
                                                    └───────────────────┘ └───────────────────┘ └───────────────────┘
```

- **Frontend**: React + Vite SPA — visual builder, reactflow org chart, output viewer, JSON/YAML export, EN + RU localization.
- **Backend**: one Yandex Cloud Function dispatching to four handlers — `create`, `generate`, `simulate`, `get`. Uses an in-memory cache + Yandex Object Storage for durable state across cold starts.
- **AI**: YandexGPT prompts in `backend/src/lib/prompts.js` request strict JSON matching a fixed schema; responses are normalized in the handlers.
- **MCP / OpenClaw**: adapter stub in `backend/src/lib/mcp-adapter.js` attaches executor descriptors to workflows when `MCP_ENABLED=true`. No execution in MVP.
- **Hosting**: Cloudflare Pages (frontend) + Yandex Cloud Functions + API Gateway (backend).

## Routes

| Method | Path                   | Description                                      |
|--------|------------------------|--------------------------------------------------|
| POST   | `/company/create`      | Validate + persist a company definition          |
| POST   | `/company/generate`    | YandexGPT → playbooks / workflows / SOPs / etc.  |
| POST   | `/company/simulate`    | YandexGPT → impacts + recommendations for a scenario |
| GET    | `/company/:id`         | Load a persisted company and its last generation |

All POST endpoints accept JSON and return JSON.

`generate` / `simulate` bodies accept either `{ companyId }` (for stored companies) or `{ company }` (for stateless calls). The frontend always sends the full `company` object to be resilient against cold-start containers losing in-memory state. Both accept a `language` field (`en` | `ru`); YandexGPT will answer in that language while keeping JSON keys in English.

## Monorepo layout

```
backend/                   Yandex Cloud Function handlers + shared libs
  src/
    handlers/              create | generate | simulate | get
    lib/                   yandexgpt, prompts, storage, s3, mcp-adapter, i18n, response, validate
    index.js               dispatcher (single-function deployment)
    server.js              local dev HTTP server
  test/handlers.test.js    15 unit tests via node:test
frontend/                  React + Vite SPA
  src/
    components/            CompanyBuilder | FlowCanvas | OutputViewer | SimulationPanel | LanguageSwitcher
    lib/                   api, types, export, i18n
    App.tsx
infra/
  api-gateway.yaml         Yandex API Gateway OpenAPI 3.0 spec
  deploy-yandex.sh         single-command deploy (4 or 1 functions)
  cloudflare-pages.md      Cloudflare Pages deploy notes
.github/workflows/
  ci.yml                   lint + typecheck + build + test on every PR
  pages.yml                auto-deploy frontend to Cloudflare Pages on push to main
  deploy-backend.yml       auto-deploy function to Yandex Cloud on push to main
```

## Local development

```bash
# 1. Install workspaces
npm install

# 2. Backend: run the mock HTTP server
export YANDEX_API=<your-yandex-api-key>
export MODEL_YANDEX=gpt://<folder>/yandexgpt-lite/latest
npm run dev -w backend         # http://localhost:8787

# 3. Frontend: point at the backend
VITE_API_BASE_URL=http://localhost:8787 npm run dev -w frontend   # http://localhost:5173

# 4. Tests + lint + build
npm test -w backend
npm run lint
npm run build
```

## Production checklist

### Secrets and repo variables (GitHub Actions)

Set these on the repo (`Settings → Secrets and variables → Actions`) so the CI workflows can self-deploy.

| Kind     | Name                     | Purpose                                                                 |
|----------|--------------------------|-------------------------------------------------------------------------|
| secret   | `YANDEX_API`             | Yandex Cloud API Key for YandexGPT                                      |
| secret   | `YC_SA_KEY_JSON`         | Service-account key JSON used by `yc` CLI in `deploy-backend.yml`      |
| secret   | `S3_ACCESS_KEY_ID`       | Static access key id for the Object Storage bucket                      |
| secret   | `S3_SECRET_ACCESS_KEY`   | Static secret for the Object Storage bucket                             |
| secret   | `CLOUDFLARE_API_TOKEN`   | Cloudflare Pages deploy token (Pages:Edit)                              |
| secret   | `CLOUDFLARE_ACCOUNT_ID`  | Cloudflare account id                                                   |
| variable | `YC_FOLDER_ID`           | Yandex Cloud folder id (e.g. `b1g...`)                                  |
| variable | `YC_SA_ID`               | Service account id (`ajx...`) with `functions.functionInvoker` + `ai.languageModels.user` |
| variable | `YC_FUNCTION_ID`         | Existing function id (run `infra/deploy-yandex.sh` once to create it)   |
| variable | `MODEL_YANDEX`           | Full model URI, e.g. `gpt://<folder>/yandexgpt-lite/latest`             |
| variable | `S3_BUCKET`              | Object Storage bucket name                                              |
| variable | `CORS_ALLOWED_ORIGINS`   | e.g. `https://company-as-code.pages.dev`                                |
| variable | `VITE_API_BASE_URL`      | Production API Gateway URL (for frontend build)                         |
| variable | `MCP_ENABLED`            | `true` to attach OpenClaw descriptors; default `false`                  |

### Production hardening

- **CORS**: `backend/src/lib/response.js` reflects an allowlist when `CORS_ALLOWED_ORIGINS` is set (comma-separated). Leave unset only for local dev.
- **Persistence**: set `S3_BUCKET` + `S3_ACCESS_KEY_ID` + `S3_SECRET_ACCESS_KEY` to enable Yandex Object Storage. Companies go under `companies/<id>.json`, outputs under `outputs/<id>.json`. Without these env vars the app falls back to an in-memory cache (dev only — state is lost at cold start).
- **Authentication**: add Yandex API Gateway JWT / API-key auth before exposing to untrusted clients. The function itself has no auth.
- **Rate limiting**: apply API Gateway rate-limit rules per IP — YandexGPT calls are the most expensive path.
- **Quota**: default Yandex Cloud folders are capped at 10 functions. This repo deploys a single dispatcher function by design. Request a quota bump to deploy 4 per-route functions with `infra/deploy-yandex.sh`.

### One-time Yandex Cloud setup

```bash
# 1. Create a service account with minimum roles
yc iam service-account create --name cac-deployer --folder-id "$YC_FOLDER_ID"
SA_ID=$(yc iam service-account get cac-deployer --format json | jq -r .id)

for role in serverless.functions.admin ai.languageModels.user storage.editor; do
  yc resource-manager folder add-access-binding "$YC_FOLDER_ID" \
    --role "$role" --subject "serviceAccount:$SA_ID"
done

# 2. Create a static access key for Object Storage
yc iam access-key create --service-account-id "$SA_ID" --format json > /tmp/key.json
# save .access_key.key_id as S3_ACCESS_KEY_ID and .secret as S3_SECRET_ACCESS_KEY

# 3. Create a bucket
yc storage bucket create --name company-as-code-data --folder-id "$YC_FOLDER_ID"

# 4. Create an authorized-key for CI (used by yc CLI in GitHub Actions)
yc iam key create --service-account-id "$SA_ID" --output /tmp/sa-key.json
# paste contents of /tmp/sa-key.json as YC_SA_KEY_JSON secret

# 5. Create the function skeleton (just so it has an id you can reference)
yc serverless function create --name cac-api --folder-id "$YC_FOLDER_ID"
# save the returned id as YC_FUNCTION_ID variable

# 6. Allow unauthenticated invoke (API Gateway will invoke directly)
yc serverless function allow-unauthenticated-invoke --name cac-api
```

From here every push to `main` will redeploy the function via `.github/workflows/deploy-backend.yml` and the frontend via `.github/workflows/pages.yml`.

### API Gateway

Fill in `<FUNCTION_ID_*>` + `<SERVICE_ACCOUNT_ID>` in `infra/api-gateway.yaml` (for a single-function setup, use the same function id for every route) and apply:

```bash
yc serverless api-gateway create --name cac-gw --spec=infra/api-gateway.yaml --folder-id "$YC_FOLDER_ID"
```

The resulting `*.apigw.yandexcloud.net` domain is your `VITE_API_BASE_URL`.

## Internationalization

The frontend supports English and Russian out of the box. The language switcher in the topbar
persists the selection in `localStorage` and propagates the choice to `/company/generate` +
`/company/simulate` so YandexGPT answers in the selected language. JSON keys remain in English
so the generated output still matches the TypeScript types. Adding a third language is a matter
of extending `DICTS` in `frontend/src/lib/i18n.ts` and `LANGUAGE_INSTRUCTION` in
`backend/src/lib/prompts.js`.

## License

MIT
