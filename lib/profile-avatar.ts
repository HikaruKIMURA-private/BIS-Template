/**
 * プロフィール画像の共有定数・純粋検証（サーバー境界と UI ヘルプで同一値を参照する）
 */

export const PROFILE_AVATAR_FORM_FIELD = "avatar" as const;

export const PROFILE_AVATAR_ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type ProfileAvatarMimeType = (typeof PROFILE_AVATAR_ALLOWED_MIME_TYPES)[number];

/** 5 MiB */
export const PROFILE_AVATAR_MAX_BYTES = 5 * 1024 * 1024;

export const profileAvatarConstraints = {
  allowedMimeTypes: PROFILE_AVATAR_ALLOWED_MIME_TYPES,
  maxBytes: PROFILE_AVATAR_MAX_BYTES,
  helpText: `JPEG / PNG / WebP、最大 ${PROFILE_AVATAR_MAX_BYTES / (1024 * 1024)}MB まで`,
} as const;

export type ProfileAvatarValidationErrorCode =
  | "empty_file"
  | "mime_not_allowed"
  | "file_too_large"
  | "invalid_image";

export type ProfileAvatarValidationResult =
  | { ok: true }
  | {
      ok: false;
      code: ProfileAvatarValidationErrorCode;
      message: string;
    };

const MIME_MESSAGES: Record<ProfileAvatarValidationErrorCode, string> = {
  empty_file: "ファイルが空です。画像を選び直してください。",
  mime_not_allowed:
    "対応している形式は JPEG・PNG・WebP です。別の形式で試してください。",
  file_too_large: `ファイルサイズは最大 ${PROFILE_AVATAR_MAX_BYTES / (1024 * 1024)}MB までです。`,
  invalid_image:
    "画像として読み取れませんでした。別のファイルを選ぶか、再エクスポートしてから試してください。",
};

function isAllowedMimeType(ct: string): ct is ProfileAvatarMimeType {
  return (PROFILE_AVATAR_ALLOWED_MIME_TYPES as readonly string[]).includes(ct);
}

function matchesMagicBytes(
  contentType: ProfileAvatarMimeType,
  bytes: Uint8Array
): boolean {
  if (bytes.length < 12) {
    return false;
  }
  if (contentType === "image/jpeg") {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (contentType === "image/png") {
    return (
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a
    );
  }
  if (contentType === "image/webp") {
    const riff =
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46;
    const webp =
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50;
    return riff && webp;
  }
  return false;
}

export function validateProfileAvatarBytes(input: {
  contentType: string;
  bytes: Uint8Array;
}): ProfileAvatarValidationResult {
  const { contentType, bytes } = input;

  if (bytes.length === 0) {
    return {
      ok: false,
      code: "empty_file",
      message: MIME_MESSAGES.empty_file,
    };
  }

  if (bytes.length > PROFILE_AVATAR_MAX_BYTES) {
    return {
      ok: false,
      code: "file_too_large",
      message: MIME_MESSAGES.file_too_large,
    };
  }

  if (!isAllowedMimeType(contentType)) {
    return {
      ok: false,
      code: "mime_not_allowed",
      message: MIME_MESSAGES.mime_not_allowed,
    };
  }

  if (!matchesMagicBytes(contentType, bytes)) {
    return {
      ok: false,
      code: "invalid_image",
      message: MIME_MESSAGES.invalid_image,
    };
  }

  return { ok: true };
}
