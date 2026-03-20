---
name: nextjs-testing
description: Next.js App Router プロジェクトのテスト実装ガイド。Vitest での単体/結合テスト、Playwright での E2E テスト、Storybook のカタログ運用方針を定義する。テストコードの新規作成、テスト方針の確認時に使用する。
---

# Next.js テスト実装ガイド

> TDD ワークフロー、テスト哲学（4つの柱）、テストピラミッドの原則は `AGENTS.md` を参照。

## 古典学派の検証観点（実装詳細に依存しない）

**古典学派（テスト哲学）** は、モックの多寡（下記「学派の選び方」の表）とは別軸で、**リファクタリング耐性**を最大化するための検証の持ち方である。`AGENTS.md` の「良いテストの4つの柱」の第2柱と同じ考え方に立つ。

- **検証する:** 外部から観測できる**最終的な結果** — 返却値、永続化後の DB 状態（`*.test.ts`）、画面上の表示・操作の結果・ユーザー向けメッセージ（`*.test.tsx`）など、振る舞いの契約として意味のある出力
- **避ける:** 実装の詳細への固着 — 非公開 API の直接テスト、リファクタリングで変わりうる内部構造の固定、**モックの呼び出し回数・順序だけ**を目的としたアサーション（プロセス外依存のモックは技術的制約として許容するが、検証の主眼は観測可能な結果に置く）

レイヤー別のイメージ: 単体でも結合でも E2E でも、**「何が起きたか」** を主張し、**「内部でどう実現したか」** はテストの主役にしない。

## ケース列挙とテストコードの分離

テストを書くときは **先にケースだけを列挙し、テストコード（アサーション、セットアップ、モック配線など）は後から書く**。列挙は `it.todo()` のラベルやチェックリストにとどめ、Red を取るための `it()` 本体は列挙が一段落してから 1 ケースずつ埋める。

**狙い:** ケースとコードを同時に書き進めると、不要に多いケースや過剰な分岐が増えやすい。列挙フェーズと記述フェーズを分け、必要なケースだけを選んでからコード化する。詳細な手順は `AGENTS.md` の TDD Workflow を参照する。

## テストレイヤーの判断フロー

1. まず **単体テスト** で書けないか検討する（デフォルト）
2. DB を含む依存関係を通すハッピーパス、または単体で再現困難なレアケース → **結合テスト**
3. Vitest 結合テストでカバー済みなら Playwright E2E は **作らない**
4. 画面遷移・認証フローなど Vitest では検証不可能なもののみ → **E2E**

**4つの柱とレイヤーの対応:**

| 柱 | 単体テスト | 結合テスト | E2E |
| --- | --- | --- | --- |
| リグレッション保護 | ○ 多数のケースで広くカバー | ◎ 実依存で高い信頼性 | ◎ 本番同等の信頼性 |
| リファクタリング耐性 | ◎ 振る舞いのみ検証 | ◎ 実データで検証 | ◎ ユーザー視点で検証 |
| 迅速なフィードバック | ◎ ミリ秒〜秒 | ○ 秒〜十秒 | △ 十秒〜分 |
| 保守性 | ◎ スコープが小さい | ○ セットアップがやや複雑 | △ 壊れやすく修正コスト高 |

## レイヤー構成

| レイヤー | ツール | 環境 | 対象 | ファイル |
| --- | --- | --- | --- | --- |
| 単体 | Vitest + Testing Library | jsdom | Client Component | `*.test.tsx` |
| 結合 | Vitest | node + 実DB | Server Action, Data Fetching | `*.test.ts` |
| エラー | Vitest | node | DB エラー等（モック） | `*.error.test.ts` |
| E2E | Playwright | ブラウザ | 認証, ページ遷移, async RSC | `e2e/*.spec.ts` |
| カタログ | Storybook | ブラウザ | 見た目確認, VRT | `stories/*.stories.tsx` |

- Storybook は `pnpm test` から除外。play 関数に `expect()` を含めない
- `*.test.tsx` = jsdom / `*.test.ts` = node + 実DB。拡張子で自動振り分け
- 全テストファイルはソースと同一ディレクトリにコロケーション（E2E, Storybook を除く）

## 学派の選び方

| 判断基準 | 古典学派（実DB） | ロンドン学派（モック） |
| --- | --- | --- |
| DB に読み書きするロジックが本質 | **採用** — クエリ・トランザクションの正しさを実証 | 不適 — モックするとテストの意味が薄れる |
| UI の表示・操作が本質 | 不適 — jsdom では DB 接続不可 | **採用** — 依存をモックして UI だけに集中 |
| 外部依存の異常系を検証したい | 不適 — 実 DB でエラーを再現しにくい | **採用** — モックで任意のエラーを注入 |
| フォームバリデーション（Conform/Zod） | 不適 — クライアント側ロジック | **採用** — jsdom 上で submit → エラー表示を検証 |
| 認証・リダイレクト・キャッシュ無効化 | 部分採用 — auth/next/* はモック、DB は実接続 | — |
| 複数テーブルにまたがる整合性 | **採用** — 実 DB で FK・制約を含めて検証 | 不適 — モックでは制約違反を検出できない |
| async Server Component の描画 | どちらも不適 — **E2E（Playwright）を使う** | — |

迷ったときの原則（4つの柱を踏まえて）:
- **データが正しく永続化されるか** を確かめたい → 古典学派（リグレッション保護◎）
- **ユーザーに何が見えるか** を確かめたい → ロンドン学派（フィードバック速度◎）
- **壊れたときにどうなるか** を確かめたい → ロンドン学派・エラー注入（リグレッション保護のレアケース）
- **画面遷移を含む一連のフロー** を確かめたい → E2E（Vitest 結合テストでカバー不可の場合のみ）
- いずれの場合も **リファクタリング耐性を最大化** する: 実装の詳細ではなく、**観測可能な最終結果・振る舞い**を検証する（上記「古典学派の検証観点」を参照）

## 学派別パターン一覧

### 古典学派（実DB接続 — `*.test.ts`）

DB をモックせず実際の `postgres_test` に接続。auth / Next.js API のみモック。アサーションは **クエリの書き方そのもの** より、**実行後の DB 状態・戻り値・リダイレクト等の観測可能な結果** を主眼に置く（「古典学派の検証観点」に沿う）。

| 対象 | テストすべき観点 |
| --- | --- |
| Server Action | 未認証エラー、バリデーションエラー、新規 insert、既存 update、redirect 呼び出し |
| Data Fetching | データ存在時の戻り値、データ未存在時の null |

共通構造:

```ts
// app/actions/foo.test.ts or app/data/foo.test.ts
const TEST_USER_ID = "test-user-xxx"; // テストごとに固定ID

// Server Action の場合のみ: auth / Next.js API モック
vi.mock("@/auth", () => ({ auth: { api: { getSession: (...args: unknown[]) => mockGetSession(...args) } } }));
vi.mock("next/headers", () => ({ headers: vi.fn().mockResolvedValue(new Headers()) }));
vi.mock("next/navigation", () => ({ redirect: (...args: unknown[]) => { mockRedirect(...args); throw new Error("NEXT_REDIRECT"); } }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

async function cleanupTestData() {
  await db.delete(myTable).where(eq(myTable.userId, TEST_USER_ID));
  await db.delete(user).where(eq(user.id, TEST_USER_ID));
}

beforeEach(async () => { vi.clearAllMocks(); await cleanupTestData(); });
afterEach(async () => { await cleanupTestData(); });

// Arrange: db.insert() でデータ投入
// Act: 関数呼び出し
// Assert: db.select() で DB 状態を検証、または戻り値を検証
```

### ロンドン学派（全モック — `*.test.tsx` / `*.error.test.ts`）

依存をすべてモックし、テスト対象の振る舞いのみ検証する。モックは jsdom 等の制約で必要になることが多いが、**アサーションの主眼は UI・フォーム上の観測可能な結果**に置き、「古典学派の検証観点」と矛盾しない（モックの細部より、ユーザーに見える状態を見る）。

| 対象 | ファイル | テストすべき観点 |
| --- | --- | --- |
| Client Component | `*.test.tsx` | レンダリング、ユーザー操作、isPending 状態、成功/エラー表示、props 分岐 |
| フォームバリデーション | `*.test.tsx` | 空送信エラー、部分入力エラー、正常入力でエラーなし |
| DB エラーハンドリング | `*.error.test.ts` | DB 例外時のエラーレスポンス |

Client Component の構造:

```tsx
// app/components/Foo.test.tsx
vi.mock("../actions/foo", () => ({ myAction: vi.fn() }));
vi.mock("react", async () => {
  const actual = await vi.importActual<typeof import("react")>("react");
  return { ...actual, useActionState: vi.fn() };
});

beforeEach(async () => {
  const { useActionState } = await import("react");
  (useActionState as ReturnType<typeof vi.fn>).mockReturnValue([undefined, vi.fn(), false]);
});
```

DB エラーの構造:

```ts
// app/actions/foo.error.test.ts — DB / drizzle-orm をモックしてエラー注入
vi.mock("@/db", () => ({ db: { select: vi.fn(), insert: vi.fn(), update: vi.fn() } }));
vi.mock("drizzle-orm", () => ({ eq: vi.fn() }));
```

## モック早見表

| 対象 | 分類 | 手法 | 使用場面 |
| --- | --- | --- | --- |
| DB (`@/db`) | 共有依存 | **モックしない**（順次実行で隔離） | `*.test.ts` 全般 |
| DB (`@/db`) | 共有依存 | `vi.mock("@/db")` | `*.error.test.ts` のみ（エラー注入） |
| `@/auth` | プロセス外依存 | `vi.mock("@/auth")` | Server Action (古典) |
| `next/headers` | プロセス外依存 | `vi.mock("next/headers")` | Server Action (古典) |
| `next/navigation` | プロセス外依存 | `vi.mock("next/navigation")` — redirect は throw | Server Action (古典) |
| `next/cache` | プロセス外依存 | `vi.mock("next/cache")` | Server Action (古典) |
| Server Action | プライベート依存 | `vi.mock("../actions/foo")` | Client Component（jsdom で実行不可） |
| `useActionState` | プライベート依存 | `vi.mock("react")` 部分モック | Client Component |
| `next-themes` | プロセス外依存 | `vi.mock("next-themes")` | テーマ Component |

## テスト用 DB

- 専用 DB `postgres_test` を Supabase ローカル上に使用（`pnpm db:start` が前提）
- `vitest.global-setup.ts` で Docker 経由自動作成 + Drizzle マイグレーション
- `vitest.config.js` の `env` で `DATABASE_URL` を注入
- テストデータは固定 ID + `beforeEach`/`afterEach` でテストデータのみクリーンアップ
- DB を使うテスト（`*.test.ts`）は `fileParallelism: false` で全て順次実行し、テストケース間の干渉を防ぐ
- DB モックは `*.error.test.ts`（エラー注入）のみ許容。それ以外で DB モックが必要になった場合、まずテスト設計の見直しを検討する

## 禁止パターン

- Storybook play 関数で `expect()` アサーション
- async Server Component を vitest でテスト（E2E を使う）
- Server Action / Data Fetching で DB をモック（`*.error.test.ts` を除く）
- テストファイルをソースと別ディレクトリに配置