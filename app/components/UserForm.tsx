"use client";

import { Button } from "@/components/ui/button";
import { getInputProps, getTextareaProps, useForm } from "@conform-to/react";
import { parseWithZod } from "@conform-to/zod/v3";
import { useActionState } from "react";
import { submitProfileForm } from "../actions/profile";
import { type ProfileData, profileFormSchema } from "../schema";

type UserFormProps = {
  defaultProfile?: ProfileData;
  onCancel?: () => void;
};

export function UserForm({ defaultProfile, onCancel }: UserFormProps) {
  // 性別の選択肢
  const genderOptions: Array<{ value: string; label: string }> = [
    { value: "male", label: "男性" },
    { value: "female", label: "女性" },
  ];
  const [lastResult, formAction, isPending] = useActionState(
    submitProfileForm,
    undefined
  );

  const isEditing = !!defaultProfile;

  const [form, fields] = useForm({
    lastResult,
    defaultValue: {
      name: defaultProfile?.name ?? "",
      gender: defaultProfile?.gender ?? "",
      birthDate: defaultProfile?.birthDate ?? "",
      note: defaultProfile?.note ?? "",
    },
    onValidate({ formData }) {
      return parseWithZod(formData, {
        schema: profileFormSchema,
      });
    },
    shouldValidate: "onBlur",
    shouldRevalidate: "onInput",
  });

  return (
    <div className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
        {isEditing ? "プロフィール編集" : "プロフィール登録"}
      </h2>

      <form
        id={form.id}
        onSubmit={form.onSubmit}
        action={formAction}
        noValidate
      >
        {/* 名前フィールド */}
        <div className="mb-4">
          <label
            htmlFor={fields.name.id}
            className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            名前
          </label>
          <input
            {...getInputProps(fields.name, { type: "text" })}
            placeholder="山田太郎"
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-blue-400 dark:focus:ring-blue-400"
          />
          {fields.name.errors && fields.name.errors.length > 0 && (
            <p
              id={`${fields.name.id}-error`}
              className="mt-1 text-sm text-red-600 dark:text-red-400"
              role="alert"
            >
              {fields.name.errors[0]}
            </p>
          )}
        </div>

        {/* 性別フィールド（ラジオボタン） */}
        <div className="mb-4">
          <fieldset>
            <legend className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              性別
            </legend>
            <div className="flex gap-4">
              {genderOptions.map((option) => (
                <label key={option.value} className="flex items-center gap-2">
                  <input
                    {...getInputProps(fields.gender, {
                      type: "radio",
                      value: option.value,
                    })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 dark:focus:ring-blue-400"
                  />
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">
                    {option.label}
                  </span>
                </label>
              ))}
            </div>
            {fields.gender.errors && fields.gender.errors.length > 0 && (
              <p
                id={`${fields.gender.id}-error`}
                className="mt-1 text-sm text-red-600 dark:text-red-400"
                role="alert"
              >
                {fields.gender.errors[0]}
              </p>
            )}
          </fieldset>
        </div>

        {/* 生年月日フィールド */}
        <div className="mb-4">
          <label
            htmlFor={fields.birthDate.id}
            className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            生年月日
          </label>
          <input
            {...getInputProps(fields.birthDate, { type: "date" })}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-blue-400 dark:focus:ring-blue-400"
          />
          {fields.birthDate.errors && fields.birthDate.errors.length > 0 && (
            <p
              id={`${fields.birthDate.id}-error`}
              className="mt-1 text-sm text-red-600 dark:text-red-400"
              role="alert"
            >
              {fields.birthDate.errors[0]}
            </p>
          )}
        </div>

        {/* 備考フィールド */}
        <div className="mb-6">
          <label
            htmlFor={fields.note.id}
            className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            備考
          </label>
          <textarea
            {...getTextareaProps(fields.note)}
            placeholder="自己紹介など"
            rows={4}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-blue-400 dark:focus:ring-blue-400"
          />
          {fields.note.errors && fields.note.errors.length > 0 && (
            <p
              id={`${fields.note.id}-error`}
              className="mt-1 text-sm text-red-600 dark:text-red-400"
              role="alert"
            >
              {fields.note.errors[0]}
            </p>
          )}
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            500文字以内で入力してください
          </p>
        </div>

        {/* フォーム全体のエラーメッセージ */}
        {form.errors && (
          <div className="mb-4 rounded-md bg-red-50 p-3 dark:bg-red-900/20">
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {form.errors[0]}
            </p>
          </div>
        )}

        {/* 成功メッセージ */}
        {lastResult?.status === "success" && "message" in lastResult && (
          <div className="mb-4 rounded-md bg-green-50 p-3 dark:bg-green-900/20">
            <p
              className="text-sm text-green-600 dark:text-green-400"
              role="alert"
            >
              {lastResult.message}
            </p>
          </div>
        )}

        {/* ボタン */}
        <div className={onCancel ? "flex gap-3" : ""}>
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1"
            >
              キャンセル
            </Button>
          )}
          <Button
            type="submit"
            disabled={isPending}
            className={`${onCancel ? "flex-1" : "w-full"} rounded-md bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600`}
          >
            {isPending ? "保存中..." : "保存"}
          </Button>
        </div>
      </form>
    </div>
  );
}
