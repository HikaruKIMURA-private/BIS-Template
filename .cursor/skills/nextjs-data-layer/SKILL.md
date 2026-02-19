---
name: nextjs-data-layer
description: Next.js の Server Actions と Data Fetching のディレクトリ構成ガイド。app/actions/ に Server Action、app/data/ にデータ取得関数を配置する。新機能追加、Server Action作成、データフェッチ実装時に使用する。
---

# Next.js データレイヤー構成ガイド

このプロジェクトでは、Server Actions とデータ取得関数を以下のディレクトリ構成で管理する。

## ディレクトリ構成

```
app/
├── actions/                    # Server Actions（書き込み系）
│   ├── profile.ts              # プロフィール関連
│   ├── order.ts                # 注文関連
│   └── __mocks__/              # Storybook用モック
│       ├── profile.ts
│       └── order.ts
├── data/                       # Data Fetching（読み取り系）
│   ├── profile.ts              # プロフィール取得
│   ├── order.ts                # 注文取得
│   └── user.ts                 # ユーザー取得
└── schema.ts                   # 共通スキーマ・型定義
```

## 配置ルール

### app/actions/

**用途**: データの作成・更新・削除を行う Server Action

| 条件 | 配置先 |
|------|--------|
| フォーム送信処理 | `app/actions/機能名.ts` |
| データ変更処理（CRUD の CUD） | `app/actions/機能名.ts` |
| `"use server"` ディレクティブが必要な関数 | `app/actions/機能名.ts` |

### app/data/

**用途**: データの取得のみを行う関数（Server Component から呼び出す）

| 条件 | 配置先 |
|------|--------|
| DB からのデータ取得 | `app/data/機能名.ts` |
| 外部 API からのデータ取得 | `app/data/機能名.ts` |
| ページで使用するデータフェッチ | `app/data/機能名.ts` |

## 実装パターン

### Server Action（app/actions/）

```ts
// app/actions/profile.ts
"use server";

import type { SubmissionResult } from "@conform-to/react";
import { parseWithZod } from "@conform-to/zod/v3";
import { auth } from "@/auth";
import { db } from "@/db";
import { profile } from "@/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { type ProfileFormData, profileFormSchema } from "../schema";

export type FormActionResult =
  | SubmissionResult<string[]>
  | { status: "success"; message: string; value: ProfileFormData };

export async function submitProfileForm(
  _prevState: FormActionResult | undefined,
  formData: FormData
): Promise<FormActionResult> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return {
      status: "error",
      error: { "": ["認証が必要です"] },
    } as SubmissionResult<string[]>;
  }

  const submission = parseWithZod(formData, { schema: profileFormSchema });

  if (submission.status !== "success") {
    return submission.reply();
  }

  // DB操作...
}
```

### Data Fetching（app/data/）

```ts
// app/data/profile.ts
import { db } from "@/db";
import { profile } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getUserProfile(userId: string) {
  const result = await db
    .select({
      name: profile.name,
      gender: profile.gender,
      birthDate: profile.birthDate,
      note: profile.note,
    })
    .from(profile)
    .where(eq(profile.userId, userId))
    .limit(1);

  return result[0] ?? null;
}
```

### ページでの使用

```tsx
// app/(protected)/dashboard/page.tsx
import { auth } from "@/auth";
import { getUserProfile } from "@/app/data/profile";
import { headers } from "next/headers";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const profileData = await getUserProfile(session.user.id);

  return <div>{/* ... */}</div>;
}
```

## モックの配置

Storybook 用のモックは `app/actions/__mocks__/` に配置する。

```ts
// app/actions/__mocks__/profile.ts
import { fn } from "storybook/test";

export const submitProfileForm = fn()
  .mockName("submitProfileForm")
  .mockResolvedValue(undefined);
```

**重要**: モックファイルは `app/__mocks__/actions/` ではなく `app/actions/__mocks__/` に配置する。

## 命名規則

| 種別 | 命名パターン | 例 |
|------|-------------|-----|
| Server Action（作成） | `create機能名` | `createOrder` |
| Server Action（更新） | `update機能名` | `updateProfile` |
| Server Action（削除） | `delete機能名` | `deleteComment` |
| Server Action（フォーム） | `submit機能名Form` | `submitProfileForm` |
| Data Fetching | `get機能名` | `getUserProfile` |
| Data Fetching（一覧） | `get機能名List` / `get機能名s` | `getOrderList` |

## 禁止パターン

```tsx
// NG: ページ内にデータフェッチロジックを直接記述
export default async function Page() {
  const data = await db.select().from(table).where(...); // app/data/ に切り出す
}

// NG: app/actions.ts のようなルート直下のファイル
// → app/actions/機能名.ts に配置する

// NG: モックを app/__mocks__/actions/ に配置
// → app/actions/__mocks__/ に配置する
```
