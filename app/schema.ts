import { z } from "zod";

import { parseAvatarFileForUpload } from "@/libs/avatar/avatar-validation";
import {
  careerArraySchema,
  experienceYearsFieldSchema,
  ownedSkillsFieldSchema,
} from "@/libs/skill-sheet/skill-sheet-schema";

export const GENDER_OPTIONS = [
  { value: "male", label: "男性" },
  { value: "female", label: "女性" },
] as const;

export const BLOOD_TYPE_OPTIONS = [
  { value: "A", label: "A型" },
  { value: "B", label: "B型" },
  { value: "O", label: "O型" },
  { value: "AB", label: "AB型" },
] as const;

export const genderLabel: Record<string, string> = {
  male: "男性",
  female: "女性",
  other: "その他",
};

export const bloodTypeLabel: Record<string, string> = {
  A: "A型",
  B: "B型",
  O: "O型",
  AB: "AB型",
};

export const profileFormSchema = z.object({
  name: z
    .string({ required_error: "名前は必須です" })
    .min(1, "名前は必須です")
    .max(50, "名前は50文字以内で入力してください"),
  gender: z.enum(["male", "female"], {
    required_error: "性別を選択してください",
  }),
  birthDate: z
    .string({ required_error: "生年月日は必須です" })
    .min(1, "生年月日は必須です")
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "有効な日付を入力してください",
    }),
  note: z.string().max(500, "備考は500文字以内で入力してください").optional(),
  bloodType: z
    .enum(["A", "B", "O", "AB"], {
      message: "血液型を正しく選択してください",
    })
    .optional(),
});

export type ProfileFormData = z.infer<typeof profileFormSchema>;

/** プロフィール編集とスキルシートを同一フォームで送信するときのスキーマ（経歴は careersJson で送る） */
export const profileAndSkillSheetFormSchema = profileFormSchema
  .merge(
    z.object({
      experienceYears: experienceYearsFieldSchema,
      ownedSkills: ownedSkillsFieldSchema,
      careersJson: z.string(),
    })
  )
  .superRefine((data, ctx) => {
    try {
      const parsed: unknown = JSON.parse(data.careersJson);
      const r = careerArraySchema.safeParse(parsed);
      if (!r.success) {
        for (const issue of r.error.issues) {
          ctx.addIssue({
            ...issue,
            path: ["careersJson", ...issue.path],
          });
        }
      }
    } catch {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "経歴の形式が不正です",
        path: ["careersJson"],
      });
    }
  })
  .transform((data) => {
    const parsed: unknown = JSON.parse(data.careersJson);
    const careers = careerArraySchema.parse(parsed);
    const { careersJson, experienceYears, ownedSkills, ...profileFields } = data;
    return {
      ...profileFields,
      experienceYears,
      ownedSkills,
      careers,
    };
  });

export type ProfileAndSkillSheetFormData = z.infer<
  typeof profileAndSkillSheetFormSchema
>;

export type ProfileData = {
  name: string;
  gender: string;
  birthDate: string;
  note: string | null;
  bloodType: string | null;
  avatarUrl: string | null;
};

/** アバターアップロード（Conform + サーバーで共通） */
export const avatarUploadFormSchema = z.object({
  avatar: z
    .custom<File>((v) => v instanceof File, {
      message: "画像ファイルを選択してください",
    })
    .superRefine((file, ctx) => {
      const r = parseAvatarFileForUpload(file);
      if (!r.ok) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: r.error,
        });
      }
    }),
});

export function toProfileRecord(data: ProfileFormData) {
  return {
    name: data.name,
    gender: data.gender,
    birthDate: data.birthDate,
    note: data.note || null,
    bloodType: data.bloodType ?? null,
  };
}
