# Changelog

## Unreleased

### Added

- Added MCP client handshake smoke-test in [scripts/smoke-mcp.js](/Users/alexanderbukreev/git/keyso-mcp/scripts/smoke-mcp.js).
- Added `npm run smoke:mcp` in [package.json](/Users/alexanderbukreev/git/keyso-mcp/package.json) to validate `initialize` and `listTools`.
- Added practical documentation in [README.md](/Users/alexanderbukreev/git/keyso-mcp/README.md):
  - `Quick Start`
  - skill usage examples
  - MCP-only usage examples
  - common scenarios
  - post-setup verification steps

### Fixed

- Fixed MCP startup failure in [src/index.js](/Users/alexanderbukreev/git/keyso-mcp/src/index.js) caused by incompatible `zod` schema serialization for object-like params and request bodies.

### Verified

- Verified local MCP server startup with 151 registered tools.
- Verified real client/server handshake via smoke-test:
  - `initialize` succeeds
  - `listTools` succeeds
  - `keyso_api_request` is present
  - the full tool surface is visible to the client

### Related Commits

- `07581fc` `Fix MCP schema compatibility and expand README`
- `1f9d6e3` `Add MCP handshake smoke test`
