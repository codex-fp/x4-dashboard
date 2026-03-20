---
name: next-task-through-delivery
description: Select the best next task, refine it if needed, delegate implementation, push the result, and close or narrow the issue based on delivered scope.
compatibility: opencode
---

# Next Task Through Delivery

## Use this when

- The user wants one command or workflow to move from planning to implementation and issue cleanup.
- `product-manager` should choose the next task, make it implementation-ready when needed, and delegate the build work to `developer`.
- The flow should end with verified GitHub issue hygiene instead of stopping at a local commit.

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
   - ask it to report touched files, validation, commit hash, branch, and whether the issue scope is fully complete
5. Review the developer result before touching GitHub state.
   - confirm the reported work matches the intended issue scope
   - inspect local git context or the delivered diff at a high level if needed
   - keep the issue open when important scope, validation, or follow-up still remains
6. Use `close-or-update-issue-after-delivery` to record the outcome.
   - leave a concise delivery note
   - close the issue only when the accepted scope is clearly complete
   - keep the issue open and narrow the remaining scope when delivery is partial
7. If the result changes roadmap or milestone status, follow with `roadmap-issue-sync`.

## Output

- Which task was selected and why it was next
- Whether refinement was needed and what was clarified
- What `developer` delivered, including validation and pushed branch or commit details
- Whether the issue was updated, closed, or left open with narrowed follow-up scope

## Guardrails

- Do not send a not-ready task straight to `developer`.
- Do not select a vague task when a concrete ready issue exists unless the user explicitly constrained the choice.
- Do not force-push, rewrite history, tag, or create a release.
- Do not close an issue optimistically when acceptance is still incomplete.
- Respect explicit user constraints before default prioritization.
