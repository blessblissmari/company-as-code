# Company-as-Code

Define a company the way you define infrastructure — as code — and let AI
generate the playbooks, workflows, SOPs, and org structure that make it run.

- **Frontend:** React + Vite (visual builder with cards + flows, output viewer, JSON/YAML export)
- **Backend:** Yandex Cloud Functions behind Yandex API Gateway
- **AI:** YandexGPT prompts for workflows, org structure, bottlenecks, optimization, and "what-if" simulations
- **Hosting:** Cloudflare Pages (frontend) + Yandex Cloud (backend)
- **MCP / OpenClaw:** adapter stub behind the `MCP_ENABLED` feature flag (future execution support)

---

## Structure

```
company-as-code/
├── frontend/                 React + Vite SPA
│   ├── src/components/       CompanyBuilder, FlowCanvas, OutputViewer, SimulationPanel
│   └── src/lib/              api client, export (JSON/YAML), types
├── backend/                  Yandex Cloud Functions (Node 18)
│   ├── src/handlers/         create / generate / simulate / get
│   ├── src/lib/              yandexgpt, prompts, storage, mcp-adapter, validate
│   └── test/                 node:test unit tests
└── infra/
    ├── api-gateway.yaml      Yandex API Gateway OpenAPI spec
    ├── deploy-yandex.sh      One-shot deploy script for the 4 functions
    └── cloudflare-pages.md   Pages deployment notes
```

## API

| Method | Path                 | Body                                   | Returns                      |
| ------ | -------------------- | -------------------------------------- | ---------------------------- |
| POST   | `/company/create`    | `CompanyInput`                         | `{ company }`                |
| POST   | `/company/generate`  | `{ companyId }`                        | `{ output }`                 |
| POST   | `/company/simulate`  | `{ companyId, scenario }`              | `{ result }`                 |
| GET    | `/company/:id`       | —                                      | `{ company, output }`        |

`output` contains `playbooks`, `workflows`, `sops`, `orgStructure`, `bottlenecks`, and
`optimizations`. `result` contains `scenario`, `impacts[]`, and `recommendations[]`.

## Run locally

```bash
# 1. Install
npm install

# 2. Backend (dev server on :8787)
cd backend
YANDEX_API=<key> \
YANDEX_FOLDER_ID=<folder> \
MODEL_YANDEX=yandexgpt-lite \
npm run dev

# 3. Frontend (dev server on :5173)
cd ../frontend
VITE_API_BASE_URL=http://localhost:8787 npm run dev
```

Unit tests (handlers, validation, MCP adapter):

```bash
cd backend && npm test
```

## Deploy

### Backend — Yandex Cloud

Prereqs: `yc` CLI logged in, a folder, a service account with the
`functions.functionInvoker` role (and `ai.languageModels.user` for YandexGPT).

```bash
export YC_FOLDER_ID=<folder-id>
export YC_SA_ID=<service-account-id>
export YANDEX_API=<yandex-cloud-api-key>
export MODEL_YANDEX=yandexgpt-lite
bash infra/deploy-yandex.sh
```

Then fill in the resulting `FUNCTION_ID_*` values in `infra/api-gateway.yaml` and:

```bash
yc serverless api-gateway create --name cac-gw \
  --spec=infra/api-gateway.yaml --folder-id $YC_FOLDER_ID
```

The gateway will print a public `https://...apigw.yandexcloud.net` URL.

### Frontend — Cloudflare Pages

See [`infra/cloudflare-pages.md`](./infra/cloudflare-pages.md). Set
`VITE_API_BASE_URL` to the API Gateway URL from the previous step.

The included GitHub Action `.github/workflows/pages.yml` builds and deploys on
every push to `main` when `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID`
repo secrets are configured.

## Configuration

Backend env vars:

| Variable            | Required | Description                                                    |
| ------------------- | :------: | -------------------------------------------------------------- |
| `YANDEX_API`        |    ✓*    | YandexGPT API key (Api-Key auth)                               |
| `YANDEX_IAM`        |    —     | Alternative: IAM bearer token                                  |
| `YANDEX_FOLDER_ID`  |    ✓     | Folder ID where the model lives (for `gpt://<folder>/...`)     |
| `MODEL_YANDEX`      |    ✓     | Model short name (e.g. `yandexgpt-lite`) or full `gpt://` URI  |
| `MCP_ENABLED`       |    —     | `true` to enrich workflows with OpenClaw MCP descriptors       |
| `DATA_DIR`          |    —     | Dev-only: directory to persist JSON companies & outputs        |

\* Either `YANDEX_API` or `YANDEX_IAM` is required.

Frontend env vars:

| Variable              | Description                                        |
| --------------------- | -------------------------------------------------- |
| `VITE_API_BASE_URL`   | Backend base URL (defaults to `/api` for rewrites) |

## MCP / OpenClaw

The adapter in `backend/src/lib/mcp-adapter.js` is intentionally a **stub**. When
`MCP_ENABLED=true`, each generated workflow step is mapped to an MCP-compatible
descriptor (`openclaw.action`) so a future execution runtime can consume the
output without any change to the AI layer. No tools are executed in the MVP.

## License

MIT
