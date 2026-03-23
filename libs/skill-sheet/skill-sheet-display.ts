import type { SkillCareerLine } from "./skill-sheet-types";

/** モーダル・一覧で用いる1行表記の区切り文字 */
export const SKILL_CAREER_LINE_SEPARATOR = " | ";

/**
 * 経歴1行を表示用に連結する。
 * 概要が空のときは表示から除外する。
 */
export function formatSkillCareerLine(line: SkillCareerLine): string {
  const period = `${line.startYear}–${line.endYear}`;
  const parts: string[] = [period, line.projectName];
  if (line.summary.trim().length > 0) {
    parts.push(line.summary.trim());
  }
  return parts.join(SKILL_CAREER_LINE_SEPARATOR);
}
