---
name: refine-task
description: Turn a not-yet-ready x4-dashboard task into an implementation-ready issue or brief by closing scope and acceptance gaps.
compatibility: opencode
permissions:
  - question
---

# Refine Task

## Use this when

- A GitHub issue, roadmap item, or user request is valuable but still too vague to implement safely.
- The next goal is not coding yet; it is to remove ambiguity until `developer` can execute without major product questions.
- The task may need user decisions, but the agent should first gather as much context as possible from the repo, issue, and roadmap.

## Workflow

1. Start by understanding the current task and why it is not ready.
   - Inspect the issue, roadmap entry, or user brief
   - Read only the relevant repo context needed to understand impacted areas
   - Identify the concrete gaps blocking implementation, such as unclear goal, missing scope edges, no acceptance criteria, unresolved UX choice, missing dependency, or unclear owner/system boundary
2. Close gaps without asking the user unless it is truly necessary.
   - Infer defaults from existing code, product vocabulary, roadmap language, and nearby issues
   - Make reasonable recommendations instead of escalating every uncertainty
3. When user input is needed, use the `question` tool.
   - Ask one question at a time
   - Keep each question targeted to a real implementation blocker
   - Provide 3-4 concise options and put the recommended option first with `(Recommended)` in the label
   - Explain briefly what changes depending on the answer
   - Stop asking once the task is ready; do not over-interview
4. Produce an implementation-ready refinement.
   - Rewrite the task or issue so it includes, when applicable:
   - Clear summary/title
   - `Goal`
   - `Scope`
   - `Non-goals`
   - `Acceptance Criteria`
   - Acceptance criteria that `tester` can verify through observable behavior when practical
   - Relevant files or systems
   - Validation expectations
   - Dependencies, rollout notes, or follow-up items if they materially affect delivery
5. Prefer updating the existing planning artifact instead of creating duplicates.
   - Update the GitHub issue if one exists
   - Update `ROADMAP.md` only if the planning picture changes
   - Create a new issue only when there is no appropriate existing home for the refined task
6. Finish with a readiness check.
   - Confirm the task is specific enough that `developer` could implement it with at most minor clarifications
   - If it is still not ready, state the exact remaining blocker instead of pretending it is ready

## Output

- What was unclear at the start
- What decisions or assumptions were made
- The final implementation-ready task or issue shape
- Any remaining risks, dependencies, or follow-up work

## Guardrails

- Do not start implementation code from this skill.
- Do not ask the user broad open-ended questions when a targeted decision will do.
- Do not leave acceptance criteria implicit.
- Do not create duplicate issues when an existing one can be refined.
- If the task is already implementation-ready, say so and avoid churn.