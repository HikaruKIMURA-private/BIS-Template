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

### Test Philosophy

**単体テストの「単体」= 1つの振る舞い（古典派）。** 1つのクラスや関数ではなく、1つの振る舞い（behavior）を検証する。

**良いテストの4つの柱:**

1. **リグレッションに対する保護** — コードは負債。できるだけ多くのプロダクションコードを実行させる
2. **リファクタリングへの耐性** — 実装の詳細ではなく最終的な結果を検証する。モックより実際のデータ・依存関係を使う（モックは実装の詳細に紐づきやすい）
3. **迅速なフィードバック** — 単体テストでなるべくカバーし、実行速度を維持する
4. **保守性の良さ** — テストコード自体が読みやすく、変更しやすい状態を保つ

**柱の優先ルール:**
- リファクタリングへの耐性は **常に最大化** する（妥協しない）
- リグレッション保護と迅速なフィードバックはトレードオフ。テストレイヤーで調整する

**テストピラミッド:**

| レイヤー | 量 | 主な役割 | トレードオフ |
| --- | --- | --- | --- |
| 単体テスト | 最多 | フィードバック速度を優先しつつリグレッション保護を確保 | 速度◎ / 保護○ |
| 結合テスト | 少数 | 単体で再現困難なレアケース + 全依存を通るハッピーパス | 速度○ / 保護◎ |
| E2E テスト | 最少 | Vitest 結合テストでカバーできないフロー（認証・画面遷移等）のみ | 速度△ / 保護◎ |

- E2E は結合テストの一部。Vitest 結合テストでカバー済みなら Playwright E2E は作らない
- テスト方針の技術的な詳細は `.cursor/skills/nextjs-testing/SKILL.md` に従う

### TDD Workflow (Implementation Phase)

`/kiro/spec-impl` による実装は **テスト駆動** で行う。

**Test List は「計画」であり確定仕様ではない。** `it.todo()` で列挙するテストケースは動的に更新される計画として扱う。実装中に新しいケースを発見したら追加し、不要になったケースは削除する。

**実装タスクごとの進め方:**
1. **Test List を作る** — `it.todo()` でテストケースを列挙する
2. **1つ選んでテストを書く** — `it.todo()` → `it()` に変換し、失敗を確認する (Red)
3. **実装する** — テストが通る最小限のプロダクションコードを書く (Green)
4. **リファクタリングする** — テストが通ったまま整理する (Refactor)
5. **次のテストへ** — 2 に戻る。実装中に新ケースを発見したら `it.todo()` で Test List に追加する

**`/kiro/spec-tasks` でのタスク生成ルール:**
- 実装タスクの **前に** 対応するテストタスクを配置する
- テストが不要なタスク（スキーマ定義、マイグレーション生成等）はそのまま単独タスクとする

## Steering Configuration

- Load entire `.kiro/steering/` as project memory
- Default files: `product.md`, `tech.md`, `structure.md`
- Custom files are supported (managed via `/kiro/steering-custom`)
