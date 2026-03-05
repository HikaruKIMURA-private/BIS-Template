# Technology Stack

## Architecture

Next.js App Router ベースのフルスタックアプリケーション。React Server Components と Server Actions を中心とした設計で、クライアント・サーバー間の境界を明確に管理する。React Compiler を有効化し、パフォーマンス最適化を自動化。

## Core Technologies

- **Language**: TypeScript（strict mode）
- **Framework**: Next.js 16（App Router）
- **Runtime**: Node.js + React 19
- **Package Manager**: pnpm

## Key Libraries

| カテゴリ       | ライブラリ                                       | 用途                                             |
| -------------- | ------------------------------------------------ | ------------------------------------------------ |
| 認証           | Better Auth                                      | Email/Password + OAuth 認証                      |
| フォーム       | Conform (`@conform-to/react`, `@conform-to/zod`) | Server Action 対応フォーム処理                   |
| バリデーション | Zod                                              | スキーマ定義・バリデーション                     |
| ORM            | Drizzle ORM                                      | 型安全なデータベースクエリ                       |
| DB             | PostgreSQL（Supabase）                           | データストア                                     |
| UI             | Radix UI + Tailwind CSS v4                       | アクセシブルなUIプリミティブ + ユーティリティCSS |
| テーマ         | next-themes                                      | ダークモード対応                                 |

## Development Standards

### Type Safety

- TypeScript strict mode 有効
- `noEmit` 設定でビルドと型チェックを分離
- Zod スキーマからの型推論で二重定義を回避

### Code Quality

- OxLint（`oxlint`）による高速リント + OxFmt（`oxfmt`）による自動整形
- `.oxlintrc.json` でルール設定、`.oxfmtrc.json` でフォーマット設定

### Testability

テスタブルなコードを書くことを最優先とする。

- **純粋関数を優先**: 同じ入力に対して同じ出力を返す関数を基本単位とする。副作用（DB・外部 API・ファイル I/O）は関数の境界に押し出す
- **依存は引数で渡す**: グローバル状態やモジュールスコープの変数に直接依存しない。テスト時に差し替え可能な設計にする
- **小さな関数に分割**: 1つの関数が複数の責務を持たない。バリデーション・変換・永続化は別関数に分離する
- **コンポーネントはプレゼンテーションとロジックを分離**: hooks にロジックを切り出し、コンポーネントは表示に専念する

### Testing

- **開発手法**: TDD（テスト駆動開発）。実装の前にテストを書く。詳細は `.cursor/skills/nextjs-testing/SKILL.md`
- **Unit**: Vitest + Testing Library（jsdom）。`*.test.tsx` で Client Component をテスト
- **Integration**: Vitest（node + 実DB）。`*.test.ts` で Server Action / Data Fetching を実 PostgreSQL (postgres_test) でテスト
  - auth / `next/headers` / `next/navigation` / `next/cache` のみモック。DB はモックしない
  - テスト用 DB は `vitest.global-setup.ts` で自動作成・マイグレーション
  - DB エラーのテストのみモック（`*.error.test.ts`）
  - async Server Component は vitest 非対応のため E2E でカバー
- **Visual**: Storybook 10 + Chromatic（コンポーネントカタログ専用、`pnpm test` からは除外）
- **E2E**: Playwright（`e2e/` ディレクトリ、`pnpm e2e` で実行。認証フロー・ページ遷移・async Server Component）

## Development Environment

### Required Tools

- Node.js 20+
- pnpm
- Supabase CLI（ローカル DB）

### Common Commands

```bash
# Dev: pnpm dev
# Build: pnpm build
# Test (unit/integration): pnpm test
# E2E: pnpm e2e
# Storybook (catalog only): pnpm storybook
# Type Check: pnpm typecheck
# Lint: pnpm lint (oxlint --fix)
# Format: pnpm fmt (oxfmt)
# DB Migrate: pnpm db:migrate
# DB Start: pnpm db:start
```

## Key Technical Decisions

- **React Compiler 有効化**: `reactCompiler: true` で自動メモ化。手動の `useMemo`/`useCallback` を最小限に
- **Server Actions + Conform**: フォーム送信を Server Action で処理し、Conform でクライアント・サーバー両方のバリデーションを統一
- **Better Auth + Drizzle Adapter**: 認証テーブルを Drizzle スキーマで管理し、アプリケーションデータと同一の ORM で操作
- **Path Alias `@/`**: プロジェクトルートからの絶対パスインポートを標準化

---

_Document standards and patterns, not every dependency_
