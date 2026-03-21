---
name: implement-task-with-local-commit
description: Implement a concrete x4-dashboard task, run the right validation, and create a local Conventional Commit checkpoint without asking.
---

# Implement Task With Local Commit

## Use this when

- The user or an issue defines a concrete implementation task.
- The expected output is code, config, docs, or release-support changes inside this repository.

## Workflow

1. Start from the concrete task or issue context.
   - If the request is still too ambiguous to implement safely, ask one targeted question.
2. Read `AGENTS.md` and only the files needed for the task.
3. Make the smallest coherent change that satisfies the request.
   - avoid unrelated refactors
   - preserve existing module boundaries and repo conventions
4. Run the most relevant validation when practical:
   - TypeScript changes -> `npm run typecheck`
   - packaging or release changes -> the most relevant release command from `AGENTS.md`
   - if validation is not practical, say exactly what remains to verify
5. Once you reach a meaningful checkpoint, create a local commit without asking.
   - use Conventional Commits
   - choose an accurate type and scope
   - commit only the files relevant to that checkpoint
6. If the user or parent workflow explicitly asks for a push, push the current branch after the local commit and report the branch or remote result.
7. Report touched files, validation results, and clear retest guidance for `tester`.
   - include how to run the feature
   - include the main acceptance path or scenarios to verify
   - include mock-mode, seed data, or setup details when relevant
8. State whether the implementation appears complete, but leave the final delivery gate to `tester` and `product-manager`.

## Guardrails

- Never push unless the user or parent workflow explicitly asks.
- Never rewrite history or force-push unless the user explicitly asks.
- Work around unrelated local changes; do not revert them.
- If the task is mostly roadmap, issues, milestones, or release planning rather than implementation, hand it off to `product-manager`.
