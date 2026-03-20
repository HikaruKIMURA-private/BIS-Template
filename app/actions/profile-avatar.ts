"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { auth } from "@/auth";
import { db } from "@/db";
import { profile } from "@/db/schema";
import {
  PROFILE_AVATAR_FORM_FIELD,
  validateProfileAvatarBytes,
} from "@/lib/profile-avatar";
import {
  createServerProfileAvatarStorage,
  extractObjectPathFromPublicUrl,
} from "@/lib/storage/profile-avatar";

export type SetProfileAvatarSuccess = { status: "success"; avatarUrl: string };
export type SetProfileAvatarFailure = {
  status: "error";
  formErrors: string[];
  fieldErrors: Record<string, string[]>;
};

export type SetProfileAvatarResult =
  | SetProfileAvatarSuccess
  | SetProfileAvatarFailure;

export type ClearProfileAvatarSuccess = { status: "success" };
export type ClearProfileAvatarFailure = {
  status: "error";
  formErrors: string[];
};

export type ClearProfileAvatarResult =
  | ClearProfileAvatarSuccess
  | ClearProfileAvatarFailure;

function mimeToExtension(mime: string): string {
  switch (mime) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      return "bin";
  }
}

export async function setProfileAvatar(
  _prevState: SetProfileAvatarResult | undefined,
  formData: FormData
): Promise<SetProfileAvatarResult> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return {
      status: "error",
      formErrors: ["認証が必要です。ログインしてください。"],
      fieldErrors: {},
    };
  }

  const file = formData.get(PROFILE_AVATAR_FORM_FIELD);
  if (!(file instanceof File)) {
    return {
      status: "error",
      formErrors: [],
      fieldErrors: {
        [PROFILE_AVATAR_FORM_FIELD]: ["画像ファイルを選択してください。"],
      },
    };
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const validation = validateProfileAvatarBytes({
    contentType: file.type,
    bytes,
  });

  if (!validation.ok) {
    return {
      status: "error",
      formErrors: [],
      fieldErrors: {
        [PROFILE_AVATAR_FORM_FIELD]: [validation.message],
      },
    };
  }

  const storage = createServerProfileAvatarStorage();
  const putResult = await storage.put({
    userId: session.user.id,
    bytes,
    contentType: file.type,
    fileExtension: mimeToExtension(file.type),
  });

  if (!putResult.ok) {
    if (putResult.code === "invalid_config") {
      return {
        status: "error",
        formErrors: ["画像の保存設定が不正です。管理者に連絡してください。"],
        fieldErrors: {},
      };
    }
    if (putResult.code === "bucket_not_found") {
      return {
        status: "error",
        formErrors: [
          "ストレージのバケットが見つかりません。Supabase の Storage で PROFILE_AVATAR_BUCKET と同じ名前のバケットを作成してください。",
        ],
        fieldErrors: {},
      };
    }
    return {
      status: "error",
      formErrors: [
        "画像の保存に失敗しました。しばらくしてから再度お試しください。",
      ],
      fieldErrors: {},
    };
  }

  const userId = session.user.id;

  const existing = await db
    .select({ avatarUrl: profile.avatarUrl })
    .from(profile)
    .where(eq(profile.userId, userId))
    .limit(1);

  const oldUrl = existing[0]?.avatarUrl ?? null;

  const updated = await db
    .update(profile)
    .set({ avatarUrl: putResult.publicUrl })
    .where(eq(profile.userId, userId))
    .returning({ id: profile.id });

  if (updated.length === 0) {
    return {
      status: "error",
      formErrors: [
        "プロフィールが見つかりません。先に基本情報を保存してください。",
      ],
      fieldErrors: {},
    };
  }

  if (oldUrl) {
    const bucket = process.env.PROFILE_AVATAR_BUCKET?.trim();
    if (bucket) {
      const oldPath = extractObjectPathFromPublicUrl(oldUrl, bucket);
      if (oldPath) {
        await storage.remove({ objectPath: oldPath });
      }
    }
  }

  revalidatePath("/dashboard");

  return {
    status: "success",
    avatarUrl: putResult.publicUrl,
  };
}

export async function clearProfileAvatar(
  _prevState: ClearProfileAvatarResult | undefined,
  _formData: FormData
): Promise<ClearProfileAvatarResult> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return {
      status: "error",
      formErrors: ["認証が必要です。ログインしてください。"],
    };
  }

  const userId = session.user.id;

  const row = await db
    .select({ avatarUrl: profile.avatarUrl })
    .from(profile)
    .where(eq(profile.userId, userId))
    .limit(1);

  const oldUrl = row[0]?.avatarUrl ?? null;

  const updated = await db
    .update(profile)
    .set({ avatarUrl: null })
    .where(eq(profile.userId, userId))
    .returning({ id: profile.id });

  if (updated.length === 0) {
    return {
      status: "error",
      formErrors: ["プロフィールが見つかりません。"],
    };
  }

  if (oldUrl) {
    const bucket = process.env.PROFILE_AVATAR_BUCKET?.trim();
    if (bucket) {
      const oldPath = extractObjectPathFromPublicUrl(oldUrl, bucket);
      if (oldPath) {
        const storage = createServerProfileAvatarStorage();
        await storage.remove({ objectPath: oldPath });
      }
    }
  }

  revalidatePath("/dashboard");

  return { status: "success" };
}
