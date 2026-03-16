---
name: spx-git-pull
description: Pull latest changes from remote with conflict resolution — auto-resolves trivial conflicts, suggests spx-ff → spx-apply workflow for non-trivial conflicts.
---

You are using the spx-git-pull skill, which is described as follows:

Pull latest changes from remote — auto-resolve trivial conflicts, suggest openspec workflow for non-trivial conflicts.

WORKFLOW

Phase 1 — PRE-FLIGHT CHECK

Before pulling, assess the workspace:

1. Check for uncommitted changes via `git status`
   - If dirty working tree: ask user to stash or commit first
   - Offer to run `git stash` automatically if user agrees
2. Identify current branch and its upstream remote/branch
   - If no upstream configured, ask user which remote/branch to pull from
3. Run `git fetch` to get latest remote state
4. Preview what's incoming:

```
PULL PREVIEW
═══════════════════════════════════════
Current branch : feature/xyz
Remote         : origin/feature/xyz
Local is behind by : 14 commits

Incoming changes: 23 files modified, 4 added, 2 deleted
Local unpushed : 3 commits, 8 files modified

Potential conflicts : ~5 files
═══════════════════════════════════════
```

5. If no incoming changes, report "Already up to date" and stop
6. If incoming changes exist, ask user to confirm before merging
7. Save a backup ref: `git tag backup/pull-{YYYYMMDD-HHmmss}` before merging

Phase 2 — MERGE

Run `git merge` with the fetched remote branch.

- If merge completes cleanly — skip to Phase 4
- If conflicts arise — proceed to Phase 3

Phase 3 — CONFLICT RESOLUTION

Work through conflicts in 3 steps: analyze & group → ask user decisions → route to openspec for resolution.

Step 1 — ANALYZE & GROUP

Read ALL conflicted files. Understand the semantic meaning of each conflict, not just the diff. Group related conflicts by logical theme (feature, module, business concern).

Auto-resolve trivial conflicts immediately (do NOT ask user):
- Import/require statement additions or removals
- Formatting, whitespace, line ending differences
- File renames/moves where content is unchanged
- Non-overlapping additions (new code in different regions)
- Comment-only changes
- Auto-generated files (lock files, build outputs)
- Identical changes made on both sides

Present a conflict map:

```
CONFLICT MAP
═══════════════════════════════════════
Total: 8 conflicts in 8 files

Group A — Auth token lifecycle (3 files)
  src/services/auth.ts
  src/middleware/verify.ts
  src/config/auth.ts
  LOCAL: token 48h + refresh logic
  REMOTE: token 1h + rotation logic

Group B — Payment discount rules (2 files)
  src/services/payment.ts
  src/utils/pricing.ts
  LOCAL: cap 30%, applied after tax
  REMOTE: cap 50%, applied before tax

Standalone — src/api/routes.ts
  LOCAL: added /v2/users endpoint
  REMOTE: removed /v1/users endpoint

Auto-resolved (2 files)
  ✓ src/utils/helpers.ts — both sides added imports
  ✓ package-lock.json — regenerated
═══════════════════════════════════════
```

Grouping rules:
- Files that implement the same feature/concern belong together
- If conflicts share a logical dependency (e.g., config + code that reads it), group them
- If a conflict is unrelated to any group, mark it as Standalone
- Never force-group unrelated conflicts

Step 2 — ASK BUSINESS DECISIONS

**If no non-trivial conflicts remain** → skip to Phase 4.

Ask ONE decision per group — not per file. For Standalone conflicts, ask individually.

```
═══════════════════════════════════════
DECISION #1/3 — Auth token lifecycle
Affects: 3 files
═══════════════════════════════════════

LOCAL approach:
  Token lives 48h, refresh when expired
  → Better UX, fewer logouts
  → Higher risk if token is leaked

REMOTE approach:
  Token lives 1h, continuous rotation
  → Stronger security posture
  → More complex client-side handling

These approaches are INCOMPATIBLE — must choose one direction.

1. Keep LOCAL (48h + refresh)
2. Keep REMOTE (1h + rotation)
3. Custom (describe your intent, I'll include it in the plan)

💡 Recommendation: REMOTE (option 2)
   Your branch is feature/security-hardening — token rotation
   aligns with the branch's security-focused intent.

Choose [1/2/3]:
═══════════════════════════════════════
```

Question quality rules:
- Explain WHAT each side does and WHY it matters — don't just show raw diff
- Surface trade-offs: security vs UX, simplicity vs flexibility, etc.
- State whether approaches are compatible (can merge both) or incompatible (must choose)
- If a group decision depends on a previous group's outcome, ask them in dependency order and reference the prior decision
- If you need more context to present a clear decision, investigate first — read related code, trace call sites — before asking. Never ask a vague question.

Recommendation rules:
- For every decision, provide a recommendation after the options
- Base the recommendation on the current branch's purpose — read the branch name, recent commit messages, and PR description (if available)
- The branch's business intent takes priority
- When both sides are equally valid, recommend based on: least risk of runtime breakage > most recent change > simpler approach
- Always explain WHY in one sentence tied to the branch context
- Make it clear this is a suggestion — the user always decides

Step 3 — ROUTE TO OPENSPEC

After collecting ALL decisions from user, prepare the conflict resolution brief and route to the openspec workflow.

1. Present a decision summary for user to confirm:

```
DECISION SUMMARY
═══════════════════════════════════════
Group A — Auth token lifecycle → REMOTE
Group B — Payment discount → LOCAL
Standalone — routes.ts → Custom: keep /v2, remove /v1

Auto-resolved: 2 files
═══════════════════════════════════════
Confirm these decisions? [yes/no]
```

2. After user confirms, output the conflict resolution description for `/spx-ff`:

   The description must include:
   - Change name: `resolve-merge-conflicts-{YYYYMMDD}`
   - Each group with the confirmed decision (LOCAL/REMOTE/Custom + user's intent)
   - Each conflicted file with LOCAL vs REMOTE analysis
   - Branch context and purpose
   - Enough detail for spx-ff to create proper artifacts without re-reading the conflicted files

3. Suggest next steps:

```
Decisions confirmed. Next steps:

1. 🚀 Create the plan → /spx-ff resolve-merge-conflicts-{YYYYMMDD}
   (conflict brief with your decisions is ready above)
2. 🔧 Already have a plan? → /spx-apply to implement the resolution
3. 🔄 After resolution → /spx-git-pull again to finalize (Phase 4)
```

Phase 4 — VERIFICATION

This phase runs when:
- Merge completed cleanly (no conflicts), OR
- User returns after resolving conflicts via `/spx-apply`

If returning after spx-apply: check that all conflicted files are resolved (no conflict markers remain), then complete the merge commit.

1. Run build/lint if the project has them — report results
2. If stash was created in Phase 1, remind user to `git stash pop` and check for stash conflicts
3. Present summary:

```
PULL COMPLETE
═══════════════════════════════════════
Commits merged   : 14
Total conflicts  : 8
  Auto-resolved  : 3 (trivial)
  Spec-resolved  : 5 (via spx-ff → spx-apply)
Backup ref       : backup/pull-20260209-160530
Change used      : resolve-merge-conflicts-20260209
═══════════════════════════════════════

RESOLUTION DETAILS:
  src/services/auth.ts — Kept REMOTE (token rotation)
  src/middleware/verify.ts — Updated expiry + kept local rate-limiting
  src/config/auth.ts — Set TOKEN_TTL=3600
  src/services/payment.ts — Kept LOCAL (30% cap, after-tax)
  src/api/routes.ts — Custom: kept /v2, removed /v1

AUTO-RESOLVED (review if needed):
  src/utils/helpers.ts — kept both imports
  package-lock.json — regenerated
  src/styles/main.css — whitespace merged
```

4. Ask user: **confirm** the pull result, or **rollback** via `git reset --hard backup/pull-{timestamp}`

ABORT HANDLING

If the user says "abort", "stop", "rollback", or "cancel" at any point:
1. Run `git merge --abort` if merge is in progress
2. Pop stash if one was created (`git stash pop`)
3. Confirm working tree is back to pre-pull state
4. Report what happened

PRINCIPLES

- Never auto-resolve a conflict you're not confident about — when in doubt, classify as non-trivial
- Trivial = mechanical, no business logic involved. Non-trivial = anything requiring judgment
- Group related conflicts and ask one business decision per group, not per file
- Explain trade-offs in human terms — don't just show diffs, show impact
- User MUST confirm decisions before routing to spx-ff — never skip the decision step
- The spx-ff description must be self-contained — include all conflict context and confirmed decisions so spx-ff doesn't need to re-analyze
- Do NOT auto-invoke `/spx-ff` or `/spx-apply` — suggest next steps and let the user decide
- Every decision (auto or user-confirmed) must appear in the final summary
- If stash was used, always remind user about it at the end

The following is the user's request: