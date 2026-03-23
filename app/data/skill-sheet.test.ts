import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it, onTestFinished } from "vitest";

import { db } from "@/db";
import { skillSheet } from "@/db/schema";
import {
  cleanupTestUser,
  seedTestUser,
} from "@/src/test-utils/vitest-db";

import { getSkillSheet, upsertSkillSheet } from "./skill-sheet";

/**
 * スキルシートの取得・永続化（実装時の関数名に合わせて describe をリネーム）。
 * postgres_test を用いた結合テスト向け。
 */
describe("getSkillSheet / upsertSkillSheet（仮称）", () => {
  const USER = "skill-data-user-1";
  const EMAIL = "skill-data@test.com";

  const validSheet = {
    experienceYears: 5,
    ownedSkills: "TypeScript",
    careers: [
      {
        startYear: 2020,
        endYear: 2021,
        projectName: "決済",
        summary: "API",
        skillsUsed: "Go",
      },
    ],
  };

  describe("未保存ユーザー", () => {
    beforeEach(async () => {
      await seedTestUser(USER, EMAIL);

      onTestFinished(async () => {
        await cleanupTestUser(USER);
      });
    });

    it("スキルシートが未保存のユーザーのとき、null または空の既定値が返ること", async () => {
      const row = await getSkillSheet(USER);

      expect(row).toBeNull();
    });
  });

  describe("保存と取得の一致", () => {
    beforeEach(async () => {
      await seedTestUser(USER, EMAIL);
      await upsertSkillSheet(USER, validSheet);

      onTestFinished(async () => {
        await cleanupTestUser(USER);
      });
    });

    it("有効なデータを保存したあと、同じ userId で取得すると保存内容が一致すること", async () => {
      const row = await getSkillSheet(USER);

      expect(row).toEqual(validSheet);

      const rows = await db
        .select()
        .from(skillSheet)
        .where(eq(skillSheet.userId, USER));
      expect(rows).toHaveLength(1);
      expect(rows[0].experienceYears).toBe(validSheet.experienceYears);
      expect(rows[0].ownedSkills).toBe(validSheet.ownedSkills);
      expect(rows[0].careers).toEqual(validSheet.careers);
    });
  });

  describe("更新の上書き", () => {
    const oldSheet = {
      experienceYears: 1,
      ownedSkills: "旧",
      careers: [
        {
          startYear: 2019,
          endYear: 2019,
          projectName: "旧P",
          summary: "",
          skillsUsed: "Perl",
        },
      ],
    };

    const newSheet = {
      experienceYears: 8,
      ownedSkills: "Rust",
      careers: [
        {
          startYear: 2022,
          endYear: 2023,
          projectName: "新P",
          summary: "詳細",
          skillsUsed: "Rust",
        },
      ],
    };

    beforeEach(async () => {
      await seedTestUser(USER, EMAIL);
      await upsertSkillSheet(USER, oldSheet);

      onTestFinished(async () => {
        await cleanupTestUser(USER);
      });
    });

    it("既存データがある状態で更新すると、旧値が上書きされ取得結果が新値になること", async () => {
      await upsertSkillSheet(USER, newSheet);

      const row = await getSkillSheet(USER);

      expect(row).toEqual(newSheet);

      const rows = await db
        .select()
        .from(skillSheet)
        .where(eq(skillSheet.userId, USER));
      expect(rows[0].ownedSkills).toBe("Rust");
      expect(rows[0].experienceYears).toBe(8);
    });
  });

  describe("テナント分離", () => {
    const USER_A = "skill-data-user-a";
    const USER_B = "skill-data-user-b";

    beforeEach(async () => {
      await seedTestUser(USER_A, "skill-a@test.com");
      await seedTestUser(USER_B, "skill-b@test.com");
      await upsertSkillSheet(USER_B, validSheet);

      onTestFinished(async () => {
        await cleanupTestUser(USER_A);
        await cleanupTestUser(USER_B);
      });
    });

    it("他ユーザーのデータが混入しないこと", async () => {
      const a = await getSkillSheet(USER_A);
      const b = await getSkillSheet(USER_B);

      expect(a).toBeNull();
      expect(b).toEqual(validSheet);

      const rowsA = await db
        .select()
        .from(skillSheet)
        .where(eq(skillSheet.userId, USER_A));
      const rowsB = await db
        .select()
        .from(skillSheet)
        .where(eq(skillSheet.userId, USER_B));
      expect(rowsA).toHaveLength(0);
      expect(rowsB).toHaveLength(1);
    });
  });
});
