"use client";

import type { FormActionResult } from "../actions/profile";

import { useForm } from "@conform-to/react";
import { parseWithZod } from "@conform-to/zod/v3";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { submitProfileForm as defaultAction } from "../actions/profile";
import { type ProfileData, profileFormSchema } from "../schema";

import { ProfileFormFields } from "./ProfileFormFields";

type ProfileFormAction = (
  prevState: FormActionResult | undefined,
  formData: FormData
) => FormActionResult | Promise<FormActionResult>;

function useProfileForm(
  action: ProfileFormAction,
  defaultProfile?: ProfileData
) {
  const [lastResult, formAction, isPending] = useActionState(action, undefined);

  const isEditing = !!defaultProfile;

  const [form, fields] = useForm({
    lastResult,
    defaultValue: {
      name: defaultProfile?.name ?? "",
      gender: defaultProfile?.gender ?? "",
      birthDate: defaultProfile?.birthDate ?? "",
      note: defaultProfile?.note ?? "",
      bloodType: defaultProfile?.bloodType ?? "",
    },
    onValidate({ formData }) {
      return parseWithZod(formData, {
        schema: profileFormSchema,
      });
    },
    shouldValidate: "onBlur",
    shouldRevalidate: "onInput",
  });

  return { form, fields, formAction, isPending, lastResult, isEditing };
}

type UserFormProps = {
  defaultProfile?: ProfileData;
  onCancel?: () => void;
  action?: ProfileFormAction;
};

export function UserForm({
  defaultProfile,
  onCancel,
  action = defaultAction,
}: UserFormProps) {
  const { form, fields, formAction, isPending, lastResult, isEditing } =
    useProfileForm(action, defaultProfile);

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
        <ProfileFormFields fields={fields} />

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
            className={`${onCancel ? "flex-1" : "w-full"} rounded-md bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600`}
          >
            {isPending ? "保存中..." : "保存"}
          </Button>
        </div>
      </form>
    </div>
  );
}
