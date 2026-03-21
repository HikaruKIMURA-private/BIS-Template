import type { SupabaseClient } from "@supabase/supabase-js";

function getProfileAvatarBucket(): string | undefined {
  const v = process.env.PROFILE_AVATAR_BUCKET?.trim();
  return v || undefined;
}

function extensionForMime(mime: string): string {
  if (mime === "image/jpeg") {
    return "jpg";
  }
  if (mime === "image/png") {
    return "png";
  }
  if (mime === "image/webp") {
    return "webp";
  }
  return "bin";
}

export type UploadAvatarResult =
  | { ok: true; publicUrl: string; storagePath: string }
  | { ok: false; message: string };

function isBucketNotFoundError(error: { message?: string }): boolean {
  const m = error.message ?? "";
  return m.includes("Bucket not found");
}

function isBucketAlreadyExistsError(error: { message?: string }): boolean {
  const m = (error.message ?? "").toLowerCase();
  return (
    m.includes("already exists") ||
    m.includes("duplicate") ||
    m.includes("resource already")
  );
}

/**
 * Supabase Storage にアバターを保存し、公開 URL を返す。
 * バケット未作成のときはサービスロールで public バケットを作成してから再試行する。
 */
export async function uploadAvatarToStorage(
  supabase: SupabaseClient,
  userId: string,
  file: File
): Promise<UploadAvatarResult> {
  const bucket = getProfileAvatarBucket();
  if (!bucket) {
    return {
      ok: false,
      message:
        "PROFILE_AVATAR_BUCKET が設定されていません。環境変数を確認してください。",
    };
  }

  const ext = extensionForMime(file.type);
  const storagePath = `${userId}/${crypto.randomUUID()}.${ext}`;

  const buffer = Buffer.from(await file.arrayBuffer());

  const uploadOnce = () =>
    supabase.storage.from(bucket).upload(storagePath, buffer, {
      contentType: file.type,
      upsert: false,
    });

  let { error } = await uploadOnce();

  if (error && isBucketNotFoundError(error)) {
    const { error: createError } = await supabase.storage.createBucket(bucket, {
      public: true,
    });
    if (createError && !isBucketAlreadyExistsError(createError)) {
      console.error("Supabase createBucket error:", createError);
      return {
        ok: false,
        message: `ストレージバケットの作成に失敗しました: ${createError.message}`,
      };
    }
    ({ error } = await uploadOnce());
  }

  if (error) {
    console.error("Supabase Storage upload error:", error);
    return {
      ok: false,
      message:
        "画像のアップロードに失敗しました。バケット設定を確認してください。",
    };
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(storagePath);

  return { ok: true, publicUrl: data.publicUrl, storagePath };
}
