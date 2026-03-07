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

### Testing

- **方針**: TDD で開発する。プロセスとテスタブルなコード設計は `AGENTS.md` を参照
- **Unit**: Vitest + Testing Library（jsdom）— `*.test.tsx`
- **Integration**: Vitest（node + 実DB `postgres_test`）— `*.test.ts`
  - auth / next/* のみモック。DB はモックしない
  - DB エラーテストのみモック（`*.error.test.ts`）
- **Visual**: Storybook 10 + Chromatic（カタログ専用、`pnpm test` から除外）
- **E2E**: Playwright（`e2e/`）— 認証フロー・ページ遷移・async Server Component

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
