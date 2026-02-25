import { z } from "zod";

// プロフィールフォームのバリデーションスキーマ
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

export type ProfileData = {
  name: string;
  gender: string;
  birthDate: string;
  note: string | null;
  bloodType: string | null;
};
