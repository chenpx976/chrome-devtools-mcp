---
name: arc-compatibility
description: >-
  Maintains the macOS Arc compatibility patch on current chrome-devtools-mcp.
  Use when asked to adapt Chrome DevTools MCP to Arc, reapply the Arc patch
  after an upstream update, or configure and verify a locally patched Arc MCP
  server. Preserves upstream tools, native new-tab behavior, and rollback.
  Does not apply to ordinary page debugging or unmodified Chrome setup.
compatibility: >-
  Requires a chrome-devtools-mcp source checkout. Native verification requires
  macOS, Arc with local remote debugging, and macOS Automation permission.
---

# Arc compatibility maintenance

Port the browser adaptation onto the requested upstream revision, build that
checkout, connect the client to its local output, and verify native behavior.
Treat this as a workflow-process skill. Read repository instructions before
changing code; interpret source paths below relative to the repository root.

Load bundled references as needed:

- Read [compatibility contract](references/compatibility.md) before porting.
- Read [example workflows](references/workflows.md) for failure recovery,
  guarded setup, and rejected approaches.
- Use [the output contract](references/output-contract.md) for every handoff.
- Consult [source provenance](SOURCES.md) when revisiting a design decision.

## 1. Establish the baseline

1. Record the current checkout revision, upstream origin and requested target
   revision, package version, Node requirement, and existing local changes.
   Resolve a request for "latest" against official upstream tags/releases or
   its current branch; record the exact resulting commit. Do not infer
   currency from the npm version alone.
2. Preserve the known-good patched checkout and current client server config.
   Work on a separate branch or checkout when local work would otherwise be
   overwritten. Do not reset, clean, or discard unrelated changes.
3. Inspect current `package.json`, `AGENTS.md`, build registrations, CLI/config
   definitions, browser connection ownership, and page lifecycle. Start from
   `src/BrowserManager.ts` and `src/McpContext.ts`; locate their replacements
   if upstream moved them. Read current callers before changing interfaces.
4. Record Arc's app version and Chromium/CDP version separately. Inspect the
   installed app bundle's `Contents/Resources/Arc.sdef`. Do not assume that a
   newer upstream Puppeteer supports every protocol command in installed Arc.
5. Identify the MCP client config and the actual spawned server entry point.
   Preserve an existing local configuration when it already meets the contract.

## 2. Port only the Arc delta

1. Compare the previous patch with the new upstream implementation. Retain
   current upstream tools, schemas, page IDs, collectors, task queues,
   reconnection handling, lazy browser loading, and generated interfaces.
   Do not replace whole files with the old fork's implementations.
2. Add or preserve opt-in `arc`, default `false`, across CLI/config plumbing
   and early validation. Reuse existing `browserUrl`/`wsEndpoint` connection
   handling. Apply the exact constraints in the compatibility contract.
3. Keep native tab creation in `src/ArcBrowser.ts` (or the current equivalent)
   and call it from `McpContext.newPage`. Preserve common page initialization
   and return types. Create a new native tab with a unique marker, then attach
   to its matching CDP target; never select a pre-existing tab as a substitute.
4. Preserve foreground/background behavior and reject `isolatedContext`
   before creating anything. Keep all native errors explicit. Never introduce
   a `browser.newPage()` or `Target.createTarget` fallback in Arc mode.
5. Update the affected source/tests build registrations, config tests, native
   adapter tests, opt-in smoke script, and user documentation. Follow current
   repository patterns; do not edit vendored dependencies to mask an Arc gap.

## 3. Prepare the local runtime

1. Install/sync dependencies using the checkout's documented package scripts.
   Use the repository's supported Node version, lockfile, and submodule pins.
2. Locate Arc by its application identity, `company.thebrowser.Browser`.
   Require a running normal Arc window and a loopback debugging endpoint.
   If Arc needs remote debugging enabled, have the user save work and quit it
   manually, or obtain explicit permission for `npm run arc:restart`. Reuse
   permission already granted in the session. Never force-quit Arc or restart
   the user's main browser without authorization.
3. Keep the endpoint local. Do not expose a public listener or tunnel to a
   different machine: native AppleScript and CDP must control the same Arc.
4. Configure the client to run `node` with the absolute path to this checkout's
   built MCP entry, plus `--arc` and its explicit loopback endpoint. Resolve
   the entry from `package.json`'s `bin` field; the current entry is
   `out/Default/gen/src/bin/chrome-devtools-mcp.js`.
5. Remove or override conflicting client entries that launch the official npm
   package for this Arc connection. `npx chrome-devtools-mcp@latest`, pinned
   official packages, and default plugin server commands do not contain local
   edits. Installing this skill alone does not patch an MCP server.
6. Preserve the user's telemetry and other compatible preferences. Restart
   only the MCP client/server as needed after building; leave Arc running.

## 4. Validate after integration

Run these steps from the patched repository after all code changes land:

```sh
npm run gen
npm run format
npm run test
npm run arc:smoke -- --browser-url=http://127.0.0.1:9222
```

Confirm script names and arguments against the target revision first. `gen`
currently builds and generates CLI/docs/metrics and also formats; keep the
explicit formatting step required by the repository checklist. `test` builds
and runs the full suite. Keep generated files with the patch.

Use the opt-in native smoke only against the user's intended Arc instance.
Verify new tab identity, preservation of pre-existing tabs/URLs, background
selection, basic page operations, and cleanup of only smoke-owned tabs.
Exercise the built server through the real client to confirm its entry point
and current advertised tool schemas. Keep unsupported isolation and invalid
config checks in deterministic tests so they cannot mutate the real session.

Do not replace a failing command with a success claim or a smaller suite.
Classify the failure, fix its cause, and rerun affected checks; run the full
suite after code changes needed for acceptance. If macOS, Arc, permission, or
an endpoint is unavailable, finish reachable checks and report native smoke
as unverified with the exact missing prerequisite. Do not call this full Arc
compatibility merely because generation or unit tests passed.

## 5. Report and retain rollback

Use the output contract to separate verified behavior, unsupported behavior,
failed checks, and unverified CDP features. Include the exact upstream commit,
local build entry, versions, and check evidence. State only observed results.

Keep the previous working checkout/build and client configuration until the
replacement is verified. To roll back, stop the replacement MCP server,
restore the prior local server entry/config, and restart the client. Leave
Arc tabs and profile data intact. To return to ordinary Chrome operation,
remove `--arc` and select a Chrome configuration deliberately; do not silently
redirect the Arc workflow to the official npm package.
