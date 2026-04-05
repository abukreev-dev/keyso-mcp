const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { McpServer } = require("@modelcontextprotocol/sdk/server/mcp.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const z = require("zod/v4");

const SPEC_PATH = path.resolve(__dirname, "..", "openapi.json");
const DEFAULT_BASE_URL = process.env.KEYSO_API_BASE_URL || "https://api.keys.so";

function loadSpec() {
  const raw = fs.readFileSync(SPEC_PATH, "utf8");
  return JSON.parse(raw);
}

function sanitizeToolName(name) {
  const cleaned = name
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_");

  if (cleaned.length <= 48) {
    return cleaned || "keyso_operation";
  }

  const hash = crypto.createHash("sha1").update(name).digest("hex").slice(0, 8);
  return `${cleaned.slice(0, 39)}_${hash}`;
}

function normalizePathTemplate(rawPath) {
  return rawPath
    .replace(/<([^>]+)>/g, "{$1}")
    .replace(/\/\/+/, "/");
}

function pathParamNames(pathTemplate) {
  return Array.from(pathTemplate.matchAll(/\{([^}]+)\}/g)).map((m) => m[1]);
}

function resolveParam(spec, param) {
  if (!param || typeof param !== "object") {
    return null;
  }
  if (!param.$ref) {
    return param;
  }

  const ref = param.$ref;
  const prefix = "#/components/parameters/";
  if (!ref.startsWith(prefix)) {
    return null;
  }

  const name = ref.slice(prefix.length);
  return spec.components?.parameters?.[name] || null;
}

function zodTypeFromOpenApiSchema(schema) {
  if (!schema || typeof schema !== "object") {
    return z.any();
  }

  if (schema.enum && Array.isArray(schema.enum) && schema.enum.length > 0) {
    const hasOnlyStrings = schema.enum.every((v) => typeof v === "string");
    if (hasOnlyStrings) {
      return z.enum(schema.enum);
    }
    return z.union(schema.enum.map((v) => z.literal(v)));
  }

  switch (schema.type) {
    case "integer":
    case "number":
      return z.number();
    case "boolean":
      return z.boolean();
    case "array":
      return z.array(z.any());
    case "object":
      return z.object({}).catchall(z.any());
    case "string":
    default:
      return z.string();
  }
}

function addParamToInputSchema(inputSchema, param, requiredSet) {
  const name = param.name;
  if (!name || inputSchema[name]) {
    if (param?.required && name) {
      requiredSet.add(name);
    }
    return;
  }

  let zodField = zodTypeFromOpenApiSchema(param.schema);

  const descriptionParts = [];
  if (param.in) {
    descriptionParts.push(`in: ${param.in}`);
  }
  if (param.description) {
    descriptionParts.push(param.description);
  }

  const description = descriptionParts.join(" | ");
  if (description) {
    zodField = zodField.describe(description);
  }

  if (!param.required) {
    zodField = zodField.optional();
  } else {
    requiredSet.add(name);
  }

  inputSchema[name] = zodField;
}

function buildToolDefinitions(spec) {
  const definitions = [];
  const usedNames = new Set();

  for (const [rawPath, pathItem] of Object.entries(spec.paths || {})) {
    const commonParams = Array.isArray(pathItem?.parameters) ? pathItem.parameters : [];

    for (const method of ["get", "post", "put", "patch", "delete"]) {
      const operation = pathItem?.[method];
      if (!operation) {
        continue;
      }

      const normalizedPath = normalizePathTemplate(rawPath);
      const requiredInputNames = new Set();
      const inputSchema = {};

      const explicitParams = [
        ...commonParams,
        ...(Array.isArray(operation.parameters) ? operation.parameters : []),
      ];

      const resolvedParams = explicitParams
        .map((p) => resolveParam(spec, p))
        .filter(Boolean);

      for (const param of resolvedParams) {
        addParamToInputSchema(inputSchema, param, requiredInputNames);
      }

      for (const paramName of pathParamNames(normalizedPath)) {
        if (!inputSchema[paramName]) {
          inputSchema[paramName] = z.string().describe("in: path (auto-detected)");
        }
        requiredInputNames.add(paramName);
      }

      let hasBody = false;
      const requestBody = operation.requestBody;
      if (requestBody) {
        hasBody = true;
        const bodyRequired = requestBody.required === true;
        const bodyDescription = "JSON body";
        const bodySchema = bodyRequired
          ? z.object({}).catchall(z.any()).describe(bodyDescription)
          : z.object({}).catchall(z.any()).describe(bodyDescription).optional();
        inputSchema.body = bodySchema;
        if (bodyRequired) {
          requiredInputNames.add("body");
        }
      }

      inputSchema.base_url = z.string().optional().describe("Override API base URL");
      inputSchema.token = z.string().optional().describe("API token override (fallback: KEYSO_TOKEN env)");

      const baseName = sanitizeToolName(`keyso_${method}_${normalizedPath.replace(/[{}]/g, "")}`);
      let toolName = baseName;
      let suffix = 2;
      while (usedNames.has(toolName)) {
        toolName = `${baseName}_${suffix}`;
        suffix += 1;
      }
      usedNames.add(toolName);

      definitions.push({
        toolName,
        method,
        rawPath,
        normalizedPath,
        operation,
        hasBody,
        inputSchema,
        requiredInputNames,
        resolvedParams,
      });
    }
  }

  return definitions;
}

function applyPathParams(pathTemplate, args, requiredInputNames) {
  return pathTemplate.replace(/\{([^}]+)\}/g, (_, key) => {
    const value = args[key];
    if (value === undefined || value === null || value === "") {
      if (requiredInputNames.has(key)) {
        throw new Error(`Missing required path parameter: ${key}`);
      }
      return "";
    }
    return encodeURIComponent(String(value));
  });
}

function appendQueryParams(url, params, args) {
  for (const param of params) {
    if (param.in !== "query") {
      continue;
    }

    const value = args[param.name];
    if (value === undefined || value === null) {
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        url.searchParams.append(param.name, String(item));
      }
      continue;
    }

    url.searchParams.set(param.name, String(value));
  }
}

function extractErrorMessage(payload) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  if (typeof payload.message === "string") {
    return payload.message;
  }
  if (typeof payload.error === "string") {
    return payload.error;
  }
  return null;
}

async function callOperation(def, args) {
  const baseUrl = args.base_url || DEFAULT_BASE_URL;
  const pathWithParams = applyPathParams(def.normalizedPath, args, def.requiredInputNames);
  const url = new URL(pathWithParams, `${baseUrl.replace(/\/$/, "")}/`);

  appendQueryParams(url, def.resolvedParams, args);

  const token = args.token || process.env.KEYSO_TOKEN;

  const headers = {
    Accept: "application/json",
  };

  if (token) {
    headers["X-Keyso-TOKEN"] = token;
    headers["auth-token"] = token;
  }

  const init = {
    method: def.method.toUpperCase(),
    headers,
  };

  if (def.hasBody && args.body !== undefined) {
    headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(args.body);
  }

  const response = await fetch(url, init);
  const text = await response.text();

  let data = text;
  try {
    data = JSON.parse(text);
  } catch (_e) {
    // Non-JSON response, keep raw text.
  }

  const summary = {
    tool: def.toolName,
    method: init.method,
    url: url.toString(),
    status: response.status,
    ok: response.ok,
    data,
  };

  if (!response.ok) {
    const msg = extractErrorMessage(data) || `HTTP ${response.status}`;
    return {
      isError: true,
      content: [
        {
          type: "text",
          text: `${msg}\n\n${JSON.stringify(summary, null, 2)}`,
        },
      ],
    };
  }

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(summary, null, 2),
      },
    ],
  };
}

function registerGenericTool(server) {
  server.registerTool(
    "keyso_api_request",
    {
      description: "Universal request tool for Keys.so API",
      inputSchema: {
        method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]),
        path: z.string().describe("Path like /report/simple/domain_dashboard"),
        query: z.object({}).catchall(z.any()).optional().describe("Query params object"),
        body: z.object({}).catchall(z.any()).optional().describe("JSON body for write methods"),
        base_url: z.string().optional().describe("Override API base URL"),
        token: z.string().optional().describe("API token override (fallback: KEYSO_TOKEN env)"),
      },
    },
    async ({ method, path: rawPath, query, body, base_url, token }) => {
      const baseUrl = base_url || DEFAULT_BASE_URL;
      const url = new URL(rawPath, `${baseUrl.replace(/\/$/, "")}/`);

      if (query && typeof query === "object") {
        for (const [k, v] of Object.entries(query)) {
          if (v === undefined || v === null) {
            continue;
          }
          if (Array.isArray(v)) {
            for (const item of v) {
              url.searchParams.append(k, String(item));
            }
            continue;
          }
          url.searchParams.set(k, String(v));
        }
      }

      const apiToken = token || process.env.KEYSO_TOKEN;
      const headers = {
        Accept: "application/json",
      };
      if (apiToken) {
        headers["X-Keyso-TOKEN"] = apiToken;
        headers["auth-token"] = apiToken;
      }

      const init = {
        method,
        headers,
      };

      if (body !== undefined) {
        headers["Content-Type"] = "application/json";
        init.body = JSON.stringify(body);
      }

      const response = await fetch(url, init);
      const text = await response.text();

      let data = text;
      try {
        data = JSON.parse(text);
      } catch (_e) {
        // Keep text if not JSON.
      }

      return {
        isError: !response.ok,
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                method,
                url: url.toString(),
                status: response.status,
                ok: response.ok,
                data,
              },
              null,
              2,
            ),
          },
        ],
      };
    },
  );
}

async function main() {
  const spec = loadSpec();
  const server = new McpServer({
    name: "keyso-api-mcp",
    version: "1.0.0",
  });

  registerGenericTool(server);

  const definitions = buildToolDefinitions(spec);

  for (const def of definitions) {
    const title = def.operation.summary || def.operation.operationId || `${def.method.toUpperCase()} ${def.rawPath}`;
    const description = [
      title,
      `Method: ${def.method.toUpperCase()}`,
      `Path: ${def.rawPath}`,
      def.operation.description || "",
    ]
      .filter(Boolean)
      .join("\n");

    server.registerTool(
      def.toolName,
      {
        description,
        inputSchema: def.inputSchema,
      },
      async (args) => callOperation(def, args),
    );
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error(
    `keyso-api-mcp started. Registered ${definitions.length + 1} tools (${definitions.length} from OpenAPI + 1 generic).`,
  );
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
