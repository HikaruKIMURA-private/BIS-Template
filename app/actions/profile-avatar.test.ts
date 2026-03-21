import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { db } from "@/db";
import { profile, user } from "@/db/schema";

import { clearProfileAvatar, setProfileAvatar } from "./profile-avatar";

const mockGetSession = vi.fn();
vi.mock("@/auth", () => ({
  auth: {
    api: {
      getSession: (...args: unknown[]) => mockGetSession(...args),
    },
  },
}));

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

const mockRevalidatePath = vi.fn();
vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}));

const { mockStorage } = vi.hoisted(() => ({
  mockStorage: {
    put: vi.fn(),
    remove: vi.fn(),
  },
}));

vi.mock("@/lib/storage/profile-avatar", async () => {
  const actual = await vi.importActual<typeof import("@/lib/storage/profile-avatar")>(
    "@/lib/storage/profile-avatar"
  );
  return {
    ...actual,
    createServerProfileAvatarStorage: () => mockStorage,
  };
});

const TEST_USER_ID = "test-user-avatar";
const TEST_EMAIL = "test-avatar@test.com";

function minimalPngBytes(): Uint8Array {
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

async function cleanupTestData() {
  await db.delete(profile).where(eq(profile.userId, TEST_USER_ID));
  await db.delete(user).where(eq(user.id, TEST_USER_ID));
}

async function seedUserAndProfile() {
  await db.insert(user).values({
    id: TEST_USER_ID,
    name: "テスト",
    email: TEST_EMAIL,
    emailVerified: false,
  });
  await db.insert(profile).values({
    id: "test-profile-avatar",
    userId: TEST_USER_ID,
    name: "山田太郎",
    gender: "male",
    birthDate: "1990-01-15",
  });
}

describe("setProfileAvatar", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await cleanupTestData();
    mockStorage.put.mockResolvedValue({
      ok: true,
      publicUrl: "https://ex.test/storage/v1/object/public/bkt/u/x.png",
      objectPath: "u/obj.png",
    });
    mockStorage.remove.mockResolvedValue({ ok: true });
  });

  afterEach(async () => {
    await cleanupTestData();
  });

  it("未認証時はエラーを返す", async () => {
    mockGetSession.mockResolvedValue(null);

    const fd = new FormData();
    fd.append(
      "avatar",
      new File([Buffer.from(minimalPngBytes())], "x.png", { type: "image/png" })
    );

    const r = await setProfileAvatar(undefined, fd);

    expect(r.status).toBe("error");
    if (r.status === "error") {
      expect(r.formErrors[0]).toContain("ログイン");
    }
    expect(mockStorage.put).not.toHaveBeenCalled();
  });

  it("バリデーションエラー時はフィールドエラーを返す", async () => {
    mockGetSession.mockResolvedValue({ user: { id: TEST_USER_ID } });
    await seedUserAndProfile();

    const fd = new FormData();
    fd.append(
      "avatar",
      new File([Buffer.from([1, 2, 3])], "x.gif", { type: "image/gif" })
    );

    const r = await setProfileAvatar(undefined, fd);

    expect(r.status).toBe("error");
    if (r.status === "error") {
      expect(r.fieldErrors.avatar?.length).toBeGreaterThan(0);
    }
    expect(mockStorage.put).not.toHaveBeenCalled();
  });

  it("成功時に profile.avatar_url を更新する", async () => {
    mockGetSession.mockResolvedValue({ user: { id: TEST_USER_ID } });
    await seedUserAndProfile();

    const fd = new FormData();
    fd.append(
      "avatar",
      new File([Buffer.from(minimalPngBytes())], "x.png", { type: "image/png" })
    );

    const r = await setProfileAvatar(undefined, fd);

    expect(r).toEqual({
      status: "success",
      avatarUrl: "https://ex.test/storage/v1/object/public/bkt/u/x.png",
    });

    const rows = await db
      .select({ avatarUrl: profile.avatarUrl })
      .from(profile)
      .where(eq(profile.userId, TEST_USER_ID));
    expect(rows[0]?.avatarUrl).toBe(
      "https://ex.test/storage/v1/object/public/bkt/u/x.png"
    );

    expect(mockRevalidatePath).toHaveBeenCalledWith("/dashboard");
    expect(mockStorage.put).toHaveBeenCalled();
  });

  it("ストレージが bucket_not_found のときは案内メッセージを返す", async () => {
    mockGetSession.mockResolvedValue({ user: { id: TEST_USER_ID } });
    await seedUserAndProfile();
    mockStorage.put.mockResolvedValue({
      ok: false,
      code: "bucket_not_found",
    });

    const fd = new FormData();
    fd.append(
      "avatar",
      new File([Buffer.from(minimalPngBytes())], "x.png", { type: "image/png" })
    );

    const r = await setProfileAvatar(undefined, fd);

    expect(r.status).toBe("error");
    if (r.status === "error") {
      expect(r.formErrors[0]).toContain("バケット");
    }
    expect(mockStorage.put).toHaveBeenCalled();
  });

  it("プロフィール行が無い場合はエラーを返す", async () => {
    mockGetSession.mockResolvedValue({ user: { id: TEST_USER_ID } });
    await db.insert(user).values({
      id: TEST_USER_ID,
      name: "テスト",
      email: TEST_EMAIL,
      emailVerified: false,
    });

    const fd = new FormData();
    fd.append(
      "avatar",
      new File([Buffer.from(minimalPngBytes())], "x.png", { type: "image/png" })
    );

    const r = await setProfileAvatar(undefined, fd);

    expect(r.status).toBe("error");
    if (r.status === "error") {
      expect(r.formErrors[0]).toContain("基本情報");
    }
  });
});

describe("clearProfileAvatar", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await cleanupTestData();
    mockStorage.remove.mockResolvedValue({ ok: true });
  });

  afterEach(async () => {
    await cleanupTestData();
  });

  it("未認証時はエラーを返す", async () => {
    mockGetSession.mockResolvedValue(null);

    const r = await clearProfileAvatar(undefined, new FormData());

    expect(r.status).toBe("error");
    if (r.status === "error") {
      expect(r.formErrors[0]).toContain("ログイン");
    }
  });

  it("成功時に avatar_url を null にする", async () => {
    mockGetSession.mockResolvedValue({ user: { id: TEST_USER_ID } });
    await seedUserAndProfile();
    await db
      .update(profile)
      .set({ avatarUrl: "https://ex.test/storage/v1/object/public/bkt/u/old.png" })
      .where(eq(profile.userId, TEST_USER_ID));

    const r = await clearProfileAvatar(undefined, new FormData());

    expect(r).toEqual({ status: "success" });

    const rows = await db
      .select({ avatarUrl: profile.avatarUrl })
      .from(profile)
      .where(eq(profile.userId, TEST_USER_ID));
    expect(rows[0]?.avatarUrl).toBeNull();

    expect(mockRevalidatePath).toHaveBeenCalledWith("/dashboard");
  });
});
