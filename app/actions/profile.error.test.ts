import type { SubmissionResult } from "@conform-to/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { FormActionResult } from "./profile";

// DB エラーのテストはモックでのみ再現可能なため、ロンドン学派で維持する

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

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const mockSelect = vi.fn();
vi.mock("@/db", () => ({
  db: {
    select: (...args: unknown[]) => mockSelect(...args),
    insert: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock("@/db/schema", () => ({
  profile: {
    userId: "user_id",
    name: "name",
    gender: "gender",
    birthDate: "birth_date",
    note: "note",
    bloodType: "blood_type",
  },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((col, val) => ({ col, val })),
}));

function createFormData(data: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(data)) {
    fd.append(key, value);
  }
  return fd;
}

describe("submitProfileForm - エラーハンドリング", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("DB エラー時にエラーレスポンスを返す", async () => {
    mockGetSession.mockResolvedValue({ user: { id: "user-1" } });
    mockSelect.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockRejectedValue(new Error("DB connection error")),
        }),
      }),
    });

    const { submitProfileForm } = await import("./profile");
    const result = (await submitProfileForm(
      undefined,
      createFormData({
        name: "山田太郎",
        gender: "male",
        birthDate: "1990-01-15",
        note: "",
      })
    )) as FormActionResult;

    const errorResult = result as SubmissionResult<string[]>;
    expect(errorResult.status).toBe("error");
    expect(errorResult.error?.[""]).toContain(
      "プロフィールの保存に失敗しました。"
    );
  });
});
