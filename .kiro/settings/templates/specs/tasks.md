# Implementation Plan

## TDD とタスク順序

- **順序**: 検証可能な振る舞いを追加・変更する実装タスクの **直前** に、対応する **テストタスク** を置く。**例外**: テスト対象がないタスク（スキーマ定義のみ、生成マイグレーションのみ、設定のみなど）には、その前にテストタスクを置かない。
- **1 単位あたり**（テストタスク → 実装タスク）: 先にケースを列挙する（`it.todo()` またはチェックリスト）—**この段階ではアサーションは書かない**—そのうえで 1 ケースずつ、失敗するテスト → 最小の実装 → リファクタリング。テスト一覧は **計画** であり確定仕様ではない。学びに応じてケースを追加・削除する。
- **詳細の正本**: [`AGENTS.md`](../../../../AGENTS.md)（**TDD Workflow (Implementation Phase)**、**`/kiro/spec-tasks` のルール**）。

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
