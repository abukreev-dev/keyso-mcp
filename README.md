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

## Skills для экономии контекста

В репозитории добавлены skills:
- `skills/keyso-api-router` — широкий роутер по всему API.
- `skills/keyso-quick-audit` — узкий режим для быстрых domain/keyword проверок.

`keyso-api-router` нужен для больших задач, чтобы:
- не грузить весь OpenAPI в контекст;
- выбирать только релевантные endpoint-группы;
- начинать с минимального набора вызовов.

`keyso-quick-audit` нужен для коротких задач, чтобы:
- использовать только 1 основной endpoint;
- добавлять максимум 1 дополнительный endpoint;
- держать минимальный размер контекста.

Установка skill в локальные Codex skills:

```bash
mkdir -p ~/.codex/skills
cp -R skills/keyso-api-router ~/.codex/skills/keyso-api-router
cp -R skills/keyso-quick-audit ~/.codex/skills/keyso-quick-audit
```

## Примечания

- Во всех запросах токен автоматически ставится в оба заголовка: `X-Keyso-TOKEN` и `auth-token`.
- Для операций с path-параметрами (например, `/serp/<id>`) MCP-тулы ожидают аргумент `id`.
