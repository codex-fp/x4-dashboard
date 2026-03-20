---
description: Pick the next task, refine if needed, ship it, and close the issue if complete
agent: build
---

User constraint or override: $ARGUMENTS

Run the full delivery loop for `x4-dashboard`:

- Select one implementation-ready task or open issue to deliver now by using `next-task-through-delivery` as @product-manager.
- If the best next task is not implementation-ready yet, refine it first via `refine-task-to-implementation-ready` and then continue once the task is ready.
- Prefer the best roadmap-aligned issue unless `$ARGUMENTS` narrows the choice by issue number, milestone, label, or theme.
- Hand off a concrete implementation brief to @developer.
- As @developer use `implement-task-with-local-commit` skill, implement the work, run the relevant validation, create a Conventional Commit, and push the current branch because this command explicitly authorizes the push.
- After the @developer returns, verify the delivered scope and use `close-or-update-issue-after-delivery` skill as @product-manager to update or close the related issue.
- If delivery changed roadmap or milestone state, follow with `roadmap-issue-sync` skill as @product-manager.

Stop early only if no viable next task exists or refinement still leaves a real blocker, and report the unblock instead of guessing.

After you're done give a report on your work including the task, solution and approach.
