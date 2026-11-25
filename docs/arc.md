# Arc on macOS

This checkout includes an opt-in Arc adaptation. It keeps the current upstream
MCP tools and connects to a running Arc instance. With `--arc`, `new_page`
creates a new tab through Arc's native AppleScript API, then attaches to that
exact tab through CDP. It never substitutes an existing tab or falls back to
CDP `Target.createTarget`.

Arc support is limited to the behavior verified on your installed Arc and
Chromium versions. The latest MCP tools can use protocol features that an
older Arc Chromium does not implement.

## Contents

- [Prepare Arc](#prepare-arc)
- [Build and configure the local server](#build-and-configure-the-local-server)
- [Behavior and limitations](#behavior-and-limitations)
- [Verify the adaptation](#verify-the-adaptation)
- [Troubleshooting and rollback](#troubleshooting-and-rollback)
- [Reapply after upstream updates](#reapply-after-upstream-updates)

## Prepare Arc

Use macOS with Arc installed. The server must run on the same machine as Arc
so native AppleScript and the loopback CDP connection control the same browser.

If Arc is not already running with remote debugging:

1. Save work and quit Arc manually using its menu. Closing its windows alone
   does not necessarily quit the application. Do not force-quit the browser.
2. Relaunch Arc with a local debugging port. For a standard installation:

   ```sh
   open -a /Applications/Arc.app --args \
     --remote-debugging-address=127.0.0.1 --remote-debugging-port=9222
   ```

3. Open a regular Arc window and keep it as Arc's front window. An incognito
   front window is rejected by native tab creation.
4. Check `http://127.0.0.1:9222/json/version` with an HTTP client. Confirm this
   endpoint belongs to the intended Arc instance; the response includes its
   Chromium version and `webSocketDebuggerUrl`. Do not expose the debugging
   port on a public network.

Starting an already running Arc with extra arguments may not enable debugging.
The MCP server does not quit or relaunch Arc for you. After saving work, you
can explicitly run `npm run arc:restart` to quit Arc normally and relaunch it
with loopback debugging on port 9222. An agent must have your authorization
before running this command; it never force-quits a browser that fails to exit.

macOS may request permission for your terminal or MCP client to control Arc.
Allow the intended host under **System Settings → Privacy & Security →
Automation**. Native tab creation requires that permission; failure is reported
rather than bypassed.

## Build and configure the local server

Follow the repository's [development setup](../CONTRIBUTING.md#installation)
and use its supported Node version. From the patched checkout:

```sh
npm run sync
npm run build
```

Configure the client to execute this checkout's compiled MCP entry. Replace
`<absolute-checkout-path>` with the actual absolute path, without angle
brackets; JSON clients do not generally expand shell variables or `~`.

```json
{
  "mcpServers": {
    "arc-devtools": {
      "command": "node",
      "args": [
        "<absolute-checkout-path>/out/Default/gen/src/bin/chrome-devtools-mcp.js",
        "--arc",
        "--browser-url=http://127.0.0.1:9222"
      ]
    }
  }
}
```

Alternatively, replace `--browser-url` with `--ws-endpoint` and the loopback
`webSocketDebuggerUrl` returned by `/json/version`. That WebSocket URL can
change when Arc restarts. Use exactly one endpoint option.

Restart the client's MCP server after changing the config or rebuilding.
Preserve compatible telemetry and other preferences from your existing config.

**The local entry is essential.** `npx chrome-devtools-mcp@latest` and official
pinned npm releases do not include your local modifications. Default plugin
server configurations also launch official npm packages: override or disable
that server entry for this Arc connection. Installing the maintenance skill
alone does not patch the server. Confirm the client starts the local entry.

## Behavior and limitations

- `arc` defaults to `false`; it is enabled explicitly by `--arc` or the
  corresponding config option.
- Arc mode requires macOS and an explicit loopback `browserUrl` or
  `wsEndpoint`. Invalid combinations fail before browser connection.
- Do not combine Arc mode with `autoConnect`, headless operation,
  `executablePath`, `isolated`, `userDataDir`, or an explicit `channel`
  override. The ordinary implicit `stable` default is allowed.
- Arc must already be running with a regular front window. The adapter does
  not launch Arc, create an initial window, or use an incognito window.
- `new_page` creates a new native tab. Existing blank tabs and the last tab
  are never reused. Subsequent navigation still uses the normal MCP tool flow.
  The adapter briefly serves a unique blank page on an ephemeral loopback
  HTTP port because Arc's native API rejects `about:blank`; the temporary
  server closes on success or failure.
- Internal `arc:` pages are filtered like internal `chrome:` pages, except
  inspection and new-tab pages; this also applies to navigation validation.
- Page listing in Arc mode does not initialize an unrelated selected tab;
  attachment happens when a page tool explicitly uses it. This avoids blocking
  enumeration on an inactive tab whose CDP initialization does not respond.
- `new_page` with `isolatedContext` fails before tab creation. Arc native tabs
  cannot honor Puppeteer isolated browser contexts.
- `background: true` restores Arc's previously selected tab after creation;
  the new tab may briefly become selected. MCP can still target the new page.
- Each native command and CDP target discovery have bounded timeouts.
  Failed creation never falls back to `browser.newPage()`; a timeout may leave
  a uniquely marked blank tab, which the error identifies for inspection.
- Tool availability does not imply every CDP operation works in Arc. Verify
  performance, memory, extension, emulation, and other advanced features
  individually on your Arc/Chromium version before relying on them.

## Verify the adaptation

After updating the patch, run the repository's generation, formatting, and
full test suite. Native smoke is a separate opt-in check against running Arc:

```sh
npm run gen
npm run format
npm run test
npm run arc:smoke -- --browser-url=http://127.0.0.1:9222
```

The smoke is intended to verify native new-tab creation and basic operations
without reusing the user's tabs. Run it only against the intended local Arc
instance. Record actual check results and the Arc/Chromium versions; automated
tests alone do not establish native compatibility.

Through the configured MCP client, inspect the available tools, list pages,
create a new page, and use its returned `pageId` for navigation and inspection.
Confirm existing tab identities/URLs remain unchanged and background creation
restores the previous native selection. Close only tabs created for testing.
Report each exercised feature separately. If Arc, its endpoint, or Automation
permission is unavailable, report the native check as blocked or unverified.

## Troubleshooting and rollback

- **Connection refused:** confirm Arc was manually quit before relaunching
  with debugging flags, and that the port matches the client config.
- **Unknown `--arc` option:** confirm the client runs the patched local build,
  then rebuild. An official npm or plugin server can ignore your source edits.
- **Native permission error:** grant Automation permission to the host that
  actually runs the server, then retry the requested action.
- **No regular front window:** open or select a normal Arc window manually.
- **Marker target timeout:** confirm CDP points to the same Arc instance that
  AppleScript controls. Do not retry creation blindly or navigate a different
  existing tab. Inspect any marker tab identified by the error.
- **Missing CDP method:** record the exact tool, error, and browser versions.
  Treat that feature as unsupported or unverified; do not remove current
  upstream tools or change vendored code to hide the failure.

Keep the previous working checkout/build and client config when updating.
To roll back, stop the replacement MCP server, restore that local entry/config,
and restart the client. Leave Arc and its profile data intact. If no prior
working build exists, disable the new server entry. Returning to ordinary
Chrome requires a deliberate Chrome configuration without `--arc`.

## Reapply after upstream updates

Use the [Arc compatibility maintenance skill](../skills/arc-compatibility/SKILL.md)
to inspect current upstream, port the browser delta, rebuild locally, and
report evidence and rollback. Copy the entire `skills/arc-compatibility`
directory into your agent's supported skills location if needed; its bundled
references travel with it.

The [original Arc fork](https://github.com/fukayatti/arc-devtools-mcp) documents
the CDP tab-creation problem. Its blank/last-tab reuse and final `newPage()`
fallback are intentionally rejected here because they break new-tab semantics
and retain the reported crash path.
