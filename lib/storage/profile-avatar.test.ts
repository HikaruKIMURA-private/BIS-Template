import { beforeEach, describe, expect, it, vi } from "vitest";

import { createProfileAvatarStorage } from "./profile-avatar";

function buildMockSupabase(overrides: {
  uploadError?: { message: string } | null;
  removeError?: { message: string } | null;
  publicUrl?: string;
} = {}) {
  const upload = vi.fn().mockResolvedValue({
    data: { path: "u/obj.png" },
    error: overrides.uploadError ?? null,
  });
  const remove = vi.fn().mockResolvedValue({
    data: null,
    error: overrides.removeError ?? null,
  });
  const getPublicUrl = vi.fn().mockReturnValue({
    data: { publicUrl: overrides.publicUrl ?? "https://ex.test/storage/v1/object/public/bkt/u/obj.png" },
  });

  const from = vi.fn().mockReturnValue({
    upload,
    remove,
    getPublicUrl,
  });

  return {
    supabase: { storage: { from } } as never,
    upload,
    remove,
    getPublicUrl,
    from,
  };
}

describe("createProfileAvatarStorage", () => {
  beforeEach(() => {
    vi.stubGlobal("crypto", {
      randomUUID: () => "00000000-0000-4000-8000-000000000001",
    });
  });

  it("アップロード成功時に公開 URL とオブジェクトパスを返す", async () => {
    const m = buildMockSupabase();
    const gw = createProfileAvatarStorage({
      supabase: m.supabase,
      bucket: "bkt",
    });

    const r = await gw.put({
      userId: "user-1",
      bytes: new Uint8Array([1, 2, 3]),
      contentType: "image/png",
      fileExtension: "png",
    });

    expect(r).toEqual({
      ok: true,
      publicUrl: "https://ex.test/storage/v1/object/public/bkt/u/obj.png",
      objectPath: "user-1/00000000-0000-4000-8000-000000000001.png",
    });
    expect(m.from).toHaveBeenCalledWith("bkt");
    expect(m.upload).toHaveBeenCalledWith(
      "user-1/00000000-0000-4000-8000-000000000001.png",
      expect.any(Uint8Array),
      { contentType: "image/png", upsert: true }
    );
  });

  it("アップロード失敗時は upload_failed を返す", async () => {
    const m = buildMockSupabase({ uploadError: { message: "nope" } });
    const gw = createProfileAvatarStorage({
      supabase: m.supabase,
      bucket: "bkt",
    });

    const r = await gw.put({
      userId: "user-1",
      bytes: new Uint8Array([1]),
      contentType: "image/png",
      fileExtension: "png",
    });

    expect(r).toEqual({ ok: false, code: "upload_failed" });
  });

  it("Bucket not found のときは bucket_not_found を返す", async () => {
    const m = buildMockSupabase({
      uploadError: { message: "Bucket not found" },
    });
    const gw = createProfileAvatarStorage({
      supabase: m.supabase,
      bucket: "bkt",
    });

    const r = await gw.put({
      userId: "user-1",
      bytes: new Uint8Array([1]),
      contentType: "image/png",
      fileExtension: "png",
    });

    expect(r).toEqual({ ok: false, code: "bucket_not_found" });
  });

  it("userId にパストラバーサル文字が含まれる場合は upload_failed を返す", async () => {
    const m = buildMockSupabase();
    const gw = createProfileAvatarStorage({
      supabase: m.supabase,
      bucket: "bkt",
    });

    const r = await gw.put({
      userId: "../evil",
      bytes: new Uint8Array([1]),
      contentType: "image/png",
      fileExtension: "png",
    });

    expect(r).toEqual({ ok: false, code: "upload_failed" });
    expect(m.upload).not.toHaveBeenCalled();
  });

  it("削除成功時は ok: true を返す", async () => {
    const m = buildMockSupabase();
    const gw = createProfileAvatarStorage({
      supabase: m.supabase,
      bucket: "bkt",
    });

    const r = await gw.remove({ objectPath: "user-1/old.png" });

    expect(r).toEqual({ ok: true });
    expect(m.remove).toHaveBeenCalledWith(["user-1/old.png"]);
  });

  it("削除失敗時は ok: false を返す", async () => {
    const m = buildMockSupabase({ removeError: { message: "nope" } });
    const gw = createProfileAvatarStorage({
      supabase: m.supabase,
      bucket: "bkt",
    });

    const r = await gw.remove({ objectPath: "user-1/old.png" });

    expect(r).toEqual({ ok: false });
  });
});
