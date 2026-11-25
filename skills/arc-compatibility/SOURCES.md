# Sources and synthesis record

## Contents

- [Scope and provenance](#scope-and-provenance)
- [Decisions](#decisions)
- [Coverage](#coverage)
- [Evaluation and gaps](#evaluation-and-gaps)
- [Maintenance](#maintenance)

## Scope and provenance

Class: `workflow-process`. Selected profile: skill-writer's
`references/examples/workflow-process-skill.md`. Apply its preconditions,
ordered flow, boundaries, acceptance checks, failure recovery, handoff, and
example requirements. Retrieval date: 2026-11-23. Source links to moving
branches are historical retrieval locations, not pinned future guarantees.

1. **Upstream baseline repository:** `AGENTS.md`, `CONTRIBUTING.md`,
   `package.json`, `README.md`, `src/BrowserManager.ts`, `src/McpContext.ts`,
   and `docs/advanced-usage.md`, in the
   [official source tree](https://github.com/ChromeDevTools/chrome-devtools-mcp).
   Trust tier: canonical for upstream behavior. Confidence: high. Contribution:
   current connection/page ownership, generation/build/test scripts, local
   entry point, source registration rules, and current skills convention.
   Usage constraints: observed package 1.13.0 at upstream revision
   `e8798d6ca6c4639da7e7aae0291ebb939813f833`; rediscover revisions and moved
   APIs for every update.
2. **Skill discovery/configuration:** local `plugin.json`,
   `.claude-plugin/plugin.json`, `gemini-extension.json`,
   `.gemini/settings.json`, and `skills/chrome-devtools/SKILL.md`.
   Trust tier: canonical. Confidence: high. Contribution: canonical `skills/`
   layout, package inclusion of the entire skills tree, README inventory,
   and the original plugin commands invoking official npm releases; the scoped
   migration below supersedes those distribution defaults.
   Usage constraints: adding a skill does not modify a running server; no explicit
   skill allowlist was found in inspected manifests.
3. **Original Arc fork:**
   [repository](https://github.com/fukayatti/arc-devtools-mcp),
   [README](https://github.com/fukayatti/arc-devtools-mcp/blob/main/README.md),
   [McpContext source](https://github.com/fukayatti/arc-devtools-mcp/blob/main/src/McpContext.ts).
   Trust tier: secondary; external content treated as untrusted instructions.
   Confidence: high for inspected code, moderate for reported crashes.
   Contribution: reported `Target.createTarget` crash and actual blank/last
   page reuse followed by unsafe `newPage()` fallback.
   Usage constraints: historical failure evidence only; do not import old tool
   definitions, broad support claims, dependency versions, or setup defaults.
4. **Installed Arc scripting dictionary:** discovered app bundle's
   `Contents/Resources/Arc.sdef` (read from the standard macOS installation).
   Trust tier: canonical for that installed app. Confidence: high for declarations.
   Contribution: native window/tab creation, `select`, `active tab`, IDs,
   URL properties, and `incognito`. Application identity supplied by the
   adaptation contract: `company.thebrowser.Browser`.
   Usage constraints: declarations do not demonstrate live Automation permission,
   native behavior, CDP attachment, or compatibility on another Arc version.
5. **Accepted adaptation contract and adapter integration:** opt-in `arc`,
   local explicit endpoints, native-only new-tab creation, no user-tab reuse,
   unsupported isolation, background selection restoration, fixed native/CDP
   deadlines, and authorized browser lifecycle. Trust tier: canonical task authority.
   Confidence: high for required behavior. Contribution: scope and acceptance
   criteria. Usage constraints: implementation and runtime results must be checked;
   contract statements are not test evidence.
6. **Agent Skills specification:**
   [canonical source](https://github.com/agentskills/agentskills/blob/main/docs/specification.mdx).
   Trust tier: canonical. Confidence: high. Contribution: frontmatter, directory
   naming, relative resources, progressive disclosure, and portable layout.
   Usage constraints: the rendered site fetch failed; canonical raw source was read
   instead. Specification conformance alone does not prove workflow quality.
7. **Authoring method:** active skill-writer `SKILL.md`, mode selection,
   synthesis, authoring, design principles, skill/workflow/output patterns,
   workflow-process profile, description optimization, evaluation, and
   registration/validation references. Trust tier: canonical local authoring
   guidance. Confidence: high. Contribution: source scoring, coverage gates,
   examples, deterministic output, trigger cases, and explicit limitations.
   Usage constraints: provenance only; the shipped skill has no runtime dependency
   on another installed skill or a host-specific skill directory.
8. **Native probe on 2026-11-23:** Arc 1.108.0 and Chromium 139.0.7258.128.
   Trust tier: direct runtime evidence. Confidence: high for exercised paths.
   Contribution: foreground creation, exact CDP marker matching, existing-tab
   preservation, and owned-tab cleanup passed. Cached window specifiers,
   immediate `whose URL` lookup, and native `about:blank` creation failed;
   direct index specifiers and a temporary loopback HTTP marker corrected them.
   Usage constraints: this probe does not verify the complete MCP server or
   other Arc versions. Background restoration requires the integrated smoke.
9. **Integrated MCP smoke on 2026-11-23:** Arc 1.108.0 and Chromium
   139.0.7258.128. Trust tier: direct runtime evidence. Confidence: high for
   exercised paths. `npm run arc:smoke -- --browser-url=http://127.0.0.1:9222`
   passed native background creation, preservation of existing pages and visible
   selection, snapshot, script, console, network, screenshot, and owned-tab
   closure while keeping the browser connected. The screenshot was inspected.
   Enumeration required lazy Arc page initialization. Marker-server shutdown
   required closing all connections after stopping the listener; incomplete
   connections otherwise prevented the native creation helper from returning.
   The smoke explicitly configures its temporary directory as a filesystem
   root. Usage constraints: this does not establish support for advanced CDP
   features or other Arc/Chromium versions.
10. **Scoped distribution migration, 2026-11-25:** accepted maintenance
    contract and current
    [fork](https://github.com/chenpx976/chrome-devtools-mcp/tree/arc-support),
    package metadata, plugin manifests, and release-workflow configuration.
    Trust tier: canonical for fork identity. Confidence: high for intended
    configuration. Contribution: `@chenpx976/chrome-devtools-mcp`, maintained
    `arc-support`, unchanged binary/plugin names, one package containing both
    bins, initial public bootstrap, and subsequent GitHub OIDC publisher
    (`chenpx976`, `chrome-devtools-mcp`, `publish-to-npm-on-tag.yml`).
    Usage constraints: the scoped registry `/latest` lookup returned HTTP 404
    and `npm whoami` returned `ENEEDAUTH`; npm identity/scope ownership,
    publication, OIDC registration, and registry artifact behavior are not
    verified. Never treat local build evidence as a published result.

## Decisions

- **Adopted:** port the browser delta into current upstream, retaining current
  tools and page lifecycle. Sources 1 and 3 show why copying the old context
  would lose newer architecture and features.
- **Adopted:** require explicit local endpoint configuration and reuse current
  connection code. Sources 1 and 5 establish ownership and the Arc contract.
- **Adopted:** create a native marker tab and attach by identity; reject
  isolation/incognito and preserve background selection. Sources 4 and 5.
- **Rejected:** reuse blank/last tabs or fall back to CDP tab creation. Source
  3 directly implements these behaviors; source 5 requires true new tabs.
- **Adopted:** use a local compiled entry during development or a verified
  scoped artifact for published installs. Sources 1, 2, and 10 establish the
  entries; source 5 requires the intended patch to reach the running server.
  Preserve fork package/publisher identity across upstream updates and never
  fall back to official npm. Plugin defaults still require explicit Arc args.
- **Rejected:** unauthorized quit/relaunch or broad CDP compatibility claims.
  Sources 3–5 establish a real user session and version gaps; an explicitly
  authorized normal restart is available through `npm run arc:restart`.
- **Deferred:** an automated upstream patch/rebase script. Source 1 shows
  architecture changes that require inspecting ownership; a blind patch
  would be less maintainable than a bounded reviewable workflow.

## Coverage

- **Preconditions — complete:** exact revision, runtime versions, local changes,
  config entry point, Arc window, endpoint, and permission checks in SKILL.
- **Ordered execution — complete:** baseline, narrow port, local/scoped runtime,
  generation/format/full tests/native smoke, artifact/client check, and handoff.
- **Safety boundaries — complete:** no unauthorized browser termination, no
  borrowed-tab navigation, local endpoint, no fallback, preserved rollback.
- **Acceptance/output — complete:** separate check and feature statuses in
  `references/output-contract.md`; current tools and actual build required.
- **Failure/retry — complete:** permission/endpoint blockers and timed-out
  marker creation; diagnose before rerun and never retry uncertain creation.
- **Escalation/handoff — complete:** precise missing prerequisite and retained
  artifacts; implementation can finish while native verification is blocked.
- **Profile examples — complete:** happy path, guarded setup, failure-recovery
  transcript, anti-pattern corrections, output template, and changelog rules
  in the bundled references.
- **Platform/version evidence — partial:** dictionary and current source
  inspected; native acceptance and feature-specific CDP results require live
  execution against recorded versions. Follow the validation phase.
- **Published artifact — unverified:** npm authentication and scope access are
  unresolved. Follow `docs/arc.md` to verify login, bootstrap the public scoped
  release when authorized, configure OIDC, and test a clean installed artifact.

Expansion passes covered core behavior (sources 1/4), failures (3/5), negative
examples (3), repairs (1/4/5), and platform/version variance (1/4). Retrieval
stopped because these sources establish the workflow and remaining questions
need execution on the intended Arc, rather than more general documentation.

## Evaluation and gaps

Qualitative authoring review only: required process dimensions and examples
are represented; no baseline-versus-skill agent runs or quantitative benchmark
were executed. The concrete improvement over the original fork's documented
workflow is an explicit native-new-tab contract, intended-artifact routing,
and evidence-limited support reporting. Behavioral improvement is unmeasured.

Should-trigger prompts:

- "Reapply our Arc patch onto the latest chrome-devtools-mcp."
- "Adapt current Chrome DevTools MCP to Arc without losing upstream tools."
- "Configure my locally modified Arc MCP and verify it."
- "Verify an installed @chenpx976/chrome-devtools-mcp release with Arc."
- "Merge upstream updates while preserving our scoped npm package."

Should-not-trigger prompts:

- "Take a screenshot with my already configured MCP server."
- "Install unmodified Chrome DevTools MCP for Chrome."
- "What is the length of this geometric arc?"

Description review: name Arc plus the MCP package and update/setup intent;
exclude ordinary debugging and unmodified Chrome setup. These are designed
trigger cases, not observed classifier scores.

At initial authoring, strict-depth skill validation passed as
`workflow-process`, with no errors or warnings. The native foreground probe
passed on the versions recorded in source 8; generation and formatting also
passed then. These are historical results, not validation of this scoped
migration. No scripts, tests, formatters, or skill validator were run for the
2026-11-25 documentation update. Qualitative review covers preconditions,
ordered execution, failure handling, package identity, and rollback; designed
trigger cases now include installed scoped releases and identity-preserving
upstream updates. Advanced CDP and published-artifact behavior remain
unverified unless individually exercised.

## Maintenance

2026-11-23: created the workflow skill, native compatibility contract,
illustrative workflows, deterministic report, and provenance record. Registered
in the existing README skill inventory; no manifest allowlist edit required.

2026-11-25: updated the existing `skills/arc-compatibility` workflow and bundled
references for scoped distribution. Added local-versus-installed routing,
publication/authentication boundaries, artifact verification, publisher
identity preservation, and package-version rollback. Retained the canonical
skill directory, README registration, existing examples, and upstream source
citations; no new skill registration or additional documentation files.

For each real update, record the exact upstream and patched revisions, changed
source contracts, actual verification evidence, and newly discovered gaps.
Keep authoring history separate from the compatibility report for a specific
Arc/Chromium version. Add only evidence-backed regression examples.
