import type { SubmissionResult } from "@conform-to/react";

import { eq } from "drizzle-orm";
import {
  beforeEach,
  describe,
  expect,
  it,
  onTestFinished,
  vi,
} from "vitest";

import { db } from "@/db";
import { profile, skillSheet } from "@/db/schema";
import {
  cleanupTestUser,
  seedTestUser,
} from "@/src/test-utils/vitest-db";

import { submitProfileAndSkillSheet } from "./skill-sheet";

/**
 * プロフィールとスキルシートを単一 Server Action でまとめて保存する場合の結合仕様。
 */

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

const TEST_USER_ID = "skill-action-user";
const TEST_EMAIL = "skill-action@test.com";

function createFormData(data: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(data)) {
    fd.append(key, value);
  }
  return fd;
}

const validCareerJson = JSON.stringify([
  {
    startYear: 2020,
    endYear: 2021,
    projectName: "P",
    summary: "概要",
    skillsUsed: "Go",
  },
]);

const validCombined = {
  name: "山田太郎",
  gender: "male",
  birthDate: "1990-01-15",
  note: "",
  bloodType: "",
  experienceYears: "5",
  ownedSkills: "TypeScript",
  careersJson: validCareerJson,
};

describe("submitProfileAndSkillSheet（仮称）", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await cleanupTestUser(TEST_USER_ID);
  });

  it("セッションが無いとき、未認証として失敗すること", async () => {
    mockGetSession.mockResolvedValue(null);

    const result = await submitProfileAndSkillSheet(
      undefined,
      createFormData(validCombined)
    );

    const errorResult = result as SubmissionResult<string[]>;
    expect(errorResult.status).toBe("error");
    expect(errorResult.error?.[""]).toContain(
      "認証が必要です。ログインしてください。"
    );

    const profiles = await db
      .select()
      .from(profile)
      .where(eq(profile.userId, TEST_USER_ID));
    const sheets = await db
      .select()
      .from(skillSheet)
      .where(eq(skillSheet.userId, TEST_USER_ID));
    expect(profiles).toHaveLength(0);
    expect(sheets).toHaveLength(0);
  });

  describe("認証済み・バリデーション失敗時は永続化しない", () => {
    beforeEach(async () => {
      await seedTestUser(TEST_USER_ID, TEST_EMAIL);
      mockGetSession.mockResolvedValue({ user: { id: TEST_USER_ID } });

      onTestFinished(async () => {
        await cleanupTestUser(TEST_USER_ID);
      });
    });

    it("プロフィール側のバリデーションが失敗するとき、スキルシートが正しくても保存されないこと", async () => {
      const beforeProfiles = await db
        .select()
        .from(profile)
        .where(eq(profile.userId, TEST_USER_ID));
      const beforeSheets = await db
        .select()
        .from(skillSheet)
        .where(eq(skillSheet.userId, TEST_USER_ID));
      expect(beforeProfiles).toHaveLength(0);
      expect(beforeSheets).toHaveLength(0);

      const result = await submitProfileAndSkillSheet(
        undefined,
        createFormData({
          ...validCombined,
          name: "",
        })
      );

      expect(result.status).not.toBe("success");

      const afterProfiles = await db
        .select()
        .from(profile)
        .where(eq(profile.userId, TEST_USER_ID));
      const afterSheets = await db
        .select()
        .from(skillSheet)
        .where(eq(skillSheet.userId, TEST_USER_ID));
      expect(afterProfiles).toHaveLength(0);
      expect(afterSheets).toHaveLength(0);
    });

    it("スキルシート側のバリデーションが失敗するとき、プロフィールが正しくても保存されないこと", async () => {
      const beforeProfiles = await db
        .select()
        .from(profile)
        .where(eq(profile.userId, TEST_USER_ID));
      const beforeSheets = await db
        .select()
        .from(skillSheet)
        .where(eq(skillSheet.userId, TEST_USER_ID));
      expect(beforeProfiles).toHaveLength(0);
      expect(beforeSheets).toHaveLength(0);

      const result = await submitProfileAndSkillSheet(
        undefined,
        createFormData({
          ...validCombined,
          ownedSkills: "",
        })
      );

      expect(result.status).not.toBe("success");

      const afterProfiles = await db
        .select()
        .from(profile)
        .where(eq(profile.userId, TEST_USER_ID));
      const afterSheets = await db
        .select()
        .from(skillSheet)
        .where(eq(skillSheet.userId, TEST_USER_ID));
      expect(afterProfiles).toHaveLength(0);
      expect(afterSheets).toHaveLength(0);
    });
  });

  describe("認証済み・両方有効", () => {
    beforeEach(async () => {
      await seedTestUser(TEST_USER_ID, TEST_EMAIL);
      mockGetSession.mockResolvedValue({ user: { id: TEST_USER_ID } });

      onTestFinished(async () => {
        await cleanupTestUser(TEST_USER_ID);
      });
    });

    it("プロフィールとスキルシートの両方が有効なとき、一括で永続化されること", async () => {
      await expect(
        submitProfileAndSkillSheet(undefined, createFormData(validCombined))
      ).rejects.toThrow("NEXT_REDIRECT");

      const profiles = await db
        .select()
        .from(profile)
        .where(eq(profile.userId, TEST_USER_ID));
      const sheets = await db
        .select()
        .from(skillSheet)
        .where(eq(skillSheet.userId, TEST_USER_ID));

      expect(profiles).toHaveLength(1);
      expect(profiles[0].name).toBe("山田太郎");

      expect(sheets).toHaveLength(1);
      expect(sheets[0].experienceYears).toBe(5);
      expect(sheets[0].ownedSkills).toBe("TypeScript");
      expect(sheets[0].careers).toHaveLength(1);
      expect(sheets[0].careers[0].projectName).toBe("P");

      expect(mockRevalidatePath).toHaveBeenCalledWith("/dashboard");
      expect(mockRedirect).toHaveBeenCalledWith("/dashboard");
    });
  });
});
