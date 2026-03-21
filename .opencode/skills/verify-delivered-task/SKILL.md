---
name: verify-delivered-task
description: Verify delivered x4-dashboard work through manual-style app testing, then report pass, fail, or blocked with clear evidence for the orchestrator.
compatibility: opencode
---

# Verify Delivered Task

## Use this when

- `developer` has finished an implementation and the next step is independent verification.
- The goal is to simulate a focused manual test by running the app and interacting with the delivered feature.
- The orchestrator needs a clear gate before handing the task to `product-manager`.

## Workflow

1. Start from the original implementation brief and the latest `developer` handoff.
   - identify the accepted scope, non-goals, validation already run, and any suggested verification steps
   - note any setup details, mock-mode expectations, or known caveats before running anything
2. Choose the most relevant verification mode.
   - prefer the lightest realistic mode that can verify the feature, usually `npm run dev:mock`, `npm run dev`, `npm run mock`, or `npm start`
   - use the browser dashboard flow first for dashboard features
   - use Electron only when the delivered scope depends on launcher behavior or desktop packaging
3. Run the application and perform manual-style verification.
   - use the available runtime and browser interaction tools to open the app, navigate to the delivered feature, and exercise the main acceptance path
   - cover the core acceptance criteria plus obvious regressions caused by the change
   - do not expand into unrelated exploratory testing that would hide the task outcome
4. Decide the outcome as soon as it is clear.
   - `pass` when the accepted scope works as intended and no blocking regression was found in the tested path
   - `fail` when you can reproduce a defect in the delivered scope or an obvious regression caused by it
   - `blocked` when verification cannot continue because of environment issues, missing setup, missing data, or unresolved product ambiguity
5. Return immediately to the orchestrator once you have a clear outcome.
   - for `fail`, include repro steps, expected behavior, actual behavior, and the most useful next action for `developer`
   - for `blocked`, include the exact blocker and what would unblock retesting
   - for `pass`, include the tested scenarios and why the task can now be handed to `product-manager`

## Output

- Verification mode, commands, and environment used
- Tested scenarios and acceptance cues covered
- Explicit outcome: `pass`, `fail`, or `blocked`
- Repro steps and expected versus actual behavior for failures
- Whether the task can be handed to `product-manager` now

## Guardrails

- Do not implement fixes; return failures to `developer`.
- Do not write automated tests in this workflow.
- Do not block on unrelated issues that are outside the accepted scope unless they are clear regressions caused by the change.
- Do not keep testing after the outcome is already clear.
