# Output contract

Return a concise report with these fields for setup, updates, and recovery.
Use `passed`, `failed`, `blocked`, or `not run` for checks; use `verified`,
`unsupported`, `failed`, or `unverified` for feature support. Never omit a
blocked acceptance step or infer a pass from successful compilation.

## Preconditions

- Requested operation and resolved upstream URL, ref, and exact commit.
- Previous patched revision, new patched revision if committed, package and
  Node versions; identify uncommitted changes without inventing a commit ID.
- macOS, Arc app, and Chromium/CDP versions; report unavailable values.
- Endpoint type and loopback address, normal-window availability, and native
  Automation permission status. Redact credentials and private page URLs.

## Actions taken

- Files/behavior changed and how current upstream tools were preserved.
- Actual local built server entry and client configuration used or prepared.
- Client restart status and evidence that it launched this local build.
- Retained previous build/config location for rollback.

## Validation results

| Check                                       | Status          | Evidence or blocker                    |
| ------------------------------------------- | --------------- | -------------------------------------- |
| Generation and generated files              | recorded status | command and observed result            |
| Formatting/lint                             | recorded status | command and observed result            |
| Full automated tests                        | recorded status | command, counts if observed            |
| Native Arc smoke                            | recorded status | command, versions, observed assertions |
| Actual client's local server/tool inventory | recorded status | observed entry/tool schemas            |

## Feature coverage

| Behavior                                            | Status             | Evidence or limitation                     |
| --------------------------------------------------- | ------------------ | ------------------------------------------ |
| New native tab and existing tabs preserved          | recorded status    | identities/URLs compared                   |
| Background native selection restored                | recorded status    | prior/after selected tab                   |
| Basic navigation, script, snapshot, screenshot      | per-feature status | exercised tools/results                    |
| Isolated context creation                           | unsupported        | expected explicit rejection                |
| Performance, memory, extensions, other CDP features | per-feature status | list exercised cases; otherwise unverified |

Split rows where only some features were exercised. A tool's presence in
`tools/list` is evidence of exposure, not evidence that it works in Arc.

## Failures, recovery, and next actions

State observed failures, known causes versus hypotheses, corrections and
reruns, leftover owned marker tabs/artifacts, and the exact missing action for
any blocked step. State whether the adaptation is ready for the tested scope
or still awaiting verification.

Describe rollback concretely: stop the replacement MCP process, restore the
retained local entry/config, restart the client, and leave Arc/profile data
intact. If no previous working Arc build exists, say so and describe disabling
the new server entry. Do not imply the official npm package is an Arc rollback.
