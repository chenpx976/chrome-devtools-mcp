# Arc on macOS

This [Arc fork](https://github.com/chenpx976/chrome-devtools-mcp/tree/arc-support)
is maintained on `arc-support` and distributed as
`@chenpx976/chrome-devtools-mcp`. It keeps the current upstream MCP tools
and connects to a running Arc instance. With `--arc`, `new_page`
creates a new tab through Arc's native AppleScript API, then attaches to that
exact tab through CDP. It never substitutes an existing tab or falls back to
CDP `Target.createTarget`.

Arc support is limited to the behavior verified on your installed Arc and
Chromium versions. The latest MCP tools can use protocol features that an
older Arc Chromium does not implement.

## Contents

- [Prepare Arc](#prepare-arc)
- [Build and configure the local server](#build-and-configure-the-local-server)
- [Use the published scoped package](#use-the-published-scoped-package)
- [Publish and verify the scoped package](#publish-and-verify-the-scoped-package)
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

Clone the maintained `arc-support` branch explicitly; the fork's default
`main` branch remains an upstream mirror:

```sh
git clone --branch arc-support https://github.com/chenpx976/chrome-devtools-mcp.git
cd chrome-devtools-mcp
```

Follow the repository's [development setup](../CONTRIBUTING.md#installation)
and use its supported Node version. From this patched checkout:

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

Use the local entry while developing or before publication. A published
package cannot include uncommitted local changes. The official unscoped
`chrome-devtools-mcp` package is not this Arc fork; never use it as a fallback.
Installing the maintenance skill alone does not patch the server. Confirm the
client starts the intended build or the verified scoped package below.

## Use the published scoped package

**Status: not yet published or verified.** Version `1.13.0` is the intended
first scoped release. The registry's scoped `/latest` lookup returned HTTP
404, and `npm whoami` returned `ENEEDAUTH`. npm account identity and ownership
of `@chenpx976` have not been verified. Use the local build until the first
public publish and installed-artifact checks pass.

After that verification, configure your MCP client with a pinned version:

```json
{
  "mcpServers": {
    "arc-devtools": {
      "command": "npx",
      "args": [
        "-y",
        "@chenpx976/chrome-devtools-mcp@1.13.0",
        "--arc",
        "--browser-url=http://127.0.0.1:9222"
      ]
    }
  }
}
```

Use `@latest` only when you deliberately want to follow this fork's npm
releases. Plugin manifests pin the scoped package but start in Chrome mode;
override their server arguments with `--arc` and your local endpoint. Remove
conflicting official-package entries, and preserve telemetry preferences.
Restart the MCP server after switching package versions or configurations.

Both binaries ship in this one package: `chrome-devtools-mcp` and
`chrome-devtools`. Do not install or publish a separate `chrome-devtools` alias
package. The MCP/tool names and CLI commands stay unchanged.

## Publish and verify the scoped package

Publication is a maintainer action; the instructions below do not indicate
that a release has already been published. Do not change the status above or
in the README until the registry and installed artifact have been verified.

1. Run `npm login --registry=https://registry.npmjs.org`, then `npm whoami`
   against that registry. Confirm the authenticated npm account owns the
   `chenpx976` user scope or has permission to publish in that organization
   scope. A GitHub username or repository ownership does not grant npm scope
   ownership. Resolve authentication/scope failures before publishing; never
   fall back to the official unscoped package.
2. From the intended `arc-support` release checkout, retain version `1.13.0`
   for the first release. Complete generation, formatting, tests, Arc smoke,
   and release build; run `npm run verify-npm-package` on the packed artifact.
   Confirm the package name, public access, repository, both executable
   entries, built files, and bundled Arc skill before the first publish.
3. Bootstrap the package with an authorized authenticated
   `npm publish --access public --registry=https://registry.npmjs.org` from
   that verified checkout. Complete npm's authentication/2FA requirements.
   Publish only `@chenpx976/chrome-devtools-mcp`; no alias package is released.
4. Once the package exists, configure its npm **Trusted Publisher** as GitHub
   Actions: organization/user `chenpx976`, repository `chrome-devtools-mcp`,
   workflow filename `publish-to-npm-on-tag.yml`. Leave the environment unset
   unless the workflow uses a matching GitHub environment. This enables
   subsequent releases through GitHub OIDC rather than a stored npm token.
   The workflow grants `id-token: write` and uses an OIDC-capable npm version.
5. Release automation tracks `arc-support` and retains tag names such as
   `chrome-devtools-mcp-v1.13.0`. When release-please uses the default
   `GITHUB_TOKEN`, its tag pushes do not trigger the publishing workflow.
   Manually dispatch `publish-to-npm-on-tag.yml` with the release tag selected,
   or configure `RELEASE_PLEASE_TOKEN` with permission to trigger workflows.
   Never republish the bootstrapped `1.13.0`; publish a new version for the
   next release. GitHub OIDC setup alone does not prove a publish succeeded.
6. Query the published artifact, then install that exact version into a clean
   temporary directory without using the source checkout. Replace
   `<temporary-directory>` with that directory's actual path before running:

   ```sh
   npm view @chenpx976/chrome-devtools-mcp@1.13.0 name version bin dist.integrity repository --json
   npm install --prefix <temporary-directory> @chenpx976/chrome-devtools-mcp@1.13.0
   ```

   Inspect the installed package's `package.json` for the scoped name and
   expected version. Run its `chrome-devtools-mcp --help` and
   `chrome-devtools --help` through that directory's `node_modules/.bin`,
   confirm `--arc` is exposed, and launch the installed MCP binary through a
   real client with the Arc config above. Verify the tool inventory, native
   new-tab identity, background selection, and preservation of existing tabs.
   Record the registry integrity, installed path, versions, and observed
   results. A local source-build smoke is not installed-package verification.

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
- **Unknown `--arc` option:** confirm the client runs this fork's local build
  or verified scoped package. Rebuild local code or inspect the installed
  version; an official npm server cannot use this fork's Arc adaptation.
- **Scoped package not found or access denied:** check publication status,
  registry, exact version, and npm scope permissions. Use the local build
  until resolved; do not install the official npm package as a substitute.
- **Native permission error:** grant Automation permission to the host that
  actually runs the server, then retry the requested action.
- **No regular front window:** open or select a normal Arc window manually.
- **Marker target timeout:** confirm CDP points to the same Arc instance that
  AppleScript controls. Do not retry creation blindly or navigate a different
  existing tab. Inspect any marker tab identified by the error.
- **Missing CDP method:** record the exact tool, error, and browser versions.
  Treat that feature as unsupported or unverified; do not remove current
  upstream tools or change vendored code to hide the failure.

Keep the previous working checkout/build or pinned scoped version and client
config when updating. To roll back, stop the replacement MCP server, restore
that entry/version and config, and restart the client. Leave Arc and its
profile data intact. If no prior working build exists, disable the new entry.
Returning to ordinary Chrome requires a deliberate configuration without
`--arc`; the official npm package is not an Arc rollback.

## Reapply after upstream updates

Use the [Arc compatibility maintenance skill](../skills/arc-compatibility/SKILL.md)
to inspect current upstream, port the browser delta, rebuild locally, and
report evidence and rollback. Copy the entire `skills/arc-compatibility`
directory into your agent's supported skills location if needed; its bundled
references travel with it.

Fetch updates from [official upstream](https://github.com/ChromeDevTools/chrome-devtools-mcp)
and integrate them into `arc-support`, retaining the fork's scoped identity.
Review package/lockfile names, `server.json`, release metadata, npm update
checks, plugin manifests, installation snippets, and the single-package
publish workflow after every merge. Preserve `@chenpx976/chrome-devtools-mcp`,
the fork repository/publisher settings, both existing bin names, and the Arc
adapter. Keep upstream attribution and source citations intact. Verify the
new packed/installed artifact before changing client pins or claiming a
release is ready.

The [original Arc fork](https://github.com/fukayatti/arc-devtools-mcp) documents
the CDP tab-creation problem. Its blank/last-tab reuse and final `newPage()`
fallback are intentionally rejected here because they break new-tab semantics
and retain the reported crash path.
