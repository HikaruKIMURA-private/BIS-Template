"use server";

import type { SubmissionResult } from "@conform-to/react";

import { parseWithZod } from "@conform-to/zod/v3";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { db } from "@/db";
import type { ProfileAndSkillSheetFormData } from "@/app/schema";
import {
  profileAndSkillSheetFormSchema,
  toProfileRecord,
} from "@/app/schema";
import { upsertSkillSheet } from "@/app/data/skill-sheet";

import { upsertProfile } from "./profile";

export type ProfileAndSkillSheetActionResult =
  | SubmissionResult<string[]>
  | {
      status: "success";
      message: string;
      value: ProfileAndSkillSheetFormData;
    };

function toSkillSheetPersistence(
  data: ProfileAndSkillSheetFormData
): import("@/libs/skill-sheet/skill-sheet-types").SkillSheetValues {
  return {
    experienceYears: data.experienceYears,
    ownedSkills: data.ownedSkills,
    careers: data.careers,
  };
}

export async function submitProfileAndSkillSheet(
  _prevState: ProfileAndSkillSheetActionResult | undefined,
  formData: FormData
): Promise<ProfileAndSkillSheetActionResult> {
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
    schema: profileAndSkillSheetFormSchema,
  });

  if (submission.status !== "success") {
    return submission.reply();
  }

  const parsed = submission.value as ProfileAndSkillSheetFormData;
  const profileRecord = toProfileRecord({
    name: parsed.name,
    gender: parsed.gender,
    birthDate: parsed.birthDate,
    note: parsed.note,
    bloodType: parsed.bloodType,
  });
  const skillRecord = toSkillSheetPersistence(parsed);

  try {
    await db.transaction(async (tx) => {
      await upsertProfile(session.user.id, profileRecord, tx);
      await upsertSkillSheet(session.user.id, skillRecord, tx);
    });
  } catch (error) {
    console.error("プロフィール・スキルシート保存エラー:", error);
    return {
      status: "error",
      error: { "": ["保存に失敗しました。"] },
    } as SubmissionResult<string[]>;
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}
