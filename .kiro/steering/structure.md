# Project Structure

## Organization Philosophy

Next.js App Router の規約に沿った **ルートベース構成** を採用。ドメインロジック（スキーマ、アクション）はルートに近い場所に配置し、再利用可能な UI コンポーネントはプロジェクトルートの `components/` に分離する。

## Directory Patterns

### App Routes

**Location**: `app/`  
**Purpose**: ページ、レイアウト、ルート固有コンポーネント  
**Pattern**: Route Group による論理グルーピング

- `app/(auth)/` — 認証ページ（login, signup）
- `app/(protected)/` — 認証必須ページ（dashboard）
- `app/api/auth/[...all]/` — Better Auth API ハンドラ

### Feature Components

**Location**: `app/components/`  
**Purpose**: 特定機能に紐づくクライアントコンポーネント  
**Example**: `UserForm.tsx`, `ProfileCard.tsx`, `LogoutButton.tsx`

### UI Primitives

**Location**: `components/ui/`  
**Purpose**: 再利用可能な汎用 UI コンポーネント（Radix UI ベース）  
**Pattern**: 1コンポーネント = 1ファイル、CVA でバリアント管理  
**Example**: `button.tsx`, `input.tsx`, `card.tsx`

### Schema

**Location**: `app/schema.ts`  
**Purpose**: Zod スキーマをルートレベルで定義  
**Pattern**: サーバー・クライアント双方からインポートし、バリデーションロジックを一元化

### Server Actions

**Location**: `app/actions/`  
**Purpose**: Server Action をドメイン単位でファイル分割  
**Pattern**: 1ドメイン = 1ファイル（例: `app/actions/profile.ts`）。先頭に `"use server"` ディレクティブ  
**Example**: `profile.ts` — プロフィール CRUD の Server Action

### Data Fetching

**Location**: `app/data/`  
**Purpose**: サーバーサイドのデータ取得関数をドメイン単位で分離  
**Pattern**: 1ドメイン = 1ファイル（例: `app/data/profile.ts`）。Server Component から呼び出す純粋な関数

### Database Layer

**Location**: `db/schema.ts`, `db/index.ts`  
**Purpose**: Drizzle ORM スキーマ定義とデータベース接続  
**Pattern**: プロジェクトルートの `db/` に DB 関連を集約

### Auth Configuration

**Location**: `auth.ts`（サーバー）, `lib/auth-client.ts`（クライアント）  
**Purpose**: Better Auth の設定。サーバー用とクライアント用を明確に分離

### Middleware

**Location**: `proxy.ts`  
**Purpose**: ルート保護とリダイレクト制御  
**Pattern**: 認証状態に基づく保護ルート（`/dashboard`）と認証ルート（`/login`, `/signup`）のアクセス制御

### E2E Tests

**Location**: `e2e/`  
**Purpose**: Playwright による E2E テスト  
**Pattern**: 機能単位でファイル分割（例: `login.spec.ts`）。`pnpm e2e` で実行

### Utilities

**Location**: `lib/`  
**Purpose**: 共有ユーティリティ関数  
**Example**: `utils.ts`（`cn` 関数）, `base-url.ts`, `auth-client.ts`

### Stories & Tests

**Location**: `stories/`（Storybook）, `*.test.tsx`（テスト、コロケーション）  
**Purpose**: Storybook ストーリーは `stories/` に集約、テストファイルはソースと同一ディレクトリ

## Naming Conventions

- **UI コンポーネント**: kebab-case（`button.tsx`, `radio-group.tsx`）
- **Feature コンポーネント**: PascalCase（`UserForm.tsx`, `ProfileCard.tsx`）
- **ページ**: `page.tsx`（Next.js 規約）
- **スキーマ/アクション/データ**: camelCase（`schema.ts`, `actions/profile.ts`, `data/profile.ts`）
- **Unit テスト**: `*.test.tsx`（ソースと同一ディレクトリにコロケーション）
- **E2E テスト**: `*.spec.ts`（`e2e/` ディレクトリに配置）
- **Storybook**: `*.stories.tsx`（`stories/` ディレクトリに配置）

## Import Organization

```typescript
// 1. UI プリミティブ（@/ エイリアス）
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// 2. ライブラリ・ユーティリティ（@/ エイリアス）
import { authClient } from "@/lib/auth-client";
import { db } from "@/db";

// 3. ローカルモジュール（相対パス）
import { profileFormSchema } from "../schema";
import { submitProfileForm } from "../actions/profile";
```

**Path Aliases**:

- `@/`: プロジェクトルート（`./`）にマップ

## Code Organization Principles

- **"use client" / "use server" の明示**: クライアントコンポーネントとServer Actionは先頭にディレクティブを記述
- **スキーマ共有**: Zod スキーマはサーバー・クライアント双方からインポートし、バリデーションロジックを一元化
- **Actions/Data 分離**: Server Action は `app/actions/`、データ取得は `app/data/` にドメイン単位で分離
- **コロケーション**: Unit テストファイルはソースファイルと同じディレクトリに配置。E2E テストは `e2e/` に集約
- **Route Group 活用**: `(auth)`, `(protected)` でルートを論理グルーピングし、レイアウトとミドルウェアの適用範囲を制御

---

_Document patterns, not file trees. New files following patterns shouldn't require updates_
