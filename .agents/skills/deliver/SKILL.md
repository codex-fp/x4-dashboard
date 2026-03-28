---
name: deliver
description: Run the end-to-end x4-dashboard delivery workflow. Use when Codex should choose the next prioritized task or use a user-specified one, refine it into implementation-ready scope, implement it, verify it, iterate on failures, hand it to the user for acceptance, deploy the accepted delivery, and summarize the resulting progress.
---

# Deliver

## Workflow

1. Start from the delivery target:
   - If the user provides an issue ID, issue URL, or concrete task, send that exact task through `refine`.
   - If the user does not provide a task, choose the best next task from current priorities and milestone state through `refine`.
2. Use `refine` as the readiness gate:
   - Close scope, acceptance, and validation gaps until the task is implementation-ready.
   - If refinement still leaves a blocker, stop and report the blocker instead of inventing scope.
3. When the task is implementation-ready, hand it to `implement`.
4. When implementation is ready, hand the latest brief plus developer handoff to `verify`.
5. Respond to the verification outcome:
   - `fail`: send the verified repro and missing expectation back to `implement`, then run `verify` again.
   - `blocked`: stop the loop, explain what is blocked, why it is blocked, and what is needed to continue.
   - `pass`: prepare short user acceptance scenarios and present them before moving on.
6. Respond to user acceptance:
   - If the user rejects the delivery or gives feedback, route that feedback back through `implement`, then repeat `verify`.
   - If the user accepts the delivery, continue with `deploy` for the agreed delivery scope.
7. Close the workflow with a concise delivery summary and progress update.

## Output

- Current delivery stage and why the workflow is there
- Explicit `refine`, `implement`, `verify`, acceptance, and `deploy` outcomes
- Blockers or failed verification reasons with next-step guidance
- User acceptance scenarios after a passing verification
- Delivery summary and progress impact

## Guardrails

- Do not skip `refine` when the task is under-specified.
- Do not let `verify` implement fixes; route failures back through `implement`.
- Do not continue to `deploy` after a failed or blocked verification.
- Do not treat blocked verification as a coding failure; explain the external or environmental constraint clearly.
- Do not invent new rollout scope during `deploy`; keep it anchored to the accepted delivery and repository-wide release rules.
