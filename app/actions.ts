"use server";

import { parseWithZod } from "@conform-to/zod/v3";
import type { SubmissionResult } from "@conform-to/react";
import { userFormSchema, type UserFormData } from "./schema";

// Server Actionの戻り値の型
export type FormActionResult =
  | SubmissionResult<string[]>
  | { status: "success"; message: string; value: UserFormData };

// Server Action
export async function submitUserForm(
  _prevState: FormActionResult | undefined,
  formData: FormData,
): Promise<FormActionResult> {
  // conformを使ってフォームデータをパース
  const submission = parseWithZod(formData, {
    schema: userFormSchema,
  });

  // バリデーションエラーの場合
  if (submission.status !== "success") {
    return submission.reply();
  }

  // バリデーション成功時の処理
  const { name, email, gender, terms } = submission.value as UserFormData;

  // ここで実際のデータベースへの保存などを行う
  // 今回は学習用なので、コンソールに出力するだけ
  console.log("フォーム送信成功:", { name, email, gender, terms });

  // 成功レスポンスを返す
  return {
    status: "success" as const,
    message: "登録が完了しました！",
    value: { name, email, gender, terms },
  };
}
