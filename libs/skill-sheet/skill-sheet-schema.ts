import { z } from "zod";

import {
  MAX_CAREER_LINES,
  MAX_EXPERIENCE_YEARS,
  MAX_OWNED_SKILLS_LENGTH,
} from "./skill-sheet-constants";
import type { SkillSheetValues } from "./skill-sheet-types";

export const careerLineSchema = z
  .object({
    startYear: z.number().int().min(1900).max(2100),
    endYear: z.number().int().min(1900).max(2100),
    projectName: z.string().min(1, "プロジェクト名は必須です"),
    summary: z.string(),
    skillsUsed: z.string().min(1, "使用スキルは必須です"),
  })
  .refine((d) => d.startYear <= d.endYear, {
    message: "開始年は終了年以前である必要があります",
    path: ["endYear"],
  });

export const careerArraySchema = z
  .array(careerLineSchema)
  .max(MAX_CAREER_LINES, `経歴は最大${MAX_CAREER_LINES}行までです`);

export const experienceYearsFieldSchema = z.coerce
  .number({
    invalid_type_error: "経験年数を選択してください",
  })
  .int("経験年数は整数である必要があります")
  .min(0, "経験年数は0以上である必要があります")
  .max(
    MAX_EXPERIENCE_YEARS,
    `経験年数は${MAX_EXPERIENCE_YEARS}以下である必要があります`
  );

export const ownedSkillsFieldSchema = z
  .string()
  .min(1, "所有スキルを入力してください")
  .max(
    MAX_OWNED_SKILLS_LENGTH,
    `所有スキルは${MAX_OWNED_SKILLS_LENGTH}文字以内で入力してください`
  );

export const skillSheetFormSchema = z.object({
  experienceYears: experienceYearsFieldSchema,
  ownedSkills: ownedSkillsFieldSchema,
  careers: careerArraySchema,
});

export type SkillSheetFormData = z.infer<typeof skillSheetFormSchema>;

export function toSkillSheetValues(data: SkillSheetFormData): SkillSheetValues {
  return {
    experienceYears: data.experienceYears,
    ownedSkills: data.ownedSkills,
    careers: data.careers,
  };
}
