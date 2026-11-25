# Example workflows

These are illustrative execution paths and expected reports, not records of
checks run during skill authoring. Substitute observed versions and evidence.

## Happy path: reapply after an upstream update

**Request:** "Update the Arc adaptation to the latest upstream tools."

1. Resolve upstream's requested branch/tag to an exact commit. Record the old
   patched commit and client config for rollback; preserve unrelated work.
2. Inspect current browser/config/page ownership. Reapply only opt-in Arc
   validation, native creation, integration, tests, and documentation.
3. Run repository sync if dependencies changed, then generation, formatting,
   and the full tests. Keep generated changes in the adaptation.
4. Run native smoke against the already enabled local Arc endpoint. Compare
   native tab identities and URLs before/after. Exercise foreground and
   background creation and cleanup only tabs created by the smoke.
5. Point the client to the newly built local entry and restart its MCP server.
   Inspect its advertised tools and exercise a new page through that client.

**Expected handoff:** exact old/new revisions, actual local executable path,
observed check results, tested Arc/Chromium versions, feature evidence table,
and the retained prior config/build. List advanced features not exercised as
unverified even if the basic smoke passed.

## Guarded variant: Arc is running without remote debugging

**Request:** "Set up Arc MCP without disturbing my current tabs."

1. Prepare and test the patched checkout without terminating Arc. Discover
   the endpoint status read-only; a refused port is a setup finding.
2. Prepare the concrete local client config and describe how the user can
   save work, quit Arc manually, and relaunch with loopback remote debugging.
3. If the user has not relaunched, report native smoke as blocked. Do not
   substitute another browser, auto-quit Arc, or claim a native pass.
4. Once the endpoint is available, run smoke and verify client routing. If
   macOS requests Automation permission, let the user grant access to the
   actual terminal/client host. Do not bypass permission controls.

**Expected handoff before relaunch:** implementation/check evidence available
so far, prepared local config, `native smoke: blocked — endpoint refused`,
the exact manual next action, and rollback config. Avoid asking permission
for routine code edits or checks already authorized by the request.

## Failure recovery: native tab exists but no CDP target matches

**Observation:** AppleScript returned but the marker target wait timed out.

1. Preserve the error and endpoint/browser versions. Do not retry creation or
   navigate an existing tab. A newly created marker tab may remain.
2. Check that native Arc and the configured endpoint are the same instance;
   inspect target visibility and current adapter behavior read-only.
3. Correct the proven mismatch or implementation cause. Identify any leftover
   tab by its exact marker before cleanup; never close unrelated blank tabs.
4. Rerun the failed native scenario after correction. Run affected automated
   checks and the full suite if code changed. Report both failure and recovery.

**Expected handoff:** actual failure, cause if established (otherwise unknown),
owned artifacts left behind, repair, rerun evidence, and remaining gaps.

## Anti-patterns and corrections

| Anti-pattern                                                     | Corrected behavior                                            |
| ---------------------------------------------------------------- | ------------------------------------------------------------- |
| Copy the old fork's `McpContext.ts` over current upstream.       | Port only the Arc branch into the current page lifecycle.     |
| Return the last or blank existing page for `new_page`.           | Create a new native tab and attach by unique marker.          |
| Fall back to `browser.newPage()` after AppleScript fails.        | Return the native failure without a second creation attempt.  |
| Configure `npx chrome-devtools-mcp@latest --arc`.                | Run the patched checkout's built entry with `node`.           |
| Install the skill and keep the plugin's official server command. | Override the Arc server entry to use the local patched build. |
| Kill Arc to activate remote debugging.                           | Let the user save work and quit/relaunch manually.            |
| Declare all tools compatible after `list_pages` works.           | Report only exercised features as verified.                   |

## Iterative maintenance

When a real update reveals a new failure mode, add its anonymized trigger,
observed failure, correction, and acceptance check here. Update `SOURCES.md`
with the source revision/date and decision it changed. Keep synthetic examples
labeled; do not turn an illustrative transcript into claimed runtime evidence.
