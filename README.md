# keyso-mcp

Готовый MCP-сервер для Keys.so API (`https://api.keys.so`), сгенерированный по спецификации из `https://apidoc.keys.so`.

Сервер регистрирует:
- `keyso_api_request` — универсальный ручной вызов API.
- Автотулы для всех операций OpenAPI (сейчас: 150).

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

## Skill для экономии контекста

В репозитории добавлен skill: `skills/keyso-api-router`.

Он нужен для больших задач по Keys.so API, чтобы:
- не грузить весь OpenAPI в контекст;
- выбирать только релевантные endpoint-группы;
- начинать с минимального набора вызовов.

Установка skill в локальные Codex skills:

```bash
mkdir -p ~/.codex/skills
cp -R skills/keyso-api-router ~/.codex/skills/keyso-api-router
```

## Примечания

- Во всех запросах токен автоматически ставится в оба заголовка: `X-Keyso-TOKEN` и `auth-token`.
- Для операций с path-параметрами (например, `/serp/<id>`) MCP-тулы ожидают аргумент `id`.
