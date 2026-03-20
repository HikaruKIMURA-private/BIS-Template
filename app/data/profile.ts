import { eq } from "drizzle-orm";

import { db } from "@/db";
import { profile, user } from "@/db/schema";

export async function getUserProfile(userId: string) {
  const userProfile = await db
    .select({
      name: profile.name,
      gender: profile.gender,
      birthDate: profile.birthDate,
      note: profile.note,
      bloodType: profile.bloodType,
      avatarUrl: profile.avatarUrl,
      oauthImageUrl: user.image,
    })
    .from(profile)
    .innerJoin(user, eq(profile.userId, user.id))
    .where(eq(profile.userId, userId))
    .limit(1);

  return userProfile[0] ?? null;
}
