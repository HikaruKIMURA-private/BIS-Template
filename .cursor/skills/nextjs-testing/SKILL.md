---
name: nextjs-testing
description: Next.js App Router プロジェクトのテスト実装ガイド。Vitest での単体/結合テスト、Playwright での E2E テスト、Storybook のカタログ運用方針を定義する。テストコードの新規作成、テスト方針の確認時に使用する。
---

# Next.js テスト実装ガイド

## テスト開発ワークフロー（必須）

テストケースとテスト実装を **同時に書かない**。必ず2段階で進める。

**Step 1 — ケース列挙**: `it.todo()` でタイトルのみ先に網羅する。

```ts
describe("submitProfileForm", () => {
  it.todo("未認証時にエラーを返す");
  it.todo("バリデーションエラー時に適切なエラーを返す");
  it.todo("新規プロフィールが実DBに作成される");
  it.todo("既存プロフィールが実DBで更新される");
});
```

チェック: 正常系/異常系、境界値/空データ、認証/権限、タイトルは「何が」「どうなる」。

**Step 2 — 実装**: `it.todo()` → `it()` に1つずつ置き換え。タイトルに忠実に書く。

> ケースを先に書くことで実装に引きずられず、振る舞いを俯瞰的に設計できる。

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

迷ったときの原則:
- **データが正しく永続化されるか** を確かめたい → 古典学派
- **ユーザーに何が見えるか** を確かめたい → ロンドン学派
- **壊れたときにどうなるか** を確かめたい → ロンドン学派（エラー注入）
- **画面遷移を含む一連のフロー** を確かめたい → E2E

## 学派別パターン一覧

### 古典学派（実DB接続 — `*.test.ts`）

DB をモックせず実際の `postgres_test` に接続。auth / Next.js API のみモック。

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

依存をすべてモックし、テスト対象の振る舞いのみ検証。

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

| 対象 | 手法 | 使用場面 |
| --- | --- | --- |
| Server Action | `vi.mock("../actions/foo")` | Client Component |
| `useActionState` | `vi.mock("react")` 部分モック | Client Component |
| `@/auth` | `vi.mock("@/auth")` | Server Action (古典) |
| `next/headers` | `vi.mock("next/headers")` | Server Action (古典) |
| `next/navigation` | `vi.mock("next/navigation")` — redirect は throw | Server Action (古典) |
| `next/cache` | `vi.mock("next/cache")` | Server Action (古典) |
| `next-themes` | `vi.mock("next-themes")` | テーマ Component |
| DB (`@/db`) | **モックしない** | 古典学派テスト全般 |
| DB (`@/db`) | `vi.mock("@/db")` | `*.error.test.ts` のみ |

## テスト用 DB

- 専用 DB `postgres_test` を Supabase ローカル上に使用（`pnpm db:start` が前提）
- `vitest.global-setup.ts` で Docker 経由自動作成 + Drizzle マイグレーション
- `vitest.config.js` の `env` で `DATABASE_URL` を注入
- テストデータは固定 ID + `beforeEach`/`afterEach` でテストデータのみクリーンアップ

## 禁止パターン

- テストケースとテスト実装を同時に書く（ケース列挙が先）
- Storybook play 関数で `expect()` アサーション
- async Server Component を vitest でテスト（E2E を使う）
- Server Action / Data Fetching で DB をモック（`*.error.test.ts` を除く）
- テストファイルをソースと別ディレクトリに配置
