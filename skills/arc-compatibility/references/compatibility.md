# Compatibility contract

## Distribution identity

- Maintain `chenpx976/chrome-devtools-mcp` on `arc-support`; fetch actual
  upstream changes from `ChromeDevTools/chrome-devtools-mcp`.
- Keep npm identity `@chenpx976/chrome-devtools-mcp` across package/lockfile,
  server registry metadata, plugins, update checks, docs, and release workflows.
  Preserve executable names `chrome-devtools-mcp` and `chrome-devtools`,
  unscoped plugin identifiers, protocol names, and upstream attribution.
- Publish only the scoped main package, which includes both binaries. Do not
  recreate the separate CLI alias publish step during an upstream merge.
- Use a local build until the public scoped artifact is verified. Never
  replace a missing/unpublished scoped package with the official npm package.
- Verify a clean installation of the exact scoped release, including both
  binaries and the actual client's Arc behavior. Registry metadata and a
  passing local smoke alone do not prove the installed artifact works.
- Bootstrap publication only after npm login and scope permission checks.
  Subsequent npm trusted publishing uses GitHub owner `chenpx976`, repository
  `chrome-devtools-mcp`, workflow `publish-to-npm-on-tag.yml`. Retain OIDC
  permissions and release-tag dispatch behavior documented in `docs/arc.md`.

## Configuration and connection

- Keep `arc` opt-in and `false` by default. Normal Chrome behavior must remain
  available without the flag.
- Require macOS and exactly one explicit loopback `browserUrl` or `wsEndpoint`.
  Reject invalid configuration before attempting a browser connection.
- Reject `autoConnect`, headless launch, `executablePath`, `isolated`,
  `userDataDir`, and an explicitly overridden `channel`. An implicit default
  `stable` channel must not make otherwise valid Arc configuration fail.
- Keep established endpoint parsing and connection handling in
  `src/BrowserManager.ts`. Do not add a second Puppeteer connection lifecycle.
- Require the endpoint and native application to identify the same local Arc
  instance. A loopback address alone does not prove browser identity.
- Preserve config reload/restart rules and generated option documentation when
  porting the flag. Do not defer config validation until `new_page` runs.
- Keep Arc enumeration lazy: do not initialize a previously untouched selected
  page just to list targets. Page tools and explicit creation initialize the
  page they use; a nonresponsive inactive tab must not block all tool calls.

## Native tab creation

Use application ID `company.thebrowser.Browser`. Discover the installed app
bundle to read `Contents/Resources/Arc.sdef`; avoid a host-specific app path
in implementation and maintenance instructions. The inspected dictionary
supports window `incognito`, window `active tab`, tab `id`/`URL`, `select`, and:

```applescript
tell application id "company.thebrowser.Browser"
  tell front window
    make new tab with properties {URL: marker}
  end tell
end tell
```

Treat this as a native API illustration, not a complete adapter. Preserve the
running-application check, normal-front-window check, selection handling,
parameter passing, deadlines, and CDP target correlation around it.

Keep the following invariants:

1. Require Arc to be running with an existing regular front window. Fail for
   no window or an incognito front window; do not auto-launch or change windows.
2. Reject any `isolatedContext` request before native or CDP state changes.
   A regular Arc window cannot honor Puppeteer isolated browser contexts.
3. Serve a unique `/chrome-devtools-mcp-<UUID>` blank page on a temporary
   HTTP server bound to `127.0.0.1` with an ephemeral port; close it on every
   success/error path. Arc 1.108 rejects `about:blank` in native tab creation.
   Stop listening, close all marker-server connections, then await closure;
   browser preconnections or incomplete requests can otherwise hang disposal.
   Pass marker URLs and selection IDs as process arguments to fixed
   AppleScript; never interpolate user URLs into script source or a shell.
4. Create exactly one new native tab and correlate the exact marker to a new
   page target on the connected browser. Preserve upstream page initialization,
   collector registration, page IDs, and tool navigation after attachment.
5. For `background: true`, capture the prior window/tab IDs and restore that
   tab after CDP attachment. Use direct window/tab index specifiers; the
   installed Arc returns invalid cached object specifiers and does not reliably
   resolve immediate `whose URL` queries. Distinguish Arc's visible selected
   tab from MCP's logical selected page; brief new-tab selection can occur.
6. Bound each native command and target discovery (currently 10 seconds each).
   Never retry tab creation after uncertain completion; report its marker URL
   so the user can identify any leftover tab without touching other tabs.
7. On errors, do not reuse an existing blank/last tab or invoke Puppeteer
   `newPage()`/CDP `Target.createTarget`. Never silently ignore native failures.

## Upstream preservation and verification

Keep all current tool definitions and their option gates. Arc changes how a
new tab is created; it does not guarantee support for every CDP command.
Inspect the installed Chromium version and test each feature before claiming
it works. Advanced tracing, screencast, memory, extension, emulation, and newer
protocol operations remain unverified unless explicitly exercised.

Use focused tests for endpoint/config rejection, native process failure,
permission denial, missing/incognito window, marker timeout, background
restoration, isolation rejection, and unchanged Chrome behavior. Test that
forbidden creation branches are not called. Keep live-browser verification
for behavior mocks cannot prove: native tab identity and selection, target
attachment, real tool operations, and preservation of existing tabs.

## Rejected legacy behavior

The [original fork](https://github.com/fukayatti/arc-devtools-mcp) documents
Arc crashes on `Target.createTarget`. Its `McpContext.newPage` first returns
an existing `about:blank` page, otherwise the last existing page, and finally
calls `browser.newPage()` if none exists. Reject all three branches for this
adaptation: reuse violates new-tab semantics and can navigate a user's tab;
the fallback reaches the operation the fork reports as crash-prone.

Use that fork as historical evidence of the failure mode. Do not copy its
older tools, dependencies, page lifecycle, or broad compatibility claims.
