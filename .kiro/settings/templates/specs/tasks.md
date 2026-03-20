# Implementation Plan

## TDD and task order

- **Order**: Put a **test task immediately before** each implementation task that adds or changes verifiable behavior. **Exception**: tasks with no test target (schema-only, generated migrations, pure config) have **no** preceding test task.
- **Per slice** (test task then implementation task): enumerate cases first (`it.todo()` or checklist)—**no assertions yet**—then for one case at a time: failing test → minimal code → refactor. The test list is a **plan**, not fixed spec; add or drop cases as you learn.
- **Authoritative detail**: [`AGENTS.md`](../../../../AGENTS.md) (**TDD Workflow (Implementation Phase)**, **`/kiro/spec-tasks` rules**).

## Task Format Template

Use whichever pattern fits the work breakdown:

### Major task only

- [ ] {{NUMBER}}. {{TASK_DESCRIPTION}}{{PARALLEL_MARK}}
  - {{DETAIL_ITEM_1}} _(Include details only when needed. If the task stands alone, omit bullet items.)_
  - _Requirements: {{REQUIREMENT_IDS}}_

### Major + Sub-task structure

- [ ] {{MAJOR_NUMBER}}. {{MAJOR_TASK_SUMMARY}}
- [ ] {{MAJOR_NUMBER}}.{{SUB_NUMBER}} {{SUB_TASK_DESCRIPTION}}{{SUB_PARALLEL_MARK}}
  - {{DETAIL_ITEM_1}}
  - {{DETAIL_ITEM_2}}
  - _Requirements: {{REQUIREMENT_IDS}}_ _(IDs only; do not add descriptions or parentheses.)_

> **Parallel marker**: Append ` (P)` only to tasks that can be executed in parallel. Omit the marker when running in `--sequential` mode. Do **not** parallelize a **test task** with its **following implementation task** for the same behavior—implementation depends on the test work.
>
> **Checkbox `*`**: Use `- [ ]*` only for **deferred or out-of-scope** test work (e.g. next sprint). Default TDD tasks use `- [ ]` with no asterisk; **ordering** expresses test-before-implementation. Explain referenced requirements in the detail bullets when using `*`.
