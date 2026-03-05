import type { SubmissionResult } from "@conform-to/react";
import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { db } from "@/db";
import { profile, user } from "@/db/schema";
import { submitProfileForm } from "./profile";

// --- 外部サービスのモック（auth / Next.js API のみ） ---

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

const mockRedirect = vi.fn();
vi.mock("next/navigation", () => ({
  redirect: (...args: unknown[]) => {
    mockRedirect(...args);
    throw new Error("NEXT_REDIRECT");
  },
}));

const mockRevalidatePath = vi.fn();
vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}));

// --- ヘルパー ---

const TEST_USER_ID = "test-user-action";
const TEST_EMAIL = "test-action@test.com";

function createFormData(data: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(data)) {
    fd.append(key, value);
  }
  return fd;
}

const validFormData = {
  name: "山田太郎",
  gender: "male",
  birthDate: "1990-01-15",
  note: "",
};

async function cleanupTestData() {
  await db.delete(profile).where(eq(profile.userId, TEST_USER_ID));
  await db.delete(user).where(eq(user.id, TEST_USER_ID));
}

async function seedTestUser() {
  await db.insert(user).values({
    id: TEST_USER_ID,
    name: "テスト",
    email: TEST_EMAIL,
    emailVerified: false,
  });
}

// --- テスト ---

describe("submitProfileForm", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await cleanupTestData();
  });

  afterEach(async () => {
    await cleanupTestData();
  });

  it("未認証時にエラーを返す", async () => {
    mockGetSession.mockResolvedValue(null);

    const result = await submitProfileForm(
      undefined,
      createFormData(validFormData)
    );

    const errorResult = result as SubmissionResult<string[]>;
    expect(errorResult.status).toBe("error");
    expect(errorResult.error?.[""]).toContain(
      "認証が必要です。ログインしてください。"
    );
  });

  it("バリデーションエラー時に適切なエラーを返す", async () => {
    mockGetSession.mockResolvedValue({ user: { id: TEST_USER_ID } });

    const result = await submitProfileForm(
      undefined,
      createFormData({ name: "", gender: "", birthDate: "" })
    );

    expect(result.status).not.toBe("success");
  });

  it("新規プロフィールが実DBに作成される", async () => {
    await seedTestUser();
    mockGetSession.mockResolvedValue({ user: { id: TEST_USER_ID } });

    await expect(
      submitProfileForm(undefined, createFormData(validFormData))
    ).rejects.toThrow("NEXT_REDIRECT");

    const rows = await db
      .select()
      .from(profile)
      .where(eq(profile.userId, TEST_USER_ID));
    expect(rows).toHaveLength(1);
    expect(rows[0].name).toBe("山田太郎");
    expect(rows[0].gender).toBe("male");
    expect(rows[0].birthDate).toBe("1990-01-15");

    expect(mockRevalidatePath).toHaveBeenCalledWith("/dashboard");
    expect(mockRedirect).toHaveBeenCalledWith("/dashboard");
  });

  it("既存プロフィールが実DBで更新される", async () => {
    await seedTestUser();
    await db.insert(profile).values({
      id: "test-profile-action-1",
      userId: TEST_USER_ID,
      name: "旧名前",
      gender: "female",
      birthDate: "2000-06-01",
    });
    mockGetSession.mockResolvedValue({ user: { id: TEST_USER_ID } });

    await expect(
      submitProfileForm(undefined, createFormData(validFormData))
    ).rejects.toThrow("NEXT_REDIRECT");

    const rows = await db
      .select()
      .from(profile)
      .where(eq(profile.userId, TEST_USER_ID));
    expect(rows).toHaveLength(1);
    expect(rows[0].name).toBe("山田太郎");
    expect(rows[0].gender).toBe("male");
    expect(rows[0].birthDate).toBe("1990-01-15");

    expect(mockRevalidatePath).toHaveBeenCalledWith("/dashboard");
    expect(mockRedirect).toHaveBeenCalledWith("/dashboard");
  });
});
