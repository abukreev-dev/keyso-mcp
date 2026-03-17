# keyso-mcp

Готовый MCP-сервер для Keys.so API (`https://api.keys.so`), сгенерированный по спецификации из `https://apidoc.keys.so`.

Сервер регистрирует:
- `keyso_api_request` — универсальный ручной вызов API.
- Автотулы для всех операций OpenAPI (сейчас: 139).

## Требования

- Node.js 18+

## Установка

```bash
npm install
```

## Запуск

```bash
export KEYSO_TOKEN="<ваш_api_токен>"
npm start
```

Опционально:
- `KEYSO_API_BASE_URL` — переопределить базовый URL API (по умолчанию `https://api.keys.so`).

## Обновление спецификации

```bash
npm run update:openapi
```

Скрипт заново вытаскивает OpenAPI из `apidoc.keys.so` и обновляет `openapi.json`.

## Конфиги MCP

Используются относительные пути от корня этого репозитория.

### Codex CLI (`~/.codex/config.toml`)

```toml
[mcp_servers.keyso]
command = "node"
args = ["src/index.js"]

[mcp_servers.keyso.env]
KEYSO_TOKEN = "<ваш_api_токен>"
```

### Claude Code (MCP config JSON)

```json
{
  "mcpServers": {
    "keyso": {
      "command": "node",
      "args": ["src/index.js"],
      "env": {
        "KEYSO_TOKEN": "<ваш_api_токен>"
      }
    }
  }
}
```

## Примечания

- Во всех запросах токен автоматически ставится в оба заголовка: `X-Keyso-TOKEN` и `auth-token`.
- Для операций с path-параметрами (например, `/serp/<id>`) MCP-тулы ожидают аргумент `id`.
