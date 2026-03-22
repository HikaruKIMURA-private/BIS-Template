"use client";

import Image from "next/image";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { resolveAvatarImageUrl } from "@/libs/avatar/avatar-display";
import { type ProfileData, bloodTypeLabel, genderLabel } from "../schema";
import { AvatarUploadForm } from "./AvatarUploadForm";
import { UserForm } from "./UserForm";

type ProfileCardProps = {
  profile: ProfileData;
  /** OAuth 等で取得したユーザー画像（カスタムアバター未設定時のフォールバック） */
  sessionFallbackImage?: string | null;
};

export function ProfileCard({
  profile,
  sessionFallbackImage = null,
}: ProfileCardProps) {
  const [isEditing, setIsEditing] = useState(false);

  const displayImageUrl = resolveAvatarImageUrl(
    profile.avatarUrl,
    sessionFallbackImage
  );

  if (isEditing) {
    return (
      <div className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <AvatarUploadForm hasCustomAvatar={!!profile.avatarUrl} />
        <UserForm
          defaultProfile={profile}
          onCancel={() => setIsEditing(false)}
        />
      </div>
    );
  }

  return (
    <div className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-6 flex flex-col items-center">
        {displayImageUrl ? (
          <Image
            src={displayImageUrl}
            alt="プロフィール画像"
            width={96}
            height={96}
            className="h-24 w-24 rounded-full object-cover ring-2 ring-zinc-200 dark:ring-zinc-600"
            unoptimized={
              displayImageUrl.includes("127.0.0.1") ? true : undefined
            }
          />
        ) : (
          <div
            className="flex h-24 w-24 items-center justify-center rounded-full bg-zinc-200 text-2xl font-bold text-zinc-700 ring-2 ring-zinc-200 dark:bg-zinc-700 dark:text-zinc-100 dark:ring-zinc-600"
            aria-hidden
          >
            {profile.name.slice(0, 1)}
          </div>
        )}
      </div>

      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          プロフィール
        </h2>
        <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
          編集
        </Button>
      </div>

      <dl className="space-y-4">
        <div>
          <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            名前
          </dt>
          <dd className="mt-1 text-zinc-900 dark:text-zinc-100">
            {profile.name}
          </dd>
        </div>

        <div>
          <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            性別
          </dt>
          <dd className="mt-1 text-zinc-900 dark:text-zinc-100">
            {genderLabel[profile.gender] ?? profile.gender}
          </dd>
        </div>

        {profile.bloodType && (
          <div>
            <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              血液型
            </dt>
            <dd className="mt-1 text-zinc-900 dark:text-zinc-100">
              {bloodTypeLabel[profile.bloodType] ?? profile.bloodType}
            </dd>
          </div>
        )}

        <div>
          <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            生年月日
          </dt>
          <dd className="mt-1 text-zinc-900 dark:text-zinc-100">
            {profile.birthDate}
          </dd>
        </div>

        {profile.note && (
          <div>
            <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              備考
            </dt>
            <dd className="mt-1 whitespace-pre-wrap text-zinc-900 dark:text-zinc-100">
              {profile.note}
            </dd>
          </div>
        )}
      </dl>
    </div>
  );
}
