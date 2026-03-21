---
name: next-task-through-delivery
description: Select the best next task, refine it if needed, drive a developer-tester delivery loop, and close or narrow the issue based on implementation plus verification.
compatibility: opencode
---

# Next Task Through Delivery

## Use this when

- The user wants one command or workflow to move from planning to implementation, verification, and issue cleanup.
- `product-manager` should choose the next task, make it implementation-ready when needed, and delegate the build work to `developer`.
- The flow should end with a verified QA gate before GitHub issue hygiene.

## Workflow

1. Start by loading the minimum planning context needed and use `project-status-and-next-steps` to choose the best next task.
   - prefer concrete open GitHub issues over vague ideas
   - use user constraints such as issue number, milestone, label, or theme when provided
   - if nothing is even a viable next candidate, stop and report the specific unblock
2. Check whether the selected task is implementation-ready.
   - if scope, acceptance, UX decisions, dependencies, or system boundaries are still too vague, load `refine-task-to-implementation-ready` first
   - use the refined issue or brief as the source of truth before delegating implementation
   - if refinement still cannot close a blocker, stop and report the blocker clearly
3. Turn the selected task into a tight implementation brief for `developer`.
   - issue number and title
   - goal, scope, and non-goals
   - acceptance cues, relevant files, and validation expectations when known
4. Launch `developer` with that brief.
   - tell it to load `implement-task-with-local-commit`
   - tell it the parent workflow explicitly authorizes a normal `git push` after the local Conventional Commit
   - ask it to report touched files, validation, commit hash, branch, whether the issue scope is fully complete, and how `tester` should verify the change
5. Launch `tester` with the same brief plus the latest `developer` result.
   - tell it to load `verify-delivered-task`
   - ask it to return to the orchestrator immediately with an explicit `pass`, `fail`, or `blocked` outcome
   - ask it to include the verification mode, tested scenarios, repro steps for failures, and whether the task can be handed to `product-manager`
6. When `tester` returns `fail`, loop back to `developer`.
   - hand the failure report, original brief, and latest implementation context back to `developer`
   - ask `developer` to fix only the reported gap or obvious related regression, then report the updated validation and retest instructions
   - send the updated result back to `tester`
   - repeat until `tester` returns `pass` or a real blocker remains
7. Review the final `developer` and `tester` results before touching GitHub state.
   - confirm the delivered work matches the intended issue scope
   - close the issue only when the accepted scope is implemented and `tester` returned `pass`
   - keep the issue open when important scope, verification, or follow-up still remains
8. Use `close-or-update-issue-after-delivery` to record the outcome.
   - leave a concise delivery note
   - close the issue only when implementation is complete and `tester` returned `pass`
   - keep the issue open and narrow the remaining scope when delivery is partial, failed verification, or blocked
9. If the result changes roadmap or milestone status, follow with `roadmap-issue-sync`.

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
