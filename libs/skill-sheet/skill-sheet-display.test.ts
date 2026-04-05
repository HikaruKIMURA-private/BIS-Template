import { describe, expect, it } from "vitest";

import {
  SKILL_CAREER_LINE_SEPARATOR,
  formatSkillCareerLine,
} from "./skill-sheet-display";

/**
 * 経歴の表示用整形が libs に分離される場合の振る舞い仕様。
 */
describe("formatSkillCareerLine（仮称）", () => {
  it("期間とプロジェクト名と概要が与えられたとき、所定の区切り文字で1行にまとまること", () => {
    const line = {
      startYear: 2020,
      endYear: 2022,
      projectName: "決済基盤",
      summary: "API 設計と実装",
      skillsUsed: "Go",
    };

    const out = formatSkillCareerLine(line);

    expect(out).toBe(
      `2020–2022${SKILL_CAREER_LINE_SEPARATOR}決済基盤${SKILL_CAREER_LINE_SEPARATOR}API 設計と実装`
    );
  });

  it("概要が空のとき、表示から除外されること", () => {
    const line = {
      startYear: 2021,
      endYear: 2021,
      projectName: "社内ツール",
      summary: "",
      skillsUsed: "React",
    };

    const out = formatSkillCareerLine(line);

    expect(out).toBe(`2021–2021${SKILL_CAREER_LINE_SEPARATOR}社内ツール`);
    expect(out).not.toContain("概要");
  });
});
