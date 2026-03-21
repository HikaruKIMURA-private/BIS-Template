import { eq } from "drizzle-orm";

import { db } from "@/db";
import { profile } from "@/db/schema";

export async function updateProfileAvatarUrl(
  userId: string,
  avatarUrl: string | null
) {
  const updated = await db
    .update(profile)
    .set({ avatarUrl })
    .where(eq(profile.userId, userId))
    .returning({ id: profile.id });

  return updated.length > 0;
}

export async function getUserProfile(userId: string) {
  const userProfile = await db
    .select({
      name: profile.name,
      gender: profile.gender,
      birthDate: profile.birthDate,
      note: profile.note,
      bloodType: profile.bloodType,
      avatarUrl: profile.avatarUrl,
    })
    .from(profile)
    .where(eq(profile.userId, userId))
    .limit(1);

  return userProfile[0] ?? null;
}
