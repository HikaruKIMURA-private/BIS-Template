import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/** Supabase Storage の公開 URL からバケット配下のオブジェクトキーを取り出す */
export function extractObjectPathFromPublicUrl(
  publicUrl: string,
  bucket: string
): string | null {
  const needle = `/storage/v1/object/public/${bucket}/`;
  const i = publicUrl.indexOf(needle);
  if (i === -1) {
    return null;
  }
  return publicUrl.slice(i + needle.length);
}

export type StoragePutResult =
  | { ok: true; publicUrl: string; objectPath: string }
  | {
      ok: false;
      code: "upload_failed" | "invalid_config" | "bucket_not_found";
    };

function classifyStorageUploadError(error: { message: string }): "bucket_not_found" | "upload_failed" {
  if (/bucket not found/i.test(error.message)) {
    return "bucket_not_found";
  }
  return "upload_failed";
}

export interface ProfileAvatarStorage {
  put(input: {
    userId: string;
    bytes: Uint8Array;
    contentType: string;
    fileExtension: string;
  }): Promise<StoragePutResult>;

  remove(input: { objectPath: string }): Promise<{ ok: true } | { ok: false }>;
}

function isSafeUserId(userId: string): boolean {
  if (userId.length === 0) {
    return false;
  }
  return !userId.includes("/") && !userId.includes("..");
}

export function createProfileAvatarStorage(deps: {
  supabase: SupabaseClient;
  bucket: string;
}): ProfileAvatarStorage {
  const { supabase, bucket } = deps;

  return {
    async put(input) {
      const { userId, bytes, contentType, fileExtension } = input;

      if (!isSafeUserId(userId)) {
        return { ok: false, code: "upload_failed" };
      }

      const ext = fileExtension.replace(/^\./, "");
      const objectPath = `${userId}/${crypto.randomUUID()}.${ext}`;

      const { error } = await supabase.storage.from(bucket).upload(objectPath, bytes, {
        contentType,
        upsert: true,
      });

      if (error) {
        return { ok: false, code: classifyStorageUploadError(error) };
      }

      const { data } = supabase.storage.from(bucket).getPublicUrl(objectPath);

      return {
        ok: true,
        publicUrl: data.publicUrl,
        objectPath,
      };
    },

    async remove(input) {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([input.objectPath]);

      if (error) {
        return { ok: false };
      }
      return { ok: true };
    },
  };
}

export function createServerProfileAvatarStorage(): ProfileAvatarStorage {
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const bucket = process.env.PROFILE_AVATAR_BUCKET?.trim();

  if (!url || !key || !bucket) {
    return {
      async put() {
        return { ok: false, code: "invalid_config" };
      },
      async remove() {
        return { ok: false };
      },
    };
  }

  const supabase = createClient(url, key);
  return createProfileAvatarStorage({ supabase, bucket });
}
