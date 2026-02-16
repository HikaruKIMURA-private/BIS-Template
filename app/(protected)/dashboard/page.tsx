"use client";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "../../components/ThemeToggle";
import { UserForm } from "../../components/UserForm";

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  const handleLogout = async () => {
    await authClient.signOut();
    router.push("/login");
  };

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
        <div className="text-zinc-600 dark:text-zinc-400">読み込み中...</div>
      </div>
    );
  }

  if (!session) {
    router.push("/login");
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <ThemeToggle />
      <div className="mb-4 flex w-full max-w-md items-center justify-between px-4">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          ようこそ、{session.user.name || session.user.email}さん
        </p>
        <Button variant="outline" size="sm" onClick={handleLogout}>
          ログアウト
        </Button>
      </div>
      <UserForm />
    </div>
  );
}
