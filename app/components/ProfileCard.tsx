"use client";

import type { ProfileData } from "../schema";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { UserForm } from "./UserForm";

const genderLabel: Record<string, string> = {
  male: "男性",
  female: "女性",
  other: "その他",
};

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
