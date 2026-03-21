"use client";

import Image from "next/image";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { type ProfileData, bloodTypeLabel, genderLabel } from "../schema";
import { UserForm } from "./UserForm";

function ProfileAvatarDisplay({
  name,
  avatarUrl,
  oauthImageUrl,
}: {
  name: string;
  avatarUrl: string | null;
  oauthImageUrl: string | null;
}) {
  const initial = name.trim().charAt(0) || "?";
  const src = avatarUrl ?? oauthImageUrl;
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-zinc-200 text-2xl font-semibold text-zinc-600 dark:bg-zinc-700 dark:text-zinc-200"
        aria-hidden
      >
        {initial}
      </div>
    );
  }

  const isAppStorage = src.includes("/storage/v1/object/public/");

  if (isAppStorage) {
    return (
      <div className="mb-6">
        {/* unoptimized: ローカル Supabase 等で next/image の最適化パイプラインが失敗し onError になるのを防ぐ */}
        <Image
          src={src}
          alt=""
          width={80}
          height={80}
          unoptimized
          className="h-20 w-20 rounded-full object-cover"
          onError={() => setFailed(true)}
        />
      </div>
    );
  }

  return (
    <div className="mb-6">
      <img
        src={src}
        alt=""
        width={80}
        height={80}
        className="h-20 w-20 rounded-full object-cover"
        onError={() => setFailed(true)}
      />
    </div>
  );
}

export function ProfileCard({ profile }: { profile: ProfileData }) {
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing) {
    return (
      <UserForm defaultProfile={profile} onCancel={() => setIsEditing(false)} />
    );
  }

  return (
    <div className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          プロフィール
        </h2>
        <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
          編集
        </Button>
      </div>

      <ProfileAvatarDisplay
        name={profile.name}
        avatarUrl={profile.avatarUrl}
        oauthImageUrl={profile.oauthImageUrl}
      />

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
