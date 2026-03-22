"use client";

import type { AvatarFormActionResult } from "../actions/avatar";

import { getInputProps, useForm } from "@conform-to/react";
import { parseWithZod } from "@conform-to/zod/v3";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import {
  removeAvatarForm as defaultRemoveAction,
  submitAvatarForm as defaultSubmitAction,
} from "../actions/avatar";
import { avatarUploadFormSchema } from "../schema";

type AvatarAction = (
  prev: AvatarFormActionResult | undefined,
  formData: FormData
) => AvatarFormActionResult | Promise<AvatarFormActionResult>;

type AvatarUploadFormProps = {
  submitAction?: AvatarAction;
  removeAction?: AvatarAction;
  hasCustomAvatar: boolean;
};

export function AvatarUploadForm({
  submitAction = defaultSubmitAction,
  removeAction = defaultRemoveAction,
  hasCustomAvatar,
}: AvatarUploadFormProps) {
  const [lastResult, formAction, isPending] = useActionState(
    submitAction,
    undefined
  );
  const [removeResult, removeFormAction, isRemovePending] = useActionState(
    removeAction,
    undefined
  );

  const [form, fields] = useForm({
    lastResult,
    onValidate({ formData }) {
      return parseWithZod(formData, {
        schema: avatarUploadFormSchema,
      });
    },
    shouldValidate: "onBlur",
    shouldRevalidate: "onInput",
  });

  const successMessage =
    lastResult?.status === "success" && "message" in lastResult
      ? lastResult.message
      : null;
  const removeSuccessMessage =
    removeResult?.status === "success" && "message" in removeResult
      ? removeResult.message
      : null;

  return (
    <div className="mb-6 rounded-md border border-zinc-200 p-4 dark:border-zinc-700">
      <h3 className="mb-3 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
        アバター画像
      </h3>
      <form
        id={form.id}
        onSubmit={form.onSubmit}
        action={formAction}
        noValidate
        className="space-y-3"
      >
        <div>
          <label
            htmlFor={fields.avatar.id}
            className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400"
          >
            画像を選択（JPEG / PNG / WebP、2MB 以下）
          </label>
          <input
            {...getInputProps(fields.avatar, {
              type: "file",
              accept: "image/jpeg,image/png,image/webp",
            })}
            className="block w-full text-sm text-zinc-700 file:mr-3 file:rounded-md file:border-0 file:bg-zinc-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-zinc-900 hover:file:bg-zinc-200 dark:text-zinc-300 dark:file:bg-zinc-800 dark:file:text-zinc-100 dark:hover:file:bg-zinc-700"
          />
          {fields.avatar.errors && fields.avatar.errors.length > 0 && (
            <p
              className="mt-1 text-xs text-red-600 dark:text-red-400"
              role="alert"
            >
              {fields.avatar.errors[0]}
            </p>
          )}
        </div>
        {form.errors && (
          <p className="text-xs text-red-600 dark:text-red-400" role="alert">
            {form.errors[0]}
          </p>
        )}
        {successMessage && (
          <p
            className="text-xs text-green-600 dark:text-green-400"
            role="alert"
          >
            {successMessage}
          </p>
        )}
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "アップロード中..." : "アップロード"}
        </Button>
      </form>

      {hasCustomAvatar && (
        <form action={removeFormAction} className="mt-3">
          {removeResult?.status === "error" && "error" in removeResult && (
            <p className="mb-2 text-xs text-red-600 dark:text-red-400">
              {removeResult.error?.[""]?.[0] ?? "削除に失敗しました。"}
            </p>
          )}
          {removeSuccessMessage && (
            <p className="mb-2 text-xs text-green-600 dark:text-green-400">
              {removeSuccessMessage}
            </p>
          )}
          <Button
            type="submit"
            variant="outline"
            size="sm"
            disabled={isRemovePending}
          >
            {isRemovePending ? "削除中..." : "カスタムアバターを削除"}
          </Button>
        </form>
      )}
    </div>
  );
}
