const path = require("path");
const { Client } = require("@modelcontextprotocol/sdk/client/index.js");
const { StdioClientTransport } = require("@modelcontextprotocol/sdk/client/stdio.js");

const ROOT_DIR = path.resolve(__dirname, "..");
const SERVER_ENTRY = path.join(ROOT_DIR, "src", "index.js");
const EXPECTED_MIN_TOOLS = 151;

async function main() {
  const client = new Client(
    {
      name: "keyso-smoke-test",
      version: "1.0.0",
    },
    {
      capabilities: {},
    },
  );

  const transport = new StdioClientTransport({
    command: "node",
    args: [SERVER_ENTRY],
    cwd: ROOT_DIR,
    env: {
      KEYSO_TOKEN: process.env.KEYSO_TOKEN || "",
    },
    stderr: "pipe",
  });

  let stderr = "";
  transport.stderr?.on("data", (chunk) => {
    stderr += chunk.toString();
  });

  try {
    await client.connect(transport);

    const serverInfo = client.getServerVersion();
    const toolsResult = await client.listTools();
    const toolNames = toolsResult.tools.map((tool) => tool.name);

    if (!toolNames.includes("keyso_api_request")) {
      throw new Error("Smoke test failed: keyso_api_request is missing from listTools()");
    }

    if (toolNames.length < EXPECTED_MIN_TOOLS) {
      throw new Error(
        `Smoke test failed: expected at least ${EXPECTED_MIN_TOOLS} tools, got ${toolNames.length}`,
      );
    }

    console.log(
      JSON.stringify(
        {
          ok: true,
          server: serverInfo,
          toolCount: toolNames.length,
          hasGenericTool: true,
        },
        null,
        2,
      ),
    );
  } catch (error) {
    if (stderr.trim()) {
      console.error("Server stderr:");
      console.error(stderr.trim());
    }

    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  } finally {
    await transport.close().catch(() => {});
    await client.close().catch(() => {});
  }
}

main();
