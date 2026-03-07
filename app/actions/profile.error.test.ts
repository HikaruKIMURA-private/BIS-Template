import type { SubmissionResult } from "@conform-to/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { submitProfileForm } from "./profile";

const { mockGetSession, mockFrom } = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockFrom: vi.fn(),
}));

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

vi.mock("@/db", () => ({
  db: {
    select: vi.fn().mockReturnValue({ from: mockFrom }),
    insert: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock("drizzle-orm", () => ({ eq: vi.fn() }));

vi.mock("@/db/schema", () => ({
  profile: { userId: "userId" },
}));

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

describe("submitProfileForm（DBエラー）", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({ user: { id: "test-user" } });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("DB操作が失敗した場合にエラーメッセージを返す", async () => {
    mockFrom.mockReturnValue({
      where: vi.fn().mockReturnValue({
        limit: vi.fn().mockRejectedValue(new Error("DB connection failed")),
      }),
    });

    const result = await submitProfileForm(
      undefined,
      createFormData(validFormData)
    );

    const errorResult = result as SubmissionResult<string[]>;
    expect(errorResult.status).toBe("error");
    expect(errorResult.error?.[""]).toContain(
      "プロフィールの保存に失敗しました。"
    );
  });
});
