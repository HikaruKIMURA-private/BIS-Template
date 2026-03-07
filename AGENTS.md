# AI-DLC and Spec-Driven Development

Kiro-style Spec Driven Development implementation on AI-DLC (AI Development Life Cycle)

## Project Context

### Paths

- Steering: `.kiro/steering/`
- Specs: `.kiro/specs/`

### Steering vs Specification

**Steering** (`.kiro/steering/`) - Guide AI with project-wide rules and context
**Specs** (`.kiro/specs/`) - Formalize development process for individual features

### Active Specifications

- Check `.kiro/specs/` for active specifications
- Use `/kiro/spec-status [feature-name]` to check progress

## Development Guidelines

- Think in English, generate responses in Japanese. All Markdown content written to project files (e.g., requirements.md, design.md, tasks.md, research.md, validation reports) MUST be written in the target language configured for this specification (see spec.json.language).

## Minimal Workflow

- Phase 0 (optional): `/kiro/steering`, `/kiro/steering-custom`
- Phase 1 (Specification):
  - `/kiro/spec-init "description"`
  - `/kiro/spec-requirements {feature}`
  - `/kiro/validate-gap {feature}` (optional: for existing codebase)
  - `/kiro/spec-design {feature} [-y]`
  - `/kiro/validate-design {feature}` (optional: design review)
  - `/kiro/spec-tasks {feature} [-y]`
- Phase 2 (Implementation): `/kiro/spec-impl {feature} [tasks]`
  - `/kiro/validate-impl {feature}` (optional: after implementation)
- Progress check: `/kiro/spec-status {feature}` (use anytime)

## Development Rules

- 3-phase approval workflow: Requirements → Design → Tasks → Implementation
- Human review required each phase; use `-y` only for intentional fast-track
- Keep steering current and verify alignment with `/kiro/spec-status`
- Follow the user's instructions precisely, and within that scope act autonomously: gather the necessary context and complete the requested work end-to-end in this run, asking questions only when essential information is missing or the instructions are critically ambiguous.

### Testable Code

テスタブルなコードを常に意識する。テストしにくいコードは設計の問題であり、モックの追加ではなくコード構造の改善で解決する。

- 純粋関数を優先し、副作用は関数の境界に押し出す
- バリデーション・データ変換・永続化は別関数に分離する
- コンポーネントはプレゼンテーションとロジック（hooks）を分離する
- 依存は引数で渡し、テスト時に差し替え可能にする

### TDD Workflow (Implementation Phase)

`/kiro/spec-impl` による実装は **テスト駆動** で行う。

**原則:**
- テストは **実装の詳細ではなく結果（振る舞い）** を検証する。内部構造に依存したテストは書かない
- テスト方針の詳細は `.cursor/skills/nextjs-testing/SKILL.md` に従う

**実装タスクごとの進め方:**
1. **テストを書く** — 以下の2段階で進める。テストケースとテストコードを同時に書かない
   - **ケース列挙**: `it.todo()` でテストケースのタイトルのみ先に網羅する
   - **テスト実装**: `it.todo()` を `it()` に1つずつ置き換え、テストコードを書く。実行して **失敗することを確認** する
2. **実装する** — テストが通る最小限のプロダクションコードを書く
3. **リファクタリングする** — コードを整理し、**テストが通ったままであること** を確認する

**`/kiro/spec-tasks` でのタスク生成ルール:**
- 実装タスクの **前に** 対応するテストタスクを配置する
- テストが不要なタスク（スキーマ定義、マイグレーション生成等）はそのまま単独タスクとする

## Steering Configuration

- Load entire `.kiro/steering/` as project memory
- Default files: `product.md`, `tech.md`, `structure.md`
- Custom files are supported (managed via `/kiro/steering-custom`)
