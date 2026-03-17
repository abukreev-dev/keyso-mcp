const fs = require("fs");
const path = require("path");

const DOCS_URL = process.env.KEYSO_APIDOC_URL || "https://apidoc.keys.so";
const OUTPUT = path.resolve(__dirname, "..", "openapi.json");

async function main() {
  const response = await fetch(DOCS_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${DOCS_URL}: ${response.status}`);
  }

  const html = await response.text();
  const match = html.match(/const __redoc_state = (\{[\s\S]*?\});\s*Redoc\.hydrate/);
  if (!match) {
    throw new Error("Cannot find __redoc_state in apidoc page");
  }

  const state = JSON.parse(match[1]);
  const spec = state?.spec?.data;
  if (!spec || !spec.paths) {
    throw new Error("OpenAPI spec not found in __redoc_state.spec.data");
  }

  fs.writeFileSync(OUTPUT, JSON.stringify(spec, null, 2));
  console.log(`Saved ${Object.keys(spec.paths).length} paths to ${OUTPUT}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
