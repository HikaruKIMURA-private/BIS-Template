/** アバター画像の最大サイズ（2 MiB） */
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export type AvatarParseOk = { ok: true; file: File };
export type AvatarParseErr = { ok: false; error: string };
export type AvatarParseResult = AvatarParseOk | AvatarParseErr;

/**
 * アップロード用に File を検証する（純粋関数）。
 */
export function parseAvatarFileForUpload(file: File): AvatarParseResult {
  if (file.size === 0) {
    return { ok: false, error: "画像ファイルを選択してください。" };
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return {
      ok: false,
      error: "画像は JPEG・PNG・WebP 形式のみ利用できます。",
    };
  }
  if (file.size > AVATAR_MAX_BYTES) {
    return {
      ok: false,
      error: `ファイルサイズは ${AVATAR_MAX_BYTES / (1024 * 1024)}MB 以下にしてください。`,
    };
  }
  return { ok: true, file };
}
