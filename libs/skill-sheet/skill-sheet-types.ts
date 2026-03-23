/** スキルシートの経歴1行（永続化・バリデーション共通） */
export type SkillCareerLine = {
  startYear: number;
  endYear: number;
  projectName: string;
  summary: string;
  skillsUsed: string;
};

/** フォーム／DB 共通のスキルシート値 */
export type SkillSheetValues = {
  experienceYears: number;
  ownedSkills: string;
  careers: SkillCareerLine[];
};
