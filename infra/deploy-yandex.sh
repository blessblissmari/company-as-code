#!/usr/bin/env bash
#
# Deploy the four Company-as-Code functions to Yandex Cloud.
#
# Requirements:
#   - `yc` CLI logged in (yc init)
#   - env vars: YC_FOLDER_ID, YC_SA_ID (service account with functions.functionInvoker role),
#     YANDEX_API (YandexGPT API key), MODEL_YANDEX (e.g. yandexgpt-lite)
#
# Usage:  bash infra/deploy-yandex.sh
set -euo pipefail

: "${YC_FOLDER_ID:?YC_FOLDER_ID not set}"
: "${YC_SA_ID:?YC_SA_ID (service account id) not set}"
: "${YANDEX_API:?YANDEX_API not set}"
: "${MODEL_YANDEX:=yandexgpt-lite}"

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PKG_DIR="$REPO_ROOT/backend"
BUILD_DIR="$REPO_ROOT/.build"
mkdir -p "$BUILD_DIR"

build_zip() {
  local handler_file="$1" out_zip="$2"
  rm -f "$out_zip"
  ( cd "$PKG_DIR" && zip -qr "$out_zip" \
      package.json \
      src \
      -x "src/server.js" \
      -x "test/*" )
  echo "Built $out_zip (entrypoint: $handler_file)"
}

deploy() {
  local name="$1" handler_path="$2" entrypoint="$3"
  local zip_file="$BUILD_DIR/$name.zip"
  build_zip "$handler_path" "$zip_file"

  if ! yc serverless function get --name "$name" >/dev/null 2>&1; then
    yc serverless function create --name "$name" --folder-id "$YC_FOLDER_ID"
  fi

  yc serverless function version create \
    --function-name "$name" \
    --runtime nodejs18 \
    --entrypoint "$entrypoint" \
    --memory 256m \
    --execution-timeout 30s \
    --service-account-id "$YC_SA_ID" \
    --source-path "$zip_file" \
    --environment "YANDEX_API=$YANDEX_API" \
    --environment "MODEL_YANDEX=$MODEL_YANDEX" \
    --environment "YANDEX_FOLDER_ID=$YC_FOLDER_ID" \
    --environment "MCP_ENABLED=${MCP_ENABLED:-false}"

  echo "Deployed $name"
}

deploy cac-create   src/handlers/create.js   src/handlers/create.handler
deploy cac-generate src/handlers/generate.js src/handlers/generate.handler
deploy cac-simulate src/handlers/simulate.js src/handlers/simulate.handler
deploy cac-get      src/handlers/get.js      src/handlers/get.handler

echo
echo "Next step: create the API Gateway. Fill in FUNCTION_ID_* in infra/api-gateway.yaml"
echo "then run:"
echo "  yc serverless api-gateway create --name cac-gw --spec=infra/api-gateway.yaml --folder-id \$YC_FOLDER_ID"
