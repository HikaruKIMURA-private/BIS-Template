import { describe, expect, it } from "vitest";

import {
  AVATAR_MAX_BYTES,
  parseAvatarFileForUpload,
} from "@/libs/avatar/avatar-validation";

describe("parseAvatarFileForUpload", () => {
  it("ファイル未選択（size 0）のときエラー", () => {
    const file = new File([], "empty.png", { type: "image/png" });
    const result = parseAvatarFileForUpload(file);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/ファイル/);
    }
  });

  it("許可されていない MIME のときエラー", () => {
    const file = new File([new Uint8Array([1, 2, 3])], "x.gif", {
      type: "image/gif",
    });
    const result = parseAvatarFileForUpload(file);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/形式/);
    }
  });

  it("サイズ上限を超えるときエラー", () => {
    const buf = new Uint8Array(AVATAR_MAX_BYTES + 1);
    const file = new File([buf], "big.jpg", { type: "image/jpeg" });
    const result = parseAvatarFileForUpload(file);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/サイズ/);
    }
  });

  it("JPEG が通る", () => {
    const file = new File([new Uint8Array([1])], "a.jpg", {
      type: "image/jpeg",
    });
    const result = parseAvatarFileForUpload(file);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.file).toBe(file);
    }
  });

  it("PNG が通る", () => {
    const file = new File([new Uint8Array([1])], "a.png", {
      type: "image/png",
    });
    const result = parseAvatarFileForUpload(file);
    expect(result.ok).toBe(true);
  });

  it("WebP が通る", () => {
    const file = new File([new Uint8Array([1])], "a.webp", {
      type: "image/webp",
    });
    const result = parseAvatarFileForUpload(file);
    expect(result.ok).toBe(true);
  });
});
