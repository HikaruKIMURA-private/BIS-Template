"use client";

import { useActionState, useEffect } from "react";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  PROFILE_AVATAR_FORM_FIELD,
  profileAvatarConstraints,
} from "@/lib/profile-avatar";

import {
  clearProfileAvatar,
  setProfileAvatar,
  type ClearProfileAvatarResult,
  type SetProfileAvatarResult,
} from "../actions/profile-avatar";

type ProfileAvatarSectionProps = {
  /** 編集モード（プロフィール行が存在する）ときのみ表示する想定 */
  enabled: boolean;
};

export function ProfileAvatarSection({ enabled }: ProfileAvatarSectionProps) {
  const router = useRouter();
  const [uploadState, uploadAction, uploadPending] = useActionState<
    SetProfileAvatarResult | undefined,
    FormData
  >(setProfileAvatar, undefined);
  const [clearState, clearAction, clearPending] = useActionState<
    ClearProfileAvatarResult | undefined,
    FormData
  >(clearProfileAvatar, undefined);

  useEffect(() => {
    if (uploadState?.status === "success" || clearState?.status === "success") {
      router.refresh();
    }
  }, [uploadState, clearState, router]);

  if (!enabled) {
    return null;
  }

  const uploadFormError =
    uploadState?.status === "error"
      ? uploadState.fieldErrors[PROFILE_AVATAR_FORM_FIELD]?.[0]
      : undefined;
  const uploadGlobalError =
    uploadState?.status === "error" && uploadState.formErrors.length > 0
      ? uploadState.formErrors[0]
      : undefined;
  const clearError =
    clearState?.status === "error" ? clearState.formErrors[0] : undefined;

  return (
    <div className="mb-6 rounded-md border border-zinc-200 p-4 dark:border-zinc-700">
      <h3 className="mb-2 text-sm font-medium text-zinc-800 dark:text-zinc-200">
        プロフィール画像
      </h3>
      <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">
        {profileAvatarConstraints.helpText}
      </p>

      <form action={uploadAction} className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label
            htmlFor={`${PROFILE_AVATAR_FORM_FIELD}-input`}
            className="sr-only"
          >
            プロフィール画像ファイル
          </label>
          <input
            id={`${PROFILE_AVATAR_FORM_FIELD}-input`}
            name={PROFILE_AVATAR_FORM_FIELD}
            type="file"
            accept={profileAvatarConstraints.allowedMimeTypes.join(",")}
            className="block w-full text-sm text-zinc-700 file:mr-3 file:rounded file:border file:border-zinc-300 file:bg-zinc-50 file:px-3 file:py-1.5 file:text-sm dark:text-zinc-200 dark:file:border-zinc-600 dark:file:bg-zinc-800"
            disabled={uploadPending}
          />
          {uploadFormError && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
              {uploadFormError}
            </p>
          )}
        </div>
        <Button type="submit" disabled={uploadPending} size="sm">
          {uploadPending ? "アップロード中..." : "アップロード"}
        </Button>
      </form>

      {uploadGlobalError && (
        <p className="mb-3 text-sm text-red-600 dark:text-red-400" role="alert">
          {uploadGlobalError}
        </p>
      )}

      <form action={clearAction}>
        <Button
          type="submit"
          variant="outline"
          size="sm"
          disabled={clearPending}
        >
          {clearPending ? "削除中..." : "画像を削除"}
        </Button>
      </form>
      {clearError && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400" role="alert">
          {clearError}
        </p>
      )}
    </div>
  );
}
