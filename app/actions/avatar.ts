"use server";

import type { SubmissionResult } from "@conform-to/react";

import { parseWithZod } from "@conform-to/zod/v3";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { updateProfileAvatarUrl } from "@/app/data/profile";
import { auth } from "@/auth";
import { createSupabaseAdmin } from "@/libs/storage/supabase-server";
import { uploadAvatarToStorage } from "@/libs/storage/upload-avatar-storage";
import { avatarUploadFormSchema } from "../schema";

export type AvatarFormActionResult =
  | SubmissionResult<string[]>
  | { status: "success"; message: string };

export async function submitAvatarForm(
  _prev: AvatarFormActionResult | undefined,
  formData: FormData
): Promise<AvatarFormActionResult> {
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
    schema: avatarUploadFormSchema,
  });

  if (submission.status !== "success") {
    return submission.reply();
  }

  const file = submission.value.avatar;

  try {
    const supabase = createSupabaseAdmin();
    const upload = await uploadAvatarToStorage(supabase, session.user.id, file);
    if (!upload.ok) {
      return {
        status: "error",
        error: { "": [upload.message] },
      } as SubmissionResult<string[]>;
    }

    const ok = await updateProfileAvatarUrl(session.user.id, upload.publicUrl);
    if (!ok) {
      return {
        status: "error",
        error: {
          "": ["先にプロフィールを登録してからアバターを設定してください。"],
        },
      } as SubmissionResult<string[]>;
    }

    revalidatePath("/dashboard");
    return {
      status: "success",
      message: "アバターを更新しました。",
    };
  } catch (e) {
    console.error("submitAvatarForm:", e);
    if (e instanceof Error && e.message.includes("Supabase")) {
      return {
        status: "error",
        error: { "": [e.message] },
      } as SubmissionResult<string[]>;
    }
    return {
      status: "error",
      error: { "": ["アバターの更新に失敗しました。"] },
    } as SubmissionResult<string[]>;
  }
}

export async function removeAvatarForm(
  _prev: AvatarFormActionResult | undefined,
  _formData: FormData
): Promise<AvatarFormActionResult> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return {
      status: "error",
      error: { "": ["認証が必要です。ログインしてください。"] },
    } as SubmissionResult<string[]>;
  }

  try {
    const ok = await updateProfileAvatarUrl(session.user.id, null);
    if (!ok) {
      return {
        status: "error",
        error: { "": ["プロフィールが見つかりません。"] },
      } as SubmissionResult<string[]>;
    }
    revalidatePath("/dashboard");
    return { status: "success", message: "アバターを削除しました。" };
  } catch (e) {
    console.error("removeAvatarForm:", e);
    return {
      status: "error",
      error: { "": ["アバターの削除に失敗しました。"] },
    } as SubmissionResult<string[]>;
  }
}
