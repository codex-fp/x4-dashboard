---
name: close-or-update-issue-after-delivery
description: Update or close GitHub issues after implementation and verification so task state does not go stale.
---

# Close Or Update Issue After Delivery

## Use this when

- Technical work has just completed implementation and verification, or verification is blocked with a clear reason.
- A `developer` handoff and a `tester` result indicate an issue should be updated or closed.
- The user asks to finish the planning/admin side after implementation and testing.

## Workflow

1. Identify the relevant GitHub issue or issues from user context, recent commits, or current discussion.
2. Review the delivered work at a high level:
   - what changed
   - what validation ran
   - what `tester` verified and whether the outcome was `pass`, `fail`, or `blocked`
   - whether any follow-up remains
3. Update the issue with a concise delivery note.
   - mention the implemented outcome
   - mention validation that passed
   - mention the verification result and any blocker or failure still remaining
   - link follow-up work if the result is partial
4. Close the issue only when the accepted scope is clearly complete and `tester` returned `pass`.
5. Keep the issue open and narrow the remaining scope when the work is partial, verification failed, or verification is blocked.
6. If delivery changed the roadmap picture, follow with `roadmap-issue-sync`.

## Output

- Which issues were updated or closed
- What implementation and verification state was recorded
- Any follow-up issue or roadmap action that still remains

## Guardrails

- Do not close issues optimistically if key acceptance is still missing or `tester` has not returned `pass`.
- Do not close milestones or create releases unless the user explicitly asks.
