import { describe, expect, it } from "vitest";

import {
  PROFILE_AVATAR_MAX_BYTES,
  validateProfileAvatarBytes,
} from "./profile-avatar";

function jpegBytes(): Uint8Array {
  const b = new Uint8Array(100);
  b[0] = 0xff;
  b[1] = 0xd8;
  b[2] = 0xff;
  b[3] = 0xe0;
  return b;
}

function pngBytes(): Uint8Array {
  const b = new Uint8Array(100);
  b[0] = 0x89;
  b[1] = 0x50;
  b[2] = 0x4e;
  b[3] = 0x47;
  b[4] = 0x0d;
  b[5] = 0x0a;
  b[6] = 0x1a;
  b[7] = 0x0a;
  return b;
}

function webpBytes(): Uint8Array {
  const b = new Uint8Array(32);
  b[0] = 0x52;
  b[1] = 0x49;
  b[2] = 0x46;
  b[3] = 0x46;
  b[8] = 0x57;
  b[9] = 0x45;
  b[10] = 0x42;
  b[11] = 0x50;
  return b;
}

describe("validateProfileAvatarBytes", () => {
  it("JPEG のマジックバイトと MIME が一致すれば成功する", () => {
    const bytes = jpegBytes();
    const r = validateProfileAvatarBytes({
      contentType: "image/jpeg",
      bytes,
    });
    expect(r).toEqual({ ok: true });
  });

  it("PNG のマジックバイトと MIME が一致すれば成功する", () => {
    const bytes = pngBytes();
    const r = validateProfileAvatarBytes({
      contentType: "image/png",
      bytes,
    });
    expect(r).toEqual({ ok: true });
  });

  it("WebP のマジックバイトと MIME が一致すれば成功する", () => {
    const bytes = webpBytes();
    const r = validateProfileAvatarBytes({
      contentType: "image/webp",
      bytes,
    });
    expect(r).toEqual({ ok: true });
  });

  it("空のバイト列は拒否する", () => {
    const r = validateProfileAvatarBytes({
      contentType: "image/jpeg",
      bytes: new Uint8Array(0),
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("empty_file");
  });

  it("許可されていない MIME 形式は拒否する", () => {
    const r = validateProfileAvatarBytes({
      contentType: "image/gif",
      bytes: jpegBytes(),
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("mime_not_allowed");
  });

  it("最大バイト数を超えると拒否する", () => {
    const bytes = new Uint8Array(PROFILE_AVATAR_MAX_BYTES + 1);
    bytes[0] = 0xff;
    bytes[1] = 0xd8;
    bytes[2] = 0xff;
    const r = validateProfileAvatarBytes({
      contentType: "image/jpeg",
      bytes,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("file_too_large");
  });

  it("MIME とマジックバイトが一致しない場合は拒否する", () => {
    const r = validateProfileAvatarBytes({
      contentType: "image/png",
      bytes: jpegBytes(),
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("invalid_image");
  });

  it("境界値で最大バイト数ちょうどは成功する", () => {
    const inner = jpegBytes();
    const bytes = new Uint8Array(PROFILE_AVATAR_MAX_BYTES);
    bytes.set(inner);
    const r = validateProfileAvatarBytes({
      contentType: "image/jpeg",
      bytes,
    });
    expect(r).toEqual({ ok: true });
  });
});
