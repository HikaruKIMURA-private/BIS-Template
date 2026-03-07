"use server";

import type { SubmissionResult } from "@conform-to/react";

import { parseWithZod } from "@conform-to/zod/v3";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { db } from "@/db";
import { profile } from "@/db/schema";
import {
  type ProfileFormData,
  profileFormSchema,
  toProfileRecord,
} from "../schema";

export type FormActionResult =
  | SubmissionResult<string[]>
  | { status: "success"; message: string; value: ProfileFormData };

export async function upsertProfile(
  userId: string,
  record: ReturnType<typeof toProfileRecord>
) {
  const existingProfile = await db
    .select()
    .from(profile)
    .where(eq(profile.userId, userId))
    .limit(1);

  if (existingProfile.length > 0) {
    await db
      .update(profile)
      .set(record)
      .where(eq(profile.userId, userId));
  } else {
    await db.insert(profile).values({
      id: crypto.randomUUID(),
      userId,
      ...record,
    });
  }
}

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
      error: { "": ["認証が必要です。ログインしてください。"] },
    } as SubmissionResult<string[]>;
  }

  const submission = parseWithZod(formData, {
    schema: profileFormSchema,
  });

  if (submission.status !== "success") {
    return submission.reply();
  }

  const record = toProfileRecord(submission.value as ProfileFormData);

  try {
    await upsertProfile(session.user.id, record);
  } catch (error) {
    console.error("プロフィール保存エラー:", error);
    return {
      status: "error",
      error: { "": ["プロフィールの保存に失敗しました。"] },
    } as SubmissionResult<string[]>;
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}
