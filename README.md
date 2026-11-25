# Chrome DevTools for agents — Arc fork

This is the [chenpx976 Arc fork](https://github.com/chenpx976/chrome-devtools-mcp/tree/arc-support),
maintained on `arc-support`, of
[ChromeDevTools/chrome-devtools-mcp](https://github.com/ChromeDevTools/chrome-devtools-mcp).
It preserves the upstream Chrome DevTools tools and adds opt-in macOS Arc support.
The npm distribution is `@chenpx976/chrome-devtools-mcp`; executable names remain
`chrome-devtools-mcp` and `chrome-devtools`.

**Publication status: `1.13.0` published and verified on 2026-11-25.**
The scoped installation commands below are ready to use. For development, use
the [local build setup](./docs/arc.md#build-and-configure-the-local-server).
See [publishing and verification](./docs/arc.md#publish-and-verify-the-scoped-package)
for npm authentication, scope ownership, and release requirements.

Chrome DevTools for agents lets your coding agent (such as Antigravity, Claude, Cursor or Copilot)
control and inspect a live Chrome browser. It is available as a
Model-Context-Protocol (MCP) server and as a [CLI][cli]. Both give your AI
coding assistant access to the full power of Chrome DevTools for reliable
automation, in-depth debugging, and performance analysis.

[Tool reference][tool-reference] | [CLI][cli] | [Skills][skills] | [Changelog][changelog] | [Contributing][contributing] | [Troubleshooting][troubleshooting] | [Design Principles][design-principles]

## Key features

- **Get performance insights**: Uses [Chrome
  DevTools](https://github.com/ChromeDevTools/devtools-frontend) to record
  traces and extract actionable performance insights.
- **Advanced browser debugging**: Analyze network requests, take screenshots and
  check browser console messages (with source-mapped stack traces).
- **Reliable automation**. Uses
  [puppeteer](https://github.com/puppeteer/puppeteer) to automate actions in
  Chrome and automatically wait for action results.

## Disclaimers

`chrome-devtools-mcp` exposes content of the browser instance to the MCP clients
allowing them to inspect, debug, and modify any data in the browser or DevTools.
Avoid sharing sensitive or personal information that you don't want to share with
MCP clients.

The upstream project officially supports Google Chrome and
[Chrome for Testing](https://developer.chrome.com/blog/chrome-for-testing/).
This fork adds an opt-in Arc adaptation with support limited to the behavior
verified on your installed Arc and Chromium versions. Other Chromium-based
browsers may work, but compatibility is not guaranteed.

See [Arc setup](./docs/arc.md) for local builds, the scoped npm package, and
browser compatibility verification.

Performance tools may send trace URLs to the Google CrUX API to fetch real-user
experience data. This helps provide a holistic performance picture by
presenting field data alongside lab data. This data is collected by the [Chrome
User Experience Report (CrUX)](https://developer.chrome.com/docs/crux). To disable
this, run with the `--no-performance-crux` flag.

## **Usage statistics**

Google collects usage statistics (such as tool invocation success rates, latency, and environment information) to improve the reliability and performance of Chrome DevTools MCP.

Data collection is **enabled by default**. You can opt-out by passing the `--no-usage-statistics` flag when starting the server:

```json
"args": ["-y", "@chenpx976/chrome-devtools-mcp@latest", "--no-usage-statistics"]
```

Google handles this data in accordance with the [Google Privacy Policy](https://policies.google.com/privacy).

Google's collection of usage statistics for Chrome DevTools MCP is independent from the Chrome browser's usage statistics. Opting out of Chrome metrics does not automatically opt you out of this tool, and vice-versa.

Collection is disabled if `CHROME_DEVTOOLS_MCP_NO_USAGE_STATISTICS` or `CI` env variables are set.

## Update checks

By default, the server periodically checks the npm registry for updates and logs a notification when a newer version is available.
You can disable these update checks by setting the `CHROME_DEVTOOLS_MCP_NO_UPDATE_CHECKS` environment variable.

## Requirements

- [Node.js](https://nodejs.org/) [LTS](https://github.com/nodejs/Release#release-schedule) version.
- [Chrome](https://www.google.com/chrome/) current stable version or newer.
- [npm](https://www.npmjs.com/)

## Getting started

After publication is verified, add the following config to your MCP client.
For Arc, use the [Arc configuration](./docs/arc.md), which adds `--arc` and an
explicit local debugging endpoint:

```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": ["-y", "@chenpx976/chrome-devtools-mcp@latest"]
    }
  }
}
```

> [!NOTE]
> `@chenpx976/chrome-devtools-mcp@latest` follows this fork's latest npm release.
> Pin a verified version for reproducible setups. Never substitute the official
> unscoped npm package for an Arc connection.

### MCP Client configuration

For setup instructions specific to your editor or agent (e.g. Antigravity, Claude Code, Cursor, VS Code), please see our [Client Configurations Guide][client-configurations-guide].

### Your first prompt

Enter the following prompt in your MCP Client to check if everything is working:

```
Check the performance of https://developers.chrome.com
```

Your MCP client should open the browser and record a performance trace.

> [!NOTE]
> The MCP server will start the browser automatically once the MCP client uses a tool that requires a running browser instance. Connecting to the Chrome DevTools MCP server on its own will not automatically start the browser.

## CLI

The package also includes the `chrome-devtools` CLI. Use it to control the browser from your terminal without MCP:

```sh
npm i @chenpx976/chrome-devtools-mcp@latest -g
chrome-devtools navigate_page 1 --url "https://developers.chrome.com"
chrome-devtools take_screenshot 1 --filePath screenshot.png
chrome-devtools stop
```

See the [CLI guide][cli] for all commands and options.

## Skills

The package includes [skills](./skills) that teach your agent how to use Chrome DevTools:

| Skill                                                     | Use it to                                                |
| --------------------------------------------------------- | -------------------------------------------------------- |
| [`chrome-devtools`](./skills/chrome-devtools)             | Debug and automate pages with the MCP tools.             |
| [`chrome-devtools-cli`](./skills/chrome-devtools-cli)     | Run the CLI and write shell scripts with it.             |
| [`a11y-debugging`](./skills/a11y-debugging)               | Audit and fix accessibility issues.                      |
| [`cookie-debugging`](./skills/cookie-debugging)           | Debug cookies, sessions, and authentication.             |
| [`debug-optimize-lcp`](./skills/debug-optimize-lcp)       | Debug and improve Largest Contentful Paint.              |
| [`memory-leak-debugging`](./skills/memory-leak-debugging) | Find and fix memory leaks.                               |
| [`troubleshooting`](./skills/troubleshooting)             | Fix connection problems between MCP and Chrome.          |
| [`arc-compatibility`](./skills/arc-compatibility)         | Reapply and verify the Arc patch after upstream updates. |

### Install skills as a plugin

After the scoped package is published, a plugin installs the MCP server and
all skills, including the CLI skill. Use this fork's `arc-support` revision
when selecting or checking out the plugin source:

- **Claude Code:** Run `/plugin marketplace add https://github.com/chenpx976/chrome-devtools-mcp.git#arc-support`, then `/plugin install chrome-devtools-mcp@chrome-devtools-plugins`.
- **Copilot / VS Code:** Run **Chat: Install Plugin From Source** and select `chenpx976/chrome-devtools-mcp` at `arc-support`. If the client cannot select a branch, install from a local checkout of that branch.
- **Gemini CLI:** Run `gemini extensions install --auto-update https://github.com/chenpx976/chrome-devtools-mcp --ref arc-support`.

Plugin server defaults launch the scoped package in Chrome mode. For Arc,
configure `--arc` and the explicit loopback endpoint as in [Arc setup](./docs/arc.md).

See the [Client Configurations Guide][client-configurations-guide] for more information.

### Install skills manually

If your agent does not support plugins, copy the skill folders into the skills directory of your agent. The npm package contains the skills:

```sh
npm i @chenpx976/chrome-devtools-mcp@latest -g
# Example for Claude Code. Use the skills directory of your agent.
mkdir -p ~/.claude/skills
cp -R "$(npm root -g)/@chenpx976/chrome-devtools-mcp/skills/chrome-devtools-cli" ~/.claude/skills/
```

> [!IMPORTANT]
> The `chrome-devtools-cli` skill requires the CLI. Install the package globally before you use the skill.

### Keep skills up to date

Skills describe the tools of a specific version. Update the skills each time you update the MCP server or the CLI. Outdated skills can tell your agent to use tools or parameters that changed.

- **Plugins:** Use the update command of the plugin manager of your agent. The Gemini CLI command above enables automatic updates with `--auto-update`.
- **Manual installs:** Update the package, then copy the skill folders again:

```sh
npm i @chenpx976/chrome-devtools-mcp@latest -g
mkdir -p ~/.claude/skills
cp -R "$(npm root -g)/@chenpx976/chrome-devtools-mcp/skills/chrome-devtools-cli" ~/.claude/skills/
```

## Tools

If you run into any issues, checkout our [troubleshooting guide][troubleshooting].
See the full [Tool Reference][tool-reference] for a complete list of all supported MCP capabilities.

## Configuration

Find the complete list of server parameters (e.g., `--headless`, `--isolated`, `--slim`) and how to configure WebSocket connections in the [Configuration Guide][configuration-guide].

For basic browser tasks only, the `--slim` flag exposes a reduced set of tools. See the [Slim tool reference][slim-tool-reference].

## Advanced Usage

For advanced features such as handling concurrent sessions, persistent user data directories, using a custom or non-standard browser path (`--executablePath`), connecting to a running Chrome instance instead of starting a new one, or debugging on Android, see our [Advanced Usage Guide][advanced-usage-guide].

## Integrating as a browser subagent

If you are developing agentic tooling and want to provide an integrated browser subagent as part of your product, we recommend building on top of Chrome DevTools for agents.

For a reference implementation, see the [Gemini CLI browser agent documentation](https://geminicli.com/docs/core/subagents/#browser-agent).

[advanced-usage-guide]: ./docs/advanced-usage.md
[changelog]: ./CHANGELOG.md
[cli]: ./docs/cli.md
[client-configurations-guide]: ./docs/client-configurations.md
[configuration-guide]: ./docs/configuration.md
[contributing]: ./CONTRIBUTING.md
[design-principles]: ./docs/design-principles.md
[skills]: #skills
[slim-tool-reference]: ./docs/slim-tool-reference.md
[tool-reference]: ./docs/tool-reference.md
[troubleshooting]: ./docs/troubleshooting.md
