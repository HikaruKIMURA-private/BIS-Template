"use server";

import type { SubmissionResult } from "@conform-to/react";
import { parseWithZod } from "@conform-to/zod/v3";
import { auth } from "@/auth";
import { db } from "@/db";
import { profile } from "@/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { type ProfileFormData, profileFormSchema } from "../schema";

// Server Actionの戻り値の型
export type FormActionResult =
  | SubmissionResult<string[]>
  | { status: "success"; message: string; value: ProfileFormData };

// Server Action
export async function submitProfileForm(
  _prevState: FormActionResult | undefined,
  formData: FormData
): Promise<FormActionResult> {
  // セッションを取得
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return {
      status: "error",
      error: { "": ["認証が必要です。ログインしてください。"] },
    } as SubmissionResult<string[]>;
  }

  // conformを使ってフォームデータをパース
  const submission = parseWithZod(formData, {
    schema: profileFormSchema,
  });

  // バリデーションエラーの場合
  if (submission.status !== "success") {
    return submission.reply();
  }

  // バリデーション成功時の処理
  const { name, gender, birthDate, note } = submission.value as ProfileFormData;

  try {
    // 既存のプロフィールを確認
    const existingProfile = await db
      .select()
      .from(profile)
      .where(eq(profile.userId, session.user.id))
      .limit(1);

    if (existingProfile.length > 0) {
      // 更新
      await db
        .update(profile)
        .set({
          name,
          gender,
          birthDate,
          note: note || null,
        })
        .where(eq(profile.userId, session.user.id));
    } else {
      // 新規作成
      await db.insert(profile).values({
        id: crypto.randomUUID(),
        userId: session.user.id,
        name,
        gender,
        birthDate,
        note: note || null,
      });
    }

    // 成功レスポンスを返す
    return {
      status: "success" as const,
      message: "プロフィールを保存しました！",
      value: { name, gender, birthDate, note },
    };
  } catch (error) {
    console.error("プロフィール保存エラー:", error);
    return {
      status: "error",
      error: { "": ["プロフィールの保存に失敗しました。"] },
    } as SubmissionResult<string[]>;
  }
}
