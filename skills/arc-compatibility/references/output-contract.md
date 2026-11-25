# Output contract

Return a concise report with these fields for setup, updates, and recovery.
Use `passed`, `failed`, `blocked`, or `not run` for checks; use `verified`,
`unsupported`, `failed`, or `unverified` for feature support. Never omit a
blocked acceptance step or infer a pass from successful compilation.

## Preconditions

- Requested operation and resolved upstream URL, ref, and exact commit.
- Previous patched revision, new patched revision if committed, package and
  Node versions; identify uncommitted changes without inventing a commit ID.
- Fork branch and scoped package identity, registry version/integrity when
  available; npm authentication/scope access, publication, and OIDC status
  separately. Explicitly mark an unpublished or unverified artifact.
- macOS, Arc app, and Chromium/CDP versions; report unavailable values.
- Endpoint type and loopback address, normal-window availability, and native
  Automation permission status. Redact credentials and private page URLs.

## Actions taken

- Files/behavior changed and how current upstream tools were preserved.
- Actual local build entry or installed scoped artifact path and client config.
- Client restart status and evidence it launched that build/package version.
- Retained previous build or package version and config for rollback.

## Validation results

| Check                                | Status          | Evidence or blocker                    |
| ------------------------------------ | --------------- | -------------------------------------- |
| Generation and generated files       | recorded status | command and observed result            |
| Formatting/lint                      | recorded status | command and observed result            |
| Full automated tests                 | recorded status | command, counts if observed            |
| Native Arc smoke                     | recorded status | command, versions, observed assertions |
| Packed and installed scoped artifact | recorded status | name/version, integrity, bins, help    |
| Actual client server/tool inventory  | recorded status | observed entry/tool schemas            |

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
retained local build or pinned scoped package version/config, restart the
client, and leave Arc/profile data intact. If no previous working Arc artifact
exists, describe disabling the new server entry. Never use the official npm
package as an Arc rollback.
