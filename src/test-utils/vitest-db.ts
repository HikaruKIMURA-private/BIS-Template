import { eq } from "drizzle-orm";

import { db } from "@/db";
import { profile, skillSheet, user } from "@/db/schema";

export async function cleanupTestUser(userId: string) {
  await db.delete(skillSheet).where(eq(skillSheet.userId, userId));
  await db.delete(profile).where(eq(profile.userId, userId));
  await db.delete(user).where(eq(user.id, userId));
}

export async function seedTestUser(userId: string, email: string) {
  await cleanupTestUser(userId);
  await db.insert(user).values({
    id: userId,
    name: "テスト",
    email,
    emailVerified: false,
  });
}
