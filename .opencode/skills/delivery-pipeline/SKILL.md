---
name: delivery-pipeline
description: Orchestrate the full delivery loop for x4-dashboard - select task, delegate to developer, verify with tester, and close or update the GitHub issue.
compatibility: opencode
---

# Delivery Pipeline

## Use this when

- The user wants one command or workflow to move from planning to implementation, verification, and issue cleanup.
- `product-manager` should choose the next task, make it implementation-ready when needed, and delegate the build work to `developer`.
- The flow should end with a verified QA gate before GitHub issue hygiene.

## Workflow

### 1. Task Selection

Start by loading the minimum planning context needed:
- Read `ROADMAP.md` to understand current milestone priorities
- Check open GitHub issues for the current milestone
- Prefer tasks from the nearest release milestone over future releases
- Prefer concrete open GitHub issues over vague ideas
- Use user constraints such as issue number, milestone, label, or theme when provided
- If nothing is a viable next candidate, stop and report the specific unblock

### 2. Refinement Check

Check whether the selected task is implementation-ready:
- If scope, acceptance, UX decisions, dependencies, or system boundaries are still too vague, load `refine-task` first
- Use the refined issue or brief as the source of truth before delegating implementation
- If refinement still cannot close a blocker, stop and report the blocker clearly

### 3. Implementation Handoff

Turn the selected task into a tight implementation brief for `developer`:
- Issue number and title
- Goal, scope, and non-goals
- Acceptance cues, relevant files, and validation expectations when known

Launch `developer` with that brief:
- Tell it to load `implement-task`
- Tell it the parent workflow explicitly authorizes a normal `git push` after the local Conventional Commit
- Ask it to report touched files, validation, commit hash, branch, whether the issue scope is fully complete, and how `tester` should verify the change

### 4. Verification Handoff

Launch `tester` with the same brief plus the latest `developer` result:
- Tell it to load `verify-task`
- Ask it to return to the orchestrator immediately with an explicit `pass`, `fail`, or `blocked` outcome
- Ask it to include the verification mode, tested scenarios, repro steps for failures, and whether the task can be handed to `product-manager`

### 5. Failure Loop

When `tester` returns `fail`:
- Hand the failure report, original brief, and latest implementation context back to `developer`
- Ask `developer` to fix only the reported gap or obvious related regression, then report the updated validation and retest instructions
- Send the updated result back to `tester`
- Repeat until `tester` returns `pass` or a real blocker remains

### 6. Issue Closure

Review the final `developer` and `tester` results before touching GitHub state:
- Confirm the delivered work matches the intended issue scope
- Close the issue only when the accepted scope is implemented and `tester` returned `pass`
- Keep the issue open when important scope, verification, or follow-up still remains

### 7. Issue Update

Update the GitHub issue with a concise delivery note:
- Mention the implemented outcome
- Mention validation that passed
- Mention the verification result and any blocker or failure still remaining
- Link follow-up work if the result is partial
- Close the issue only when implementation is complete and `tester` returned `pass`
- Keep the issue open and narrow the remaining scope when delivery is partial, verification failed, or verification is blocked

### 8. Roadmap Sync

If the result changes roadmap or milestone status, update `ROADMAP.md` accordingly.

## Output

- Which task was selected and why it was next
- Whether refinement was needed and what was clarified
- What `developer` delivered, including validation and pushed branch or commit details
- What `tester` verified, including the final `pass`, `fail`, or `blocked` outcome
- Whether the issue was updated, closed, or left open with narrowed follow-up scope

## Guardrails

- Do not send a not-ready task straight to `developer`.
- Do not bypass `tester` and close an implementation issue on coding alone unless a real blocker prevents verification.
- Do not select a vague task when a concrete ready issue exists unless the user explicitly constrained the choice.
- Do not force-push, rewrite history, tag, or create a release.
- Do not close an issue optimistically when acceptance or verification is still incomplete.
- Respect explicit user constraints before default prioritization.