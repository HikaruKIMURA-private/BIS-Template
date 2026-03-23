import { describe, expect, it } from "vitest";

import {
  MAX_CAREER_LINES,
  MAX_EXPERIENCE_YEARS,
  MAX_OWNED_SKILLS_LENGTH,
} from "./skill-sheet-constants";
import { skillSheetFormSchema } from "./skill-sheet-schema";

/**
 * スキルシート入力の Zod 等（実装時のモジュール名に合わせてリネーム）に対する
 * 純粋バリデーションの振る舞い仕様。
 */
describe("skillSheetFormSchema（仮称）", () => {
  const baseCareer = {
    startYear: 2020,
    endYear: 2021,
    projectName: "プロジェクトA",
    summary: "概要",
    skillsUsed: "TypeScript",
  };

  describe("経験年数（0〜設定された上限の整数）", () => {
    it("経験年数が0のとき、パースに成功すること", () => {
      const r = skillSheetFormSchema.safeParse({
        experienceYears: 0,
        ownedSkills: "a",
        careers: [],
      });

      expect(r.success).toBe(true);
    });

    it("経験年数が設定された上限値のとき、パースに成功すること", () => {
      const r = skillSheetFormSchema.safeParse({
        experienceYears: MAX_EXPERIENCE_YEARS,
        ownedSkills: "a",
        careers: [],
      });

      expect(r.success).toBe(true);
    });

    it("経験年数が負の整数のとき、エラーであること", () => {
      const r = skillSheetFormSchema.safeParse({
        experienceYears: -1,
        ownedSkills: "a",
        careers: [],
      });

      expect(r.success).toBe(false);
    });

    it("経験年数が設定された上限値より大きいとき、エラーであること", () => {
      const r = skillSheetFormSchema.safeParse({
        experienceYears: MAX_EXPERIENCE_YEARS + 1,
        ownedSkills: "a",
        careers: [],
      });

      expect(r.success).toBe(false);
    });

    it("経験年数が小数のとき、エラーであること", () => {
      const r = skillSheetFormSchema.safeParse({
        experienceYears: 3.5,
        ownedSkills: "a",
        careers: [],
      });

      expect(r.success).toBe(false);
    });

    it("経験年数が未入力のとき、エラーであること", () => {
      const r = skillSheetFormSchema.safeParse({
        ownedSkills: "a",
        careers: [],
      });

      expect(r.success).toBe(false);
    });
  });

  describe("所有スキル（テキスト）", () => {
    it("所有スキルが空文字のとき、エラーであること", () => {
      const r = skillSheetFormSchema.safeParse({
        experienceYears: 1,
        ownedSkills: "",
        careers: [],
      });

      expect(r.success).toBe(false);
    });

    it.skip("所有スキルが空文字のとき、パースに成功すること", () => {
      // 仕様: 所有スキルは必須（空文字不可）のため、成功ケースは対象外
    });

    it("所有スキルが最大文字数ちょうどのとき、パースに成功すること", () => {
      const r = skillSheetFormSchema.safeParse({
        experienceYears: 1,
        ownedSkills: "a".repeat(MAX_OWNED_SKILLS_LENGTH),
        careers: [],
      });

      expect(r.success).toBe(true);
    });

    it("所有スキルが最大文字数を1文字超過するとき、エラーであること", () => {
      const r = skillSheetFormSchema.safeParse({
        experienceYears: 1,
        ownedSkills: "a".repeat(MAX_OWNED_SKILLS_LENGTH + 1),
        careers: [],
      });

      expect(r.success).toBe(false);
    });
  });

  describe("経歴行（期間・プロジェクト名・概要・使用スキル）", () => {
    it("経歴が0行のとき、パースに成功すること", () => {
      const r = skillSheetFormSchema.safeParse({
        experienceYears: 1,
        ownedSkills: "a",
        careers: [],
      });

      expect(r.success).toBe(true);
    });

    it.skip("経歴が0行のとき、エラーであること", () => {
      // 仕様: 経歴0行を許容するため、エラーケースは対象外
    });

    it("各行で開始年と終了年が同じ年のとき、パースに成功すること", () => {
      const r = skillSheetFormSchema.safeParse({
        experienceYears: 1,
        ownedSkills: "a",
        careers: [{ ...baseCareer, startYear: 2022, endYear: 2022 }],
      });

      expect(r.success).toBe(true);
    });

    it("開始年が終了年より後の年であるとき、エラーであること", () => {
      const r = skillSheetFormSchema.safeParse({
        experienceYears: 1,
        ownedSkills: "a",
        careers: [{ ...baseCareer, startYear: 2023, endYear: 2022 }],
      });

      expect(r.success).toBe(false);
    });

    it("必須フィールドのいずれかが空である行があるとき、エラーであること", () => {
      const r = skillSheetFormSchema.safeParse({
        experienceYears: 1,
        ownedSkills: "a",
        careers: [
          {
            startYear: 2020,
            endYear: 2021,
            projectName: "",
            summary: "x",
            skillsUsed: "y",
          },
        ],
      });

      expect(r.success).toBe(false);
    });

    it("経歴行が最大件数ちょうどのとき、パースに成功すること", () => {
      const line = { ...baseCareer };
      const careers = Array.from({ length: MAX_CAREER_LINES }, () => ({ ...line }));
      const r = skillSheetFormSchema.safeParse({
        experienceYears: 1,
        ownedSkills: "a",
        careers,
      });

      expect(r.success).toBe(true);
    });

    it("経歴行が最大件数を超えるとき、エラーであること", () => {
      const line = { ...baseCareer };
      const careers = Array.from({ length: MAX_CAREER_LINES + 1 }, () => ({
        ...line,
      }));
      const r = skillSheetFormSchema.safeParse({
        experienceYears: 1,
        ownedSkills: "a",
        careers,
      });

      expect(r.success).toBe(false);
    });
  });
});
