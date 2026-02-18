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

### Schema & Actions

**Location**: `app/schema.ts`, `app/actions.ts`  
**Purpose**: Zod スキーマと Server Action をルートレベルで定義  
**Pattern**: スキーマと Action は同一ディレクトリに配置し、フォームコンポーネントからインポート

### Database Layer

**Location**: `src/db/schema.ts`, `src/index.ts`  
**Purpose**: Drizzle ORM スキーマ定義とデータベース接続  
**Pattern**: `src/` 配下に DB 関連を集約

### Auth Configuration

**Location**: `auth.ts`（サーバー）, `lib/auth-client.ts`（クライアント）  
**Purpose**: Better Auth の設定。サーバー用とクライアント用を明確に分離

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
- **スキーマ/アクション**: camelCase（`schema.ts`, `actions.ts`）
- **テスト**: `*.test.tsx`（ソースと同一ディレクトリにコロケーション）
- **Storybook**: `*.stories.tsx`（`stories/` ディレクトリに配置）

## Import Organization

```typescript
// 1. UI プリミティブ（@/ エイリアス）
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// 2. ライブラリ・ユーティリティ（@/ エイリアス）
import { authClient } from "@/lib/auth-client";
import { db } from "@/src/index";

// 3. ローカルモジュール（相対パス）
import { profileFormSchema } from "../schema";
import { submitProfileForm } from "../actions";
```

**Path Aliases**:

- `@/`: プロジェクトルート（`./`）にマップ

## Code Organization Principles

- **"use client" / "use server" の明示**: クライアントコンポーネントとServer Actionは先頭にディレクティブを記述
- **スキーマ共有**: Zod スキーマはサーバー・クライアント双方からインポートし、バリデーションロジックを一元化
- **コロケーション**: テストファイルはソースファイルと同じディレクトリに配置
- **Route Group 活用**: `(auth)`, `(protected)` でルートを論理グルーピングし、レイアウトとミドルウェアの適用範囲を制御

---

_Document patterns, not file trees. New files following patterns shouldn't require updates_
