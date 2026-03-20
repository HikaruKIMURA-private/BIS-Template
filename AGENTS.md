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

**単体テストの3条件:**

1. 「単体」と呼ばれる少量のコードを検証する
2. 実行時間が短い
3. 隔離された状態で実行される（古典学派の隔離 = テストケース同士の隔離）

上記を1つでも満たさないテストは **統合テスト** に分類される。

**依存の分類とモック方針（古典学派）:**

単体テストの隔離対象は「テストケース同士」である（古典学派）。

- **共有依存**（DB、ファイルシステム等）— テストケース間で状態を共有し相互干渉する依存。**実体を使い、順次実行で隔離する**。順次実行でも解決不可能な場合に限りモックする（限りなくゼロを目指す）。
- **プライベート依存**（他のクラス・関数等）— テスト対象のみが使う依存。**モックせず実体を使う**。リファクタリング耐性とリグレッション保護が向上する。
- **プロセス外依存**（auth, next/headers 等）— テスト環境で動作しない外部 API。**モックする**（技術的制約）。

**良いテストの4つの柱:**

1. **リグレッションに対する保護** — コードは負債。できるだけ多くのプロダクションコードを実行させるが、取るに足らないコードはテストしない。ロジックの核となる重要な部分を重点的にテストする。偽陰性を減らすことがリグレッションへの耐性をあげる。
2. **リファクタリングへの耐性** — 実装の詳細ではなく最終的な結果を検証する。プライベート依存（他のクラス・関数）は実体を使い、モックしない。モックは実装の詳細に紐付きやすく、偽陽性を引き起こす原因になる。なわちリファクタリングの耐性を下げることにつながるので、モックは最小限にとどめる。
3. **迅速なフィードバック** — 単体テストでなるべくカバーし、実行速度を維持する
4. **保守性の良さ** — テストコード自体が読みやすく、変更しやすい状態を保つ

**柱の優先ルール:**

- リファクタリングへの耐性は **常に最大化** する（妥協しない）
- リグレッション保護と迅速なフィードバックはトレードオフ。テストレイヤーで調整する

**テストピラミッド:**

| レイヤー   | 量   | 主な役割                                                        | トレードオフ  |
| ---------- | ---- | --------------------------------------------------------------- | ------------- |
| 単体テスト | 最多 | フィードバック速度を優先しつつリグレッション保護を確保          | 速度◎ / 保護○ |
| 結合テスト | 少数 | 単体で再現困難なレアケース + 全依存を通るハッピーパス           | 速度○ / 保護◎ |
| E2E テスト | 最少 | Vitest 結合テストでカバーできないフロー（認証・画面遷移等）のみ | 速度△ / 保護◎ |

- E2E は結合テストの一部。Vitest 結合テストでカバー済みなら Playwright E2E は作らない

**レイヤー選定の判断フロー:**

1. まず **単体テスト** で書けないか検討する（デフォルト）
2. DB を含む依存関係を通すハッピーパス、または単体で再現困難なレアケース → **結合テスト**
3. Vitest 結合テストでカバー済みなら Playwright E2E は **作らない**
4. 画面遷移・認証フローなど Vitest では検証不可能なもののみ → **E2E**

**柱とレイヤーの対応（トレードオフのイメージ）:**

| 柱                 | 単体テスト | 結合テスト | E2E |
| ------------------ | ---------- | ---------- | --- |
| リグレッション保護 | ○ 多数のケースで広くカバー | ◎ 実依存で高い信頼性 | ◎ 本番同等の信頼性 |
| リファクタリング耐性 | ◎ 振る舞いのみ検証 | ◎ 実データで検証 | ◎ ユーザー視点で検証 |
| 迅速なフィードバック | ◎ ミリ秒〜秒 | ○ 秒〜十秒 | △ 十秒〜分 |
| 保守性             | ◎ スコープが小さい | ○ セットアップがやや複雑 | △ 壊れやすく修正コスト高 |

**古典学派の検証観点（実装詳細に依存しない）:**

モックの多寡（ロンドン学派との使い分け）とは別軸で、**リファクタリング耐性**を最大化するための検証の持ち方である。上記「良いテストの4つの柱」の第2柱と同じ考え方に立つ。

- **検証する:** 外部から観測できる**最終的な結果** — 返却値、永続化後の DB 状態（結合テスト）、画面上の表示・操作の結果・ユーザー向けメッセージ（単体の UI テスト）など、振る舞いの契約として意味のある出力
- **避ける:** 実装の詳細への固着 — 非公開 API の直接テスト、リファクタリングで変わりうる内部構造の固定、**モックの呼び出し回数・順序だけ**を目的としたアサーション（プロセス外依存のモックは技術的制約として許容するが、検証の主眼は観測可能な結果に置く）

単体・結合・E2E のいずれでも、**「何が起きたか」** を主張し、**「内部でどう実現したか」** をテストの主役にしない。

- **原則・哲学・ピラミッド・TDD** はこの `AGENTS.md` を正とする
- **Next.js 固有の実装**（Vitest / Playwright / Storybook の配置、モック早見表、テスト用 DB、コード例）は `.cursor/skills/nextjs-testing/SKILL.md` を参照する

### TDD Workflow (Implementation Phase)

`/kiro/spec-impl` による実装は **テスト駆動** で行う。

**Test List は「計画」であり確定仕様ではない。** `it.todo()` で列挙するテストケースは動的に更新される計画として扱う。実装中に新しいケースを発見したら追加し、不要になったケースは削除する。

**ケース列挙とテストコードは分ける。** まず「どの振る舞い・境界を検証するか」をケースだけ列挙し、その後にテストコード（アサーション、セットアップ、モック配線など）を書く。ケースとコードを同時に書き進めると、不要に多いケースや過剰な分岐が増えやすいため、列挙フェーズと記述フェーズを意識的に分離する。列挙は `it.todo()` の名前付けやチェックリストだけに留め、Red を取るための本体は次のステップで書く。

**実装タスクごとの進め方:**

1. **ケースを列挙する** — 検証したい振る舞いを一覧化する（`it.todo()` の見出し、またはメモ）。**この段階ではテスト本体（アサーションや実行コード）は書かない**
2. **1つ選んでテストを書く** — `it.todo()` → `it()` に変換し、失敗を確認する (Red)
3. **実装する** — テストが通る最小限のプロダクションコードを書く (Green)
4. **リファクタリングする** — テストが通ったまま整理する (Refactor)
5. **次のテストへ** — 2 に戻る。実装中に新ケースを発見したら、まず列挙（1）に戻るか `it.todo()` を追加する

**`/kiro/spec-tasks` でのタスク生成ルール:**

- 実装タスクの **前に** 対応するテストタスクを配置する
- テストが不要なタスク（スキーマ定義、マイグレーション生成等）はそのまま単独タスクとする

## Steering Configuration

- Load entire `.kiro/steering/` as project memory
- Default files: `product.md`, `tech.md`, `structure.md`
- Custom files are supported (managed via `/kiro/steering-custom`)
