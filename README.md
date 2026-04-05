# keyso-mcp

Готовый MCP-сервер для Keys.so API (`https://api.keys.so`), сгенерированный по спецификации из `https://apidoc.keys.so`.

## Quick Start

1. Установить зависимости:

```bash
npm install
```

2. Добавить сервер в `~/.codex/config.toml`:

```toml
[mcp_servers.keyso]
command = "node"
args = ["/Users/alexanderbukreev/git/keyso-mcp/src/index.js"]

[mcp_servers.keyso.env]
KEYSO_TOKEN = "<ваш_api_токен>"
```

3. Перезапустить Codex CLI.

4. Сделать первый запрос:

```text
Используй skill keyso-domain-dashboard-lite. Проверь domain=ozon.ru, base=msk и дай короткий snapshot.
```

Если skills не нужны, можно сразу работать через MCP:

```text
Через Keys.so MCP проверь domain=ozon.ru, base=msk и покажи основные SEO-метрики.
```

Сервер регистрирует:
- `keyso_api_request` — универсальный ручной вызов API.
- Автотулы для всех операций OpenAPI (сейчас: 150).

## Требования и запуск

- Node.js 18+

Локальный запуск:

```bash
export KEYSO_TOKEN="<ваш_api_токен>"
npm start
```

Опционально:
- `KEYSO_API_BASE_URL` — переопределить базовый URL API (по умолчанию `https://api.keys.so`).

Smoke-test MCP handshake:

```bash
npm run smoke:mcp
```

Скрипт поднимает сервер как дочерний процесс, делает `initialize` и `listTools`, затем проверяет, что клиент реально видит `keyso_api_request` и полный набор tools.

## Как проверить после настройки

После того как вы:
- добавили `keyso` в `~/.codex/config.toml`;
- установили skills в `~/.codex/skills`;
- перезапустили Codex CLI;

проверьте систему в 2 шага.

### 1. Проверить MCP handshake локально

Запустите:

```bash
npm run smoke:mcp
```

Ожидаемый результат:
- `ok: true`
- `server.name = keyso-api-mcp`
- `toolCount` около `151`
- `hasGenericTool: true`

Это подтверждает, что:
- MCP server стартует;
- `initialize` проходит;
- `listTools` проходит;
- клиент реально видит инструменты сервера.

### 2. Проверить skill на живом сценарии

В Codex после перезапуска выполните, например:

```text
Используй skill keyso-domain-dashboard-lite. Проверь domain=ozon.ru, base=msk и дай короткий snapshot.
```

Или:

```text
Используй skill keyso-quick-audit. Проверь domain=ozon.ru, base=msk и покажи organic competitors.
```

Что считать нормальным результатом:
- агент не сообщает, что `keyso` MCP недоступен;
- ответ строится на реальных данных Keys.so, а не на абстрактных рассуждениях;
- `keyso-domain-dashboard-lite` использует один базовый endpoint;
- `keyso-quick-audit` не разрастается дальше одного follow-up endpoint без необходимости.

## Обновление спецификации

```bash
npm run update:openapi
```

Скрипт заново вытаскивает OpenAPI из `apidoc.keys.so` и обновляет `openapi.json`.

## Конфиги MCP

Конфиг для Codex CLI уже показан в `Quick Start`. Ниже оставлен только вариант для Claude Code.

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
- `skills/keyso-domain-dashboard-lite` — micro-режим для single endpoint `/report/simple/domain_dashboard`.

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
cp -R skills/keyso-domain-dashboard-lite ~/.codex/skills/keyso-domain-dashboard-lite
```

Сравнение вариантов в HTML:
- `docs/keyso-options-comparison.html`

## Примеры использования skills

Ниже готовые copy-paste prompts для Codex/агента.

### 1. `keyso-domain-dashboard-lite`

Когда использовать:
- нужен один быстрый снимок по домену;
- не нужны конкуренты, keywords, compare или monitoring.

Пример prompt:

```text
Используй skill keyso-domain-dashboard-lite. Проверь domain=ozon.ru, base=msk и дай короткий snapshot.
```

Что ожидается:
- 1 вызов `/report/simple/domain_dashboard`;
- короткий ответ по основным метрикам домена.

### 2. `keyso-quick-audit`

Когда использовать:
- нужен быстрый аудит домена или ключа;
- допустим максимум 1 follow-up endpoint.

Пример prompt по домену:

```text
Используй skill keyso-quick-audit. Быстро оцени domain=wildberries.ru, base=msk и покажи ещё organic competitors.
```

Пример prompt по ключу:

```text
Используй skill keyso-quick-audit. Проверь keyword=купить велосипед, base=msk и покажи похожие запросы.
```

Что ожидается:
- домен: `/report/simple/domain_dashboard` + опционально `/report/simple/organic/concurents`;
- ключ: `/report/simple/keyword_dashboard` + опционально `/report/simple/similarkeys`.

### 3. `keyso-api-router`

Когда использовать:
- задача шире одного snapshot;
- нужен подбор минимального набора endpoint'ов под вопрос;
- возможны compare, monitoring, serp, async flows.

Пример prompt для compare:

```text
Используй skill keyso-api-router. Сравни ozon.ru и wildberries.ru по органике и покажи пересечение конкурентов.
```

Пример prompt для paid search:

```text
Используй skill keyso-api-router. Сделай paid search обзор по domain=leroymerlin.ru, base=msk.
```

Что ожидается:
- агент сам выбирает минимальный набор релевантных endpoint'ов;
- начинает с 1-3 вызовов и расширяет набор только если это действительно нужно.

### Короткое правило выбора

- `keyso-domain-dashboard-lite` — один быстрый snapshot домена.
- `keyso-quick-audit` — быстрый аудит домена или ключа плюс один дополнительный срез.
- `keyso-api-router` — всё, что шире или сложнее этого.

## Примеры использования MCP без skills

Этот режим нужен, если вы не хотите подключать skills и хотите ходить в API напрямую через MCP tools.

### 1. Через generic tool `keyso_api_request`

Пример запроса:

```text
Вызови tool keyso_api_request с такими аргументами:
{
  "method": "GET",
  "path": "/report/simple/domain_dashboard",
  "query": {
    "domain": "ozon.ru",
    "base": "msk"
  }
}
```

Когда подходит:
- endpoint известен заранее;
- нужен полный ручной контроль над методом, path и query/body;
- имя автосгенерированного tool неудобно искать.

### 2. Через автосгенерированный tool для конкретного endpoint

Пример запроса:

```text
Вызови tool для /report/simple/domain_dashboard с аргументами:
{
  "domain": "ozon.ru",
  "base": "msk"
}
```

Другой пример:

```text
Вызови tool для /report/simple/keyword_dashboard с аргументами:
{
  "keyword": "купить велосипед",
  "base": "msk"
}
```

Когда подходит:
- endpoint понятен;
- нужен более короткий вызов без ручной сборки `method` и `path`.

### 3. Прямые user prompts без явного skill

Пример prompt:

```text
Проверь domain=ozon.ru через Keys.so MCP и покажи основные SEO-метрики.
```

Пример prompt:

```text
Через Keys.so MCP сравни ozon.ru и wildberries.ru по органике.
```

Что обычно происходит:
- агент либо выберет подходящий автосгенерированный tool;
- либо использует `keyso_api_request`, если так быстрее или надёжнее.

Компромисс этого режима:
- больше свободы;
- меньше guardrails;
- выше шанс использовать лишние endpoint'ы или потратить больше контекста, чем при работе через skills.

## Частые сценарии

Ниже готовые prompts для повседневных задач.

### 1. Проверить домен

Рекомендуемый режим:
- `keyso-domain-dashboard-lite`

Prompt:

```text
Используй skill keyso-domain-dashboard-lite. Проверь domain=ozon.ru, base=msk и дай краткий SEO snapshot.
```

### 2. Проверить домен и конкурентов

Рекомендуемый режим:
- `keyso-quick-audit`

Prompt:

```text
Используй skill keyso-quick-audit. Проверь domain=ozon.ru, base=msk и покажи organic competitors.
```

### 3. Проверить ключ

Рекомендуемый режим:
- `keyso-quick-audit`

Prompt:

```text
Используй skill keyso-quick-audit. Проверь keyword=купить велосипед, base=msk и дай краткий snapshot.
```

### 4. Проверить ключ и похожие запросы

Рекомендуемый режим:
- `keyso-quick-audit`

Prompt:

```text
Используй skill keyso-quick-audit. Проверь keyword=купить велосипед, base=msk и покажи похожие запросы.
```

### 5. Найти top organic keywords домена

Рекомендуемый режим:
- `keyso-quick-audit`

Prompt:

```text
Используй skill keyso-quick-audit. Проверь domain=ozon.ru, base=msk и покажи top organic keywords.
```

### 6. Сравнить два домена по органике

Рекомендуемый режим:
- `keyso-api-router`

Prompt:

```text
Используй skill keyso-api-router. Сравни ozon.ru и wildberries.ru по органике, base=msk.
```

### 7. Сделать paid search обзор

Рекомендуемый режим:
- `keyso-api-router`

Prompt:

```text
Используй skill keyso-api-router. Сделай paid search обзор по domain=leroymerlin.ru, base=msk.
```

### 8. Посмотреть backlinks домена

Рекомендуемый режим:
- `keyso-api-router`

Prompt:

```text
Используй skill keyso-api-router. Покажи backlinks profile для domain=ozon.ru, base=msk.
```

### 9. Работать без skills, только через MCP

Рекомендуемый режим:
- MCP only

Prompt:

```text
Через Keys.so MCP проверь domain=ozon.ru, base=msk и покажи основные SEO-метрики.
```

## Примечания

- Во всех запросах токен автоматически ставится в оба заголовка: `X-Keyso-TOKEN` и `auth-token`.
- Для операций с path-параметрами (например, `/serp/<id>`) MCP-тулы ожидают аргумент `id`.
