---
name: spx-apply-with-log
description: Implement tasks from an OpenSpec change with runtime log verification for logic and UI/UX correctness. Use when the user wants implementation with log-based verification — AI instruments code with verify logs, user manual tests, AI analyzes logs to catch bugs.
---

You are using the spx-apply-with-log skill, which is described as follows:

Implement tasks from an OpenSpec change — same as `spx-apply` but with **runtime log verification**. You instrument code with verify logs during implementation, then after auto-verify, the user manual tests and provides runtime logs. You analyze the logs to catch logic bugs, UI/UX issues, and edge cases that static verification misses. Logs are removed after verification is clean.

> **CLI NOTE**: Run all `openspec` and `bash` commands directly from the workspace root. Do NOT `cd` into any directory before running them. The `openspec` CLI is designed to work from the project root.

> **SETUP**: If `openspec` is not installed, run `npm i -g @fission-ai/openspec@latest`. If you need to run `openspec init`, always use `openspec init --tools none`.

**⚠️ MODE: IMPLEMENTATION** — This command puts you in implementation mode. You write code, complete tasks, and modify files. This is the OPPOSITE of explore mode (`/spx-plan`). When this command ends (completion or pause), you remain in implementation context until the user explicitly switches mode.

**🚫 SUBAGENT BLACKLIST:** NEVER use the `explore` or `plan` subagents. These are generic subagents from other kits and are NOT part of this workflow. Only use subagents explicitly listed in this kit (e.g., `spx-uiux-designer`). Do your own implementation work directly.

**Input**: Optionally specify a change name. If omitted, check if it can be inferred from conversation context. If vague or ambiguous you MUST prompt for available changes.

**Steps**

1. **Select the change**

   If a name is provided, use it. Otherwise:
   - Infer from conversation context if the user mentioned a change
   - Auto-select if only one active change exists
   - If ambiguous, run `openspec list --json` to get available changes and use the **AskUserQuestion tool** to let the user select

   Always announce: "Using change: <name>" and how to override (e.g., `/spx-apply-with-log <other>`).

2. **Check status to understand the schema**
   ```bash
   openspec status --change "<name>" --json
   ```
   Parse the JSON to understand:
   - `schemaName`: The workflow being used (e.g., "spec-driven")
   - Which artifact contains the tasks (typically "tasks" for spec-driven, check status for others)

3. **Get apply instructions**

   ```bash
   openspec instructions apply --change "<name>" --json
   ```

   This returns:
   - Context file paths (varies by schema - could be proposal/specs/design/tasks or spec/tests/implementation/docs)
   - Progress (total, complete, remaining)
   - Task list with status
   - Dynamic instruction based on current state

   **Handle states:**
   - If `state: "blocked"` (missing artifacts): show message, suggest using openspec-continue-change
   - If `state: "all_done"`: congratulate, suggest archive
   - Otherwise: proceed to implementation

4. **Read context files**

   Read the files listed in `contextFiles` from the apply instructions output.
   The files depend on the schema being used:
   - **spec-driven**: proposal, specs, design, tasks
   - Other schemas: follow the contextFiles from CLI output

5. **Show current progress**

   Display:
   - Schema being used
   - Progress: "N/M tasks complete"
   - Remaining tasks overview
   - Dynamic instruction from CLI

6. **Implement tasks (loop until done or blocked)**

   For each pending task:
   - Show which task is being worked on
   - **Explore the relevant codebase area yourself** — don't rely solely on plan artifacts. Read the actual files you'll modify, trace how they connect, understand the current state.
   - **Look up API docs when unsure** — if a task involves a library/function you're not certain about (exact params, return type, version behavior), delegate to `spx-doc-lookup` with the specific target before writing code.
   - Make the code changes required
   - Keep changes minimal and focused
   - **Instrument with verify logs** — every task MUST include `[VLOG]` log calls covering the code you wrote (see Logging Instrumentation below)
   - **Log summary gate** — BEFORE marking task complete, count and display the `[VLOG]` log calls you added:
     ```
     📊 Task X logs: 8 [VLOG] calls — [ENTER]x2 [EXIT]x2 [BRANCH]x3 [POSITION]x1
     ```
     If the count is suspiciously low (e.g., 1-2 logs for a task that touches multiple functions or has branches), you are being lazy. Go back and add the missing logs.
   - **Mark task complete IMMEDIATELY** in the tasks file: `- [ ]` → `- [x]` — do NOT batch updates, do NOT wait until multiple tasks are done. Each task gets marked the moment it's finished.
   - Continue to next task

   **Milestone verification gate:**

   When you finish the last subtask of a major task group (e.g., all 1.x tasks done, about to start 2.x), STOP and run verification before proceeding:

   1. If `openspec/changes/<name>/verify-fixes.md` exists, read it.
   2. Run applicable verifiers **in parallel** with context of what was just completed (change name, artifact paths, tasks completed in this group, files modified):
      - `spx-verifier` (always) — include `← (verify: ...)` annotations from completed tasks
      - `spx-arch-verifier` (always) — include project language/framework
      - `spx-uiux-verifier` (if change has UI) — include UI file list
      - `spx-test-verifier` (if project has test framework) — include test command
      - If verify-fixes.md exists, add to EACH verifier instruction: `**Previously fixed issues (from verify-fixes.md):**` followed by the file content
   3. Merge reports. If any report has CRITICAL or WARNING issues → fix before moving to next group
   4. If all clear → proceed to next task group

   This prevents errors from compounding across task groups. A bug in group 1 that goes undetected can cascade into group 2, 3, etc.

   **Pause if:**
   - Task is unclear → ask for clarification
   - Implementation reveals a design issue → suggest updating artifacts
   - Error or blocker encountered → report and wait for guidance
   - User interrupts

   **Logging Instrumentation**

   Every task you implement MUST be instrumented with verify logs. These logs let you verify correctness from runtime output after the user manual tests.

   **Log API rule:**
   - Use the language's native log API directly: `console.log` (JS/TS), `print` (Python), `Debug.Log` (Unity C#), `println!` (Rust), etc.
   - Every log message MUST start with `[VLOG]` keyword — this is the search-and-remove handle.
   - Mark every log line in source code with a comment containing `[VLOG]`: `// [VLOG]` (JS/TS/C#), `# [VLOG]` (Python).
   - Cleanup = search `[VLOG]` in codebase → delete every line containing it. One operation, done.
   - Example:
     ```js
     console.log(`[VLOG][ENTER] fn=processPayment orderId=${orderId} amount=${amount}`); // [VLOG]
     ```
     ```python
     print(f"[VLOG][BRANCH] fn=apply_discount branch=loyalty tier={user.tier}")  # [VLOG]
     ```
     ```csharp
     Debug.Log($"[VLOG][GAME] fn=OnCollision entity_a=player entity_b={other.tag} damage={dmg}"); // [VLOG]
     ```

   **Format rule — FLAT only:**
   - Format: `[VLOG][TAG] fn=name ts=<ISO> seq=<N> flow_id=<id> key=value key=value`
   - NEVER log objects. Extract 3-5 key fields as flat key=value pairs.
   - Quote strings with spaces: `name="Alice Smith"`
   - Every log line must be self-contained — readable without context from other lines.

   **Timeline & flow tracing (MANDATORY on every log line):**
   - `ts=` — ISO timestamp (e.g., `ts=2026-02-27T14:23:01.042Z`). Use `new Date().toISOString()` / `datetime.now().isoformat()` / `DateTime.Now.ToString("o")`.
   - `seq=` — monotonic sequence number per flow. Increment a counter for each log line within the same flow_id. This solves async interleaving — even if lines from different flows mix in the file, seq= reconstructs the order within each flow.
   - `flow_id=` — stable ID for the entire user-initiated flow. Format: `flow-<feature>-<unique>` (e.g., `flow-checkout-abc123`). Generate at flow start, carry through every log in that flow.

   **Flow markers:**
   - `[FLOW]` with `event=FLOW_START` at the beginning of each feature flow: includes `feature=`, `trigger=`, `flow_id=`
   - `[FLOW]` with `event=FLOW_END` at the end: includes `status=`, `duration_ms=`, `steps_completed=`
   - `[HANDOFF]` when one feature triggers another: includes `flow_id=` (parent), `child_flow_id=` (child), `from_feature=`, `to_feature=`

   To extract one feature's full flow from a 50,000-line log: `grep "flow_id=flow-checkout-abc123" app.log`

   **Tag system — choose tags based on what the code does:**

   Logic tags:
   - `[ENTER]` / `[EXIT]` — function entry with inputs, exit with result (every return path)
   - `[BRANCH]` — which conditional path taken and why: `branch=discount_applied reason=loyalty_tier`
   - `[ASSERT]` — invariant check result: `check=amount_in_range result=true`
   - `[STATE]` — state machine transition: `from=idle to=loading trigger=fetch_start`
   - `[EVENT]` — system/user event fired with context
   - `[ASYNC:START]` / `[ASYNC:OK]` / `[ASYNC:FAIL]` / `[ASYNC:TIMEOUT]` — async lifecycle
   - `[TRANSFORM]` — data shape change: log input fields → output fields
   - `[ERROR]` — error boundary with full context (not just message)

   UI/UX tags:
   - `[RENDER]` — component mount/update, conditional render (which element shown/hidden and why), list render (item count, empty state, pagination), computed display values (formatted currency/date/truncated text)
   - `[LAYOUT]` — viewport visibility (`in_viewport=true/false`), responsive breakpoint active, overflow/scroll state, sticky activation, CSS class changes affecting layout
   - `[POSITION]` — element bounding rect (`x=120 y=340 width=200 height=48`), computed styles affecting visibility (`display=flex visibility=visible opacity=1.0 position=absolute z_index=100`), overlap detection (`element=SubmitBtn overlapped_by=CookieBanner overlap_area=100%`), element vs container dimensions (`el_width=500 container_width=400 overflows=true`), scroll-relative position (`scroll_top=320 el_offset_top=280 visible_in_scroll=true`). Use this tag whenever an element's position, size, or visibility matters for correctness.
   - `[ANIM]` — animation start/end/cancel with duration, UI state transitions (`from=loading to=loaded`), skeleton→content swap, toast lifecycle (appear/timer/dismiss), reduced motion preference applied
   - `[INTERACT]` — hover/focus/blur state, drag&drop lifecycle (start/over/drop/cancel with valid_drop), scroll triggers (infinite scroll, sticky header), hotkeys (keys + action + handled), gestures (long press, swipe with threshold/duration), input buffer for games
   - `[FORM]` — field change with validation result and error message, form state (dirty/pristine/valid/invalid + invalid_fields list), submit attempt (valid + blocked_by), submit result (success/fail + server errors), dynamic field add/remove with trigger condition, auto-save and debounced validation timing
   - `[NAV]` — route change (from/to/method/params), history stack depth, deep link resolution (url→resolved_route), modal/drawer stack (open/close with stack_depth), tab/accordion toggle, breadcrumb trail
   - `[A11Y]` — aria attribute changes (element + attr + prev/next + trigger), focus trap enter/exit (first/last focusable), focus move (from/to/reason), screen reader announcements (message + priority), contrast mode and reduced motion changes

   Game tags:
   - `[GAME]` — player state at key frames (`pos_x/pos_y/vel/hp/state`), collision events (`entity_a/entity_b/type/damage/resolution`), NPC decisions (`decision=chase reason="player_in_radius dist=8.2"`), resource changes (`resource=gold prev=150 delta=+50 new=200 reason=enemy_drop`), scene transitions, effect triggers, camera state, physics events (`event=gravity_applied force_y=-9.8`), score changes with multiplier/combo

   Reactivity tags:
   - `[REACTIVE]` — store dispatch (`action=ADD_TO_CART payload_id=5 prev_size=2 next_size=3`), UI update list (`components_updated=CartIcon,CartDrawer`), computed recalc (`name=filteredProducts prev_count=24 next_count=8`), two-way sync check (`model_value="react" dom_value="react" in_sync=true`)

   Resource lifecycle tags (memory leak detection):
   - `[LIFECYCLE]` — create/destroy pairs for ANY resource that must be cleaned up. Uses `op=` with controlled vocabulary:
     - `op=add` / `op=remove` — event listeners
     - `op=create` / `op=clear` — timers, intervals
     - `op=subscribe` / `op=unsubscribe` — observables, stores, pub/sub
     - `op=mount` / `op=unmount` — components, DOM nodes, GameObjects
     - `op=open` / `op=close` — WebSocket, HTTP connections, file handles
     - `op=acquire` / `op=release` — object pool items
     - `op=load` / `op=unload` — textures, assets, scenes
     - Every create MUST have a stable `id=` field. NEVER use anonymous references — assign an ID at creation time.
     - Example: `[VLOG][LIFECYCLE] fn=ChatWindow.mount op=add event=resize id=listener-a1b2 component=ChatWindow instance=cw-007`
   - `[RESOURCE_COUNT]` — snapshot of active resource counts at natural boundaries (route change, scene transition, test teardown). Fields: `checkpoint=`, `active_listeners=`, `active_timers=`, `active_subscriptions=`, `mounted_components=`, `open_connections=`, `cache_entries=`
     - Example: `[VLOG][RESOURCE_COUNT] checkpoint=route-change route=/settings active_listeners=14 active_timers=3 active_subscriptions=8 mounted_components=19`
   - `[CLEANUP_AUDIT]` — emitted at component mount AND unmount. Lists all resources created/removed so the analyzer can diff:
     - Mount: `phase=mount created=[listener-a1b2,timer-c3d4,sub-e5f6]`
     - Unmount: `phase=unmount removed=[listener-a1b2,timer-c3d4]` — if `sub-e5f6` is missing from removed, it's a leak.
   - `[POOL]` — game object pool state: `op=acquire/release pool=BulletPool id=bullet-001 active=23 available=27 pool_size=50`
   - `[ASSET]` — asset load/unload: `op=load/unload asset=terrain_diffuse.png id=asset-w3x4 scene=Level_03 size_kb=2048`

   **Mandatory log density (non-negotiable):**

   These are HARD minimums. "Does not apply" is not an excuse — if you wrote the code, you log it.

   Per function you wrote or modified:
   - 1x `[ENTER]` with all input params
   - 1x `[EXIT]` on EVERY return path (including early returns — if a function has 3 returns, it needs 3 `[EXIT]` logs)

   Per conditional you wrote (if/else, switch, ternary):
   - 1x `[BRANCH]` on EVERY branch — not just the happy path. If you wrote `if/else`, BOTH branches get a log. If you wrote a `switch` with 4 cases, ALL 4 cases get a log. No exceptions.

   Per async operation:
   - 1x `[ASYNC:START]` before the call
   - 1x `[ASYNC:OK]` in success handler
   - 1x `[ASYNC:FAIL]` in error handler

   Per try/catch:
   - 1x `[ERROR]` in EVERY catch block with error message + context

   Per UI component you wrote or modified:
   - 1x `[RENDER]` for each conditional render (show/hide, ternary in JSX, v-if, etc.)
   - 1x `[RENDER]` for computed display values (formatted numbers, dates, truncated text)
   - 1x `[POSITION]` for elements where position/size/visibility matters (modals, tooltips, dropdowns, sticky headers, overlapping elements, scrollable containers). Log bounding rect + computed styles.
   - 1x `[FORM]` for each form field change handler and each validation trigger
   - 1x `[NAV]` for each route change or modal/drawer open/close
   - 1x `[STATE]` for each state transition (useState setter, store dispatch, state machine change)

   Per game logic you wrote:
   - 1x `[GAME]` for each collision, resource change, score change, NPC decision
   - Arithmetic logs MUST include `prev`, `delta`, `new` so the AI can verify math: `prev=150 delta=+50 new=200`
   - 1x `[POOL]` for each pool acquire/release with active/available counts

   Per resource you create (event listener, timer, subscription, connection, etc.):
   - 1x `[LIFECYCLE]` with `op=add/create/subscribe/open/acquire/load` at creation — with stable `id=`
   - 1x `[LIFECYCLE]` with matching `op=remove/clear/unsubscribe/close/release/unload` in cleanup/unmount/destroy
   - If you add an event listener, timer, or subscription in mount/init → you MUST add the matching remove in unmount/cleanup. Log BOTH.

   Per component with mount/unmount lifecycle:
   - 1x `[CLEANUP_AUDIT]` at mount listing all resources created: `phase=mount created=[id1,id2,id3]`
   - 1x `[CLEANUP_AUDIT]` at unmount listing all resources removed: `phase=unmount removed=[id1,id2]`

   Per route change / scene transition:
   - 1x `[RESOURCE_COUNT]` checkpoint with all active resource counts

   Per feature flow:
   - 1x `[FLOW]` with `event=FLOW_START` at the beginning
   - 1x `[FLOW]` with `event=FLOW_END` at the end with status and duration

   **Anti-lazy rule:** If you find yourself thinking "this branch is obvious, no need to log" — that is EXACTLY the branch that will have a bug. Log it. The whole point of this command is to catch what "looks obvious" but isn't.

   **Log examples:**
   ```js
   // Flow start — generate flow_id, init seq counter
   let _seq = 0; // [VLOG]
   const flowId = `flow-checkout-${Date.now().toString(36)}`; // [VLOG]
   console.log(`[VLOG][FLOW] ts=${new Date().toISOString()} seq=${++_seq} flow_id=${flowId} event=FLOW_START feature=checkout trigger=submit_click`); // [VLOG]

   // Function entry
   console.log(`[VLOG][ENTER] ts=${new Date().toISOString()} seq=${++_seq} flow_id=${flowId} fn=processPayment orderId=${orderId} amount=${amount}`); // [VLOG]

   // Branch
   console.log(`[VLOG][BRANCH] ts=${new Date().toISOString()} seq=${++_seq} flow_id=${flowId} fn=processPayment branch=discount_applied reason=loyalty_tier discount=0.15`); // [VLOG]

   // Resource lifecycle — create
   console.log(`[VLOG][LIFECYCLE] ts=${new Date().toISOString()} seq=${++_seq} flow_id=${flowId} fn=ChatWindow.mount op=add event=resize id=listener-${instanceId} component=ChatWindow`); // [VLOG]

   // Resource lifecycle — destroy (in cleanup)
   console.log(`[VLOG][LIFECYCLE] ts=${new Date().toISOString()} seq=${++_seq} flow_id=${flowId} fn=ChatWindow.unmount op=remove event=resize id=listener-${instanceId} component=ChatWindow`); // [VLOG]

   // Cleanup audit
   console.log(`[VLOG][CLEANUP_AUDIT] ts=${new Date().toISOString()} seq=${++_seq} flow_id=${flowId} fn=ChatWindow.mount phase=mount component=ChatWindow instance=${instanceId} created=[listener-${instanceId},timer-${timerId}]`); // [VLOG]

   // Resource count checkpoint
   console.log(`[VLOG][RESOURCE_COUNT] ts=${new Date().toISOString()} seq=${++_seq} flow_id=${flowId} checkpoint=route-change route=${newRoute} active_listeners=${listenerCount} active_timers=${timerCount} active_subscriptions=${subCount}`); // [VLOG]

   // Position
   console.log(`[VLOG][POSITION] ts=${new Date().toISOString()} seq=${++_seq} flow_id=${flowId} element=DropdownMenu x=${rect.x} y=${rect.y} width=${rect.width} height=${rect.height} z_index=${style.zIndex} overlapped_by=${overlapper || "none"}`); // [VLOG]

   // Flow end
   console.log(`[VLOG][FLOW] ts=${new Date().toISOString()} seq=${++_seq} flow_id=${flowId} event=FLOW_END feature=checkout status=success duration_ms=${Date.now() - startTime} steps_completed=${_seq}`); // [VLOG]
   ```

7. **On completion or pause, show status**

   Display:
   - Tasks completed this session
   - Overall progress: "N/M tasks complete"
   - If paused: explain why and wait for guidance
   - If all done OR only manual/testing tasks remain: **proceed to auto-verify** (step 8)

8. **Auto-Verify on Completion**

   When all tasks are complete OR only manual/testing tasks remain, **automatically run verification**:

   ```
   ## All Tasks Complete — Running Verification...
   ```

   Detect change characteristics (same logic as spx-verify step 4):
   - **Has UI**: scan artifacts for UI keywords (component, page, modal, form, button, layout, CSS, style, responsive, animation)
   - **Has tests**: project has test framework AND change touches testable code

   Run all applicable verifiers **in parallel**:

   - `spx-verifier` (always) — with full artifact context, implementation context, and verify focus points from task annotations
   - `spx-arch-verifier` (always) — with project language/framework context
   - `spx-uiux-verifier` (if change has UI) — with UI file list
   - `spx-test-verifier` (if project has test framework) — with test framework name and test command

   If `openspec/changes/<name>/verify-fixes.md` exists, read it.

   Instruction template for each verifier:
   ```
   Verify implementation for change: <name>

   **Artifacts:**
   - Tasks: openspec/changes/<name>/tasks.md
   - Proposal: openspec/changes/<name>/proposal.md
   - Design: openspec/changes/<name>/design.md (if exists)
   - Specs: openspec/changes/<name>/specs/*.md (if exist)

   **Implementation context:**
   - [tasks completed this session]
   - [files modified]

   **Previously fixed issues (from verify-fixes.md):**
   [content of verify-fixes.md, or "None" if file doesn't exist]
   ```

   Add verifier-specific context to each instruction (verify focus points for spx-verifier, UI files for spx-uiux-verifier, etc.).

   Merge all reports into unified verification result.

9. **Auto-Fix Loop**

   After receiving verification report, fix **all** reported issues — CRITICAL, WARNING, and SUGGESTION. Not just the easy ones.

   **Fix without asking** (these don't need user input):
   - CRITICAL: Incomplete tasks, missing implementations, broken functionality
   - WARNING: Spec/design divergences, missing scenario coverage, test failures
   - SUGGESTION: Pattern inconsistencies, code style deviations, minor improvements
   - Type errors, lint errors → fix the code
   - Incomplete tasks that are actually done → mark checkbox

   **Skip and collect** (genuinely need user decision):
   - Ambiguous requirements where multiple interpretations are valid
   - Design decisions that need revisiting
   - Scope questions (feature boundary unclear)

   **Write verify fix log** — After fixing issues, append to `openspec/changes/<name>/verify-fixes.md`. This log prevents future re-verification from re-flagging issues that were already fixed.

   Format:
   ```markdown
   ## [YYYY-MM-DD] Round N (from spx-apply-with-log auto-verify)

   ### spx-verifier
   - Fixed: <semantic description of what was fixed and where>

   ### spx-arch-verifier
   - Fixed: <semantic description of what was fixed and where>
   ```

   Only include sections for verifiers that reported issues you fixed. Only log fixes that originated from verify results — do NOT log fixes from first-time implementation or user-requested changes.

   After writing the log, **re-verify the FULL implementation** — run all applicable verifiers again **in parallel** on the entire change (all artifacts, all files), not just the parts you fixed. A fix in one area can break another. Include the updated verify-fixes.md in each verifier instruction.

   ```
   ## Auto-Fixing Issues... (round 1)

   ✓ Fixed: [CRITICAL] Missing implementation for requirement X
   ✓ Fixed: [WARNING] Spec divergence in auth.ts:45
   ✓ Fixed: [SUGGESTION] Pattern inconsistency in utils.ts
   ⏸ Skipped: Ambiguous requirement (needs your input)
   📝 Logged fixes to verify-fixes.md

   Re-verifying full implementation...
   ```

   **Loop** — fix → log → full verify → fix → log → full verify — until:
   - Report shows 0 CRITICALs, 0 WARNINGs, 0 SUGGESTIONs
   - OR only user-decision items remain (the ⏸ skipped ones)

   Each round uses the same full parallel verification from step 8 (all applicable verifiers, all artifacts, all context, all previously fixed issues). No shortcuts.

10. **Final Output (Code Verify Pass)**

    After auto-fix loop completes, show status but do NOT suggest archive yet. Logs are still in the code.

    ```
    ## 🔧 Implementation Complete — Code Verified

    **Change:** <change-name>
    **Progress:** 7/7 tasks complete ✓
    **Static verification:** All checks passed ✓
    **Verify logs:** Instrumented ✓

    Now I need you to manually test the full flow and send me the runtime logs.
    ```

    Provide clear instructions for the user:
    - What flows to test (list each major user flow from the tasks)
    - How to capture logs (copy from browser console / terminal output / save to file)
    - If log output is large, suggest saving to a file and sharing the file path

11. **Log-Based Verification (MANDATORY)**

    This step is what makes `spx-apply-with-log` different from `spx-apply`. You verify correctness from actual runtime behavior, not just static code analysis.

    **When user provides logs**, delegate analysis to the `spx-log-analyzer` subagent. Do NOT analyze the log yourself — the subagent has a clean context and a structured multi-pass strategy optimized for large files.

    **Run the `spx-log-analyzer` subagent** with these instructions:

    ```
    Analyze runtime logs for change: <name>

    **Log file:** <path provided by user>
    **Dev mode:** <true/false — ask user if unclear>

    **Artifacts (for expected behavior):**
    - Tasks: openspec/changes/<name>/tasks.md
    - Proposal: openspec/changes/<name>/proposal.md
    - Design: openspec/changes/<name>/design.md (if exists)

    **Files modified:** [list of source files implemented this session]

    **Expected flows:** [list major user flows from tasks, e.g., "checkout flow", "login flow"]
    **Flow ID prefixes:** [e.g., flow-checkout-, flow-login-]
    **Expected resource cleanup:** [LIFECYCLE types used: LISTENER, TIMER, SUBSCRIPTION, CONNECTION, etc.]

    Run all 3 passes: flow completeness, memory leak detection, correctness.
    ```

    **After receiving the report**, act on findings:

    **If missing log coverage** (incomplete flows, untested branches):
    ```
    ## ⚠️ Missing Log Coverage

    These flows were not covered in the logs you provided:

    1. [flow description] — need to test: [specific action]
    2. [flow description] — branch [X] was never taken, need to test: [condition that triggers it]

    Please test these flows and send me the logs again.
    ```

    **If bugs or memory leaks found:**
    ```
    ## 🐛 Issues Found in Runtime Logs

    1. [CRITICAL] [description] — evidence: [log excerpt from report]
    2. [HIGH] Memory leak: [resource] created but never destroyed
    3. [MEDIUM] Resource count trending up: active_listeners 14 → 16 → 18 → 21

    Fixing now...
    ```

    Fix the issues. Add additional `[VLOG]` log calls if the fix introduces new logic paths or new resources that need lifecycle tracking. Then request user to manual test again and provide fresh logs.

    **Loop** — user provides logs → delegate to `spx-log-analyzer` → fix issues + add logs → user retests → until:
    - All flows complete (every FLOW_START has FLOW_END)
    - No memory leaks (every create has matching destroy, resource counts stable)
    - All branches covered
    - No unexpected errors
    - All arithmetic correct
    - All position/layout checks pass

12. **Log Cleanup**

    When log verification is fully clean, ask the user to confirm:

    ```
    ## ✅ Log Verification Complete

    All runtime checks passed. No issues found.

    Ready to remove all verify logs from the code?
    ```

    **On user confirmation:**
    - Delete all lines containing `[VLOG]` in source code (both the log call and the `// [VLOG]` comment marker are on the same line, so one search-delete handles it)
    - Verify the code still compiles/runs after cleanup (no accidental deletions)

    **After cleanup, show final output:**

    ```
    ## ✅ Implementation Complete & Verified (with runtime logs)

    **Change:** <change-name>
    **Progress:** 7/7 tasks complete ✓
    **Static verification:** Passed ✓
    **Runtime log verification:** Passed ✓ ([N] flows verified, [M] branches covered)
    **Logs cleaned:** ✓

    Ready to archive → `/spx-archive <name>`
    ```

    **If manual issues remain:**
    ```
    ## ⚠️ Implementation Complete (Manual Issues Remain)

    **Change:** <change-name>
    **Progress:** 7/7 tasks complete ✓
    **Static verification:** Passed ✓
    **Runtime log verification:** Passed ✓
    **Logs cleaned:** ✓
    **Remaining:** [M] manual issues

    ### Issues Needing Your Decision:
    1. [issue] — [options]
    2. [issue] — [options]

    After resolving, run `/spx-verify` again or proceed to archive.
    ```

13. **Refinement Stance (when user asks to fix or improve code you already wrote)**

    When the user comes back with "this doesn't work", "fix this", "refine this", or points out issues with code you implemented:

    **Re-explore before patching** — Do NOT immediately edit the code you wrote. First:
    - Re-read the relevant codebase areas (not just your previous changes)
    - Understand the actual behavior vs expected behavior
    - Trace the execution flow to find the real cause

    **Diagnose root cause, not symptoms** — Ask yourself:
    - Is the issue in MY code, or in how my code interacts with existing code?
    - Is the approach fundamentally wrong, or is it a small mistake?
    - If I patch this spot, will the same class of issue appear elsewhere?

    **Rewrite over patch** — If the root cause is a wrong approach:
    - Do NOT add workarounds or band-aids on top of existing code
    - Rewrite the affected section from scratch with the correct approach
    - It's cheaper to rewrite 50 lines correctly than to patch 5 lines that create 3 more bugs

    **Break the safety loop** — You have permission to:
    - Delete code you wrote in this session and start over
    - Change the approach entirely if evidence shows it's wrong
    - Disagree with the original plan if implementation reveals it was flawed
    - Suggest updating artifacts (design.md, tasks.md) to reflect the better approach

**Output During Implementation**

```
## Implementing: <change-name> (schema: <schema-name>)

Working on task 3/7: <task description>
[...implementation happening...]
✓ Task complete

Working on task 4/7: <task description>
[...implementation happening...]
✓ Task complete
```

**Output On Pause (Issue Encountered)**

```
## Implementation Paused

**Change:** <change-name>
**Schema:** <schema-name>
**Progress:** 4/7 tasks complete

### Issue Encountered
<description of the issue>

**Options:**
1. <option 1>
2. <option 2>
3. Other approach

What would you like to do?
```

**Guardrails**
- Keep going through tasks until done or blocked
- Always read context files before starting (from the apply instructions output)
- If task is ambiguous, pause and ask before implementing
- If implementation reveals issues, pause and suggest artifact updates
- Keep code changes minimal and scoped to each task — but when refining, prefer rewriting over patching if the root cause demands it
- **Real-time task tracking** — Mark each task `[x]` the MOMENT it's done. Never batch checkbox updates.
- **Milestone verify gate** — Before starting a new major task group (e.g., moving from 1.x to 2.x tasks), MUST run all applicable verifiers in parallel and fix any CRITICAL/WARNING issues first.
- Pause on errors, blockers, or unclear requirements - don't guess
- Use contextFiles from CLI output, don't assume specific file names
- **Auto-verify on completion** — MUST run all applicable verifiers in parallel when all AI-doable tasks complete (even if manual/testing tasks remain). Always: spx-verifier + spx-arch-verifier. Conditional: spx-uiux-verifier (UI changes), spx-test-verifier (project has tests).
- **Auto-fix ALL issues** — fix CRITICALs, WARNINGs, and SUGGESTIONs. Only skip items that genuinely need user decision.
- **Full re-verify loop** — after fixing, re-verify the ENTIRE implementation (not just fixed parts). Loop until report is clean or only user-decision items remain.
- **Verify fix log** — after fixing issues from verify results, MUST append to `verify-fixes.md` in the change directory. Group by verifier, use semantic descriptions. This prevents re-verify from re-flagging already-fixed issues. Always pass verify-fixes.md content to verifiers.
- **Instrument every task with `[VLOG]` logs** — no task is complete without verify logs covering its logic and UI paths. Use the tag system and native log API.
- **Log FLAT only** — extract key fields as key=value, NEVER log objects or JSON.stringify.
- **Every log line has `[VLOG]` in both message and source comment** — message starts with `[VLOG][TAG]`, source line ends with `// [VLOG]`. This is the cleanup handle.
- **Show log summary before marking task complete** — count `[VLOG]` calls per tag, display the summary. If count is low, go back and add missing logs.
- **Mandatory log density** — 1 ENTER + 1 EXIT per function, 1 BRANCH per conditional branch (ALL branches, not just happy path), 1 ASYNC per async op, 1 ERROR per catch, 1 RENDER per conditional render, 1 POSITION for layout-critical elements, 1 FORM per field handler. These are hard minimums.
- **Anti-lazy: log "obvious" branches** — if a branch "looks obvious", log it anyway. Obvious branches are where bugs hide.
- **Every resource created MUST have a matching destroy log** — if you add an event listener, timer, subscription, or connection, log both the create AND the cleanup. No create without destroy.
- **CLEANUP_AUDIT at every mount/unmount** — list what was created, list what was removed. The analyzer diffs these.
- **RESOURCE_COUNT at every route change / scene transition** — snapshot active counts so the analyzer can detect growing trends.
- **Timeline on every log line** — ts=, seq=, flow_id= are MANDATORY. Without these, the analyzer cannot trace flows in large files.
- **FLOW_START and FLOW_END for every feature flow** — the analyzer checks that every start has a matching end.
- **Delegate log analysis to spx-log-analyzer** — do NOT analyze logs yourself. The subagent has clean context and structured multi-pass strategy.
- **No background subagents** — NEVER use `run_in_background` for any subagent. All subagents (verifiers, log-analyzer, doc-lookup) must run in parallel foreground so their execution is visible and controllable.
- **Log-based verify is MANDATORY** — after static verification passes, user MUST manual test and provide runtime logs before cleanup.
- **Missing log coverage → request retest** — if logs don't cover all branches/flows, ask user to test the specific missing flows.

**Fluid Workflow Integration**

This skill supports the "actions on a change" model:

- **Can be invoked anytime**: Before all artifacts are done (if tasks exist), after partial implementation, interleaved with other actions
- **Allows artifact updates**: If implementation reveals design issues, suggest updating artifacts - not phase-locked, work fluidly
- **Auto-verify on completion**: When all tasks done, automatically verify and fix issues

**Subagent Reference**

| Subagent | Purpose |
|----------|---------|
| `spx-verifier` | Independent verification of implementation (clean context) |
| `spx-arch-verifier` | Architecture, design patterns, library replacement |
| `spx-uiux-verifier` | UI/UX quality verification (when change has UI) |
| `spx-test-verifier` | Test coverage and quality verification (when project has tests) |
| `spx-log-analyzer` | Analyze large runtime log files for correctness, memory leaks, and flow completeness |
| `spx-doc-lookup` | Look up API/function docs — exact signatures, params, version-specific behavior |

**Mode Transition Hints**

After implementation completes (with verification) or pauses:

- To think/explore/brainstorm → `/spx-plan`
- To create a new change → `/spx-ff`
- To re-verify manually → `/spx-verify`
- To archive completed work → `/spx-archive`

**IMPORTANT**: After this command ends, do NOT automatically continue writing code on subsequent user messages unless the user explicitly asks to continue implementation or invokes `/spx-apply-with-log` again. If the user invokes `/spx-plan`, you MUST fully switch to explore mode — no code writing. If the user invokes `/spx-ff`, you MUST fully switch to change creation mode — no code writing, no continuing tasks.

The following is the user's request: