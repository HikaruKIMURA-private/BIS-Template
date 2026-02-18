# conform リファレンス

## インポートパス

```ts
// React ヘルパー
import {
  useForm,
  getInputProps,
  getTextareaProps,
  getSelectProps,
  getFormProps,
  getFieldsetProps,
  getCollectionProps,
} from "@conform-to/react";

// Zod 連携（v3 サブパスを使う）
import { parseWithZod } from "@conform-to/zod/v3";
```

> `@conform-to/zod` ではなく `@conform-to/zod/v3` を使用すること。

## useForm オプション

```ts
const [form, fields] = useForm({
  // useActionState の lastResult を渡す
  lastResult,

  // フォームのデフォルト値
  defaultValue: { name: "", email: "" },

  // クライアントサイドバリデーション
  onValidate({ formData }) {
    return parseWithZod(formData, { schema: mySchema });
  },

  // バリデーションタイミング
  shouldValidate: "onBlur", // 初回バリデーション: フォーカスアウト時
  shouldRevalidate: "onInput", // 再バリデーション: 入力時
});
```

## getInputProps の type 一覧

```ts
getInputProps(fields.xxx, { type: "text" });
getInputProps(fields.xxx, { type: "email" });
getInputProps(fields.xxx, { type: "password" });
getInputProps(fields.xxx, { type: "number" });
getInputProps(fields.xxx, { type: "date" });
getInputProps(fields.xxx, { type: "hidden" });
getInputProps(fields.xxx, { type: "radio", value: "option1" });
getInputProps(fields.xxx, { type: "checkbox" });
getInputProps(fields.xxx, { type: "checkbox", value: "option1" }); // チェックボックスグループ
getInputProps(fields.xxx, { type: "file" });
```

## ネストされたオブジェクト

```ts
// スキーマ
const schema = z.object({
  address: z.object({
    city: z.string(),
    zip: z.string(),
  }),
});

// コンポーネント
const address = fields.address.getFieldset();
<input {...getInputProps(address.city, { type: "text" })} />
<input {...getInputProps(address.zip, { type: "text" })} />
```

## 配列フィールド (FieldList)

```ts
import { useForm, getInputProps, getFieldsetProps } from "@conform-to/react";

// スキーマ
const schema = z.object({
  items: z.array(
    z.object({ name: z.string(), quantity: z.number() })
  ),
});

// コンポーネント
const items = fields.items.getFieldList();

{items.map((item, index) => {
  const itemFields = item.getFieldset();
  return (
    <fieldset key={item.key} {...getFieldsetProps(item)}>
      <input {...getInputProps(itemFields.name, { type: "text" })} />
      <input {...getInputProps(itemFields.quantity, { type: "number" })} />
      <button {...form.remove.getButtonProps({ name: fields.items.name, index })}>
        削除
      </button>
    </fieldset>
  );
})}

<button {...form.insert.getButtonProps({ name: fields.items.name })}>
  追加
</button>
```

## Intent ボタン（下書き保存 / 送信の出し分け）

```ts
// スキーマ
const schema = z.discriminatedUnion("intent", [
  z.object({ intent: z.literal("draft"), title: z.string() }),
  z.object({ intent: z.literal("publish"), title: z.string().min(1), body: z.string().min(1) }),
]);

// コンポーネント
<button type="submit" name="intent" value="draft">下書き保存</button>
<button type="submit" name="intent" value="publish">公開</button>
```

## Server Action での parseWithZod パターン

```ts
"use server";

import { parseWithZod } from "@conform-to/zod/v3";

export async function myAction(
  _prevState: FormActionResult | undefined,
  formData: FormData
): Promise<FormActionResult> {
  const submission = parseWithZod(formData, { schema: mySchema });

  // バリデーションエラー
  if (submission.status !== "success") {
    return submission.reply();
  }

  // サーバー側バリデーション（DB 重複チェック等）で追加エラーを返す場合
  const exists = await checkDuplicate(submission.value.email);
  if (exists) {
    return submission.reply({
      fieldErrors: {
        email: ["このメールアドレスは既に登録されています"],
      },
    });
  }

  // 成功
  return {
    status: "success" as const,
    message: "保存しました",
    value: submission.value,
  };
}
```

## FormActionResult 型

```ts
import type { SubmissionResult } from "@conform-to/react";

export type FormActionResult =
  | SubmissionResult<string[]>
  | { status: "success"; message: string; value: MyFormData };
```

成功時に独自のプロパティ（`message`, `value`）を含めるため、Union型で定義する。
