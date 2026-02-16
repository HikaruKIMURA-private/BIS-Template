import { auth } from "@/auth";
import { db } from "@/src/index";
import { profile } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ThemeToggle } from "../../components/ThemeToggle";
import { LogoutButton } from "../../components/LogoutButton";
import { ProfileCard } from "../../components/ProfileCard";
import { UserForm } from "../../components/UserForm";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const userProfile = await db
    .select({
      name: profile.name,
      gender: profile.gender,
      birthDate: profile.birthDate,
      note: profile.note,
    })
    .from(profile)
    .where(eq(profile.userId, session.user.id))
    .limit(1);

  const profileData = userProfile[0] ?? null;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <ThemeToggle />
      <div className="mb-4 flex w-full max-w-md items-center justify-between px-4">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          ようこそ、{session.user.name || session.user.email}さん
        </p>
        <LogoutButton />
      </div>
      {profileData ? <ProfileCard profile={profileData} /> : <UserForm />}
    </div>
  );
}
