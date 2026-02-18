---
name: nextjs-form
description: Next.js のフォーム実装ガイド。conform, zod, Server Action, useActionState を必須とする。フォームの新規作成、バリデーション、Server Action の実装時に使用する。
---

# Next.js フォーム実装ガイド

このプロジェクトでは、フォーム実装に以下の技術スタックを **必須** とする。

| ライブラリ                                  | 用途                                 |
| ------------------------------------------- | ------------------------------------ |
| **zod**                                     | バリデーションスキーマ定義           |
| **@conform-to/react** + **@conform-to/zod** | フォーム状態管理・バリデーション連携 |
| **Server Action** (`"use server"`)          | フォーム送信処理                     |
| **useActionState** (React 19)               | Server Action の状態管理             |

> `useState` によるフォーム管理や `onSubmit` で `e.preventDefault()` する従来パターンは **禁止**。

## 実装手順

### 1. Zod スキーマを定義する

`schema.ts` に Zod スキーマと型を定義する。

```ts
// app/feature/schema.ts
import { z } from "zod";

export const myFormSchema = z.object({
  name: z
    .string({ required_error: "名前は必須です" })
    .min(1, "名前は必須です")
    .max(50, "名前は50文字以内で入力してください"),
  email: z
    .string({ required_error: "メールアドレスは必須です" })
    .email("有効なメールアドレスを入力してください"),
  note: z.string().max(500, "500文字以内で入力してください").optional(),
});

export type MyFormData = z.infer<typeof myFormSchema>;
```

### 2. Server Action を定義する

`actions.ts` に `"use server"` ディレクティブ付きで定義する。

```ts
// app/feature/actions.ts
"use server";

import type { SubmissionResult } from "@conform-to/react";
import { parseWithZod } from "@conform-to/zod/v3";
import { type MyFormData, myFormSchema } from "./schema";

export type FormActionResult =
  | SubmissionResult<string[]>
  | { status: "success"; message: string; value: MyFormData };

export async function submitMyForm(
  _prevState: FormActionResult | undefined,
  formData: FormData
): Promise<FormActionResult> {
  const submission = parseWithZod(formData, { schema: myFormSchema });

  if (submission.status !== "success") {
    return submission.reply();
  }

  const data = submission.value as MyFormData;

  try {
    // DB保存等のビジネスロジック
    return {
      status: "success" as const,
      message: "保存しました",
      value: data,
    };
  } catch (error) {
    console.error("保存エラー:", error);
    return {
      status: "error",
      error: { "": ["保存に失敗しました。"] },
    } as SubmissionResult<string[]>;
  }
}
```

**Server Action のシグネチャ規約:**

```ts
async function actionName(
  _prevState: FormActionResult | undefined,
  formData: FormData
): Promise<FormActionResult>;
```

- 第1引数: `useActionState` から渡される前回の結果
- 第2引数: `FormData`
- サーバー側でも `parseWithZod` でバリデーションを実行する（クライアントバリデーションを信用しない）

### 3. フォームコンポーネントを実装する

```tsx
// app/feature/components/MyForm.tsx
"use client";

import { getInputProps, getTextareaProps, useForm } from "@conform-to/react";
import { parseWithZod } from "@conform-to/zod/v3";
import { useActionState } from "react";
import { submitMyForm } from "../actions";
import { myFormSchema } from "../schema";

export function MyForm() {
  const [lastResult, formAction, isPending] = useActionState(
    submitMyForm,
    undefined
  );

  const [form, fields] = useForm({
    lastResult,
    defaultValue: {
      name: "",
      email: "",
      note: "",
    },
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: myFormSchema });
    },
    shouldValidate: "onBlur",
    shouldRevalidate: "onInput",
  });

  return (
    <form id={form.id} onSubmit={form.onSubmit} action={formAction} noValidate>
      {/* 各フィールド */}
      <input {...getInputProps(fields.name, { type: "text" })} />
      {fields.name.errors?.length > 0 && (
        <p role="alert">{fields.name.errors[0]}</p>
      )}

      <textarea {...getTextareaProps(fields.note)} />

      {/* フォーム全体のエラー */}
      {form.errors && <p role="alert">{form.errors[0]}</p>}

      {/* 成功メッセージ */}
      {lastResult?.status === "success" && "message" in lastResult && (
        <p role="alert">{lastResult.message}</p>
      )}

      <button type="submit" disabled={isPending}>
        {isPending ? "送信中..." : "送信"}
      </button>
    </form>
  );
}
```

## 必須パターン

### form 要素の属性

```tsx
<form
  id={form.id}           // conform が管理する ID
  onSubmit={form.onSubmit} // クライアントバリデーション
  action={formAction}      // useActionState から取得した Server Action
  noValidate               // ブラウザ標準バリデーション無効化
>
```

### input のヘルパー関数

| 要素                      | ヘルパー                                                     |
| ------------------------- | ------------------------------------------------------------ |
| `<input>`                 | `getInputProps(fields.xxx, { type: "text" })`                |
| `<textarea>`              | `getTextareaProps(fields.xxx)`                               |
| `<select>`                | `getSelectProps(fields.xxx)`                                 |
| `<input type="radio">`    | `getInputProps(fields.xxx, { type: "radio", value: "..." })` |
| `<input type="checkbox">` | `getInputProps(fields.xxx, { type: "checkbox" })`            |

### エラー表示

```tsx
{
  fields.xxx.errors && fields.xxx.errors.length > 0 && (
    <p id={`${fields.xxx.id}-error`} role="alert">
      {fields.xxx.errors[0]}
    </p>
  );
}
```

### 送信状態の管理

`isPending`（`useActionState` の第3返り値）を使い、送信中はボタンを `disabled` にする。

## 禁止パターン

以下のパターンは **使用禁止** とする。

```tsx
// NG: useState でフォーム値を管理
const [name, setName] = useState("");
<input value={name} onChange={(e) => setName(e.target.value)} />

// NG: e.preventDefault() で送信をハンドリング
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  // ...
};

// NG: fetch / axios で直接 API を呼ぶ
const handleSubmit = async () => {
  await fetch("/api/submit", { method: "POST", body: ... });
};

// NG: useFormState (非推奨) を使う
import { useFormState } from "react-dom"; // useActionState を使うこと
```

## ファイル構成

```
app/feature/
├── schema.ts          # Zod スキーマ + 型定義
├── actions.ts         # Server Action ("use server")
└── components/
    └── MyForm.tsx     # フォームコンポーネント ("use client")
```

## 追加リソース

- conformのAPI詳細・フィールド一覧については [reference.md](reference.md) を参照
