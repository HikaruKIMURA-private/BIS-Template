import { ThemeToggle } from "./components/ThemeToggle";
import { UserForm } from "./components/UserForm";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <ThemeToggle />
      <UserForm />
    </div>
  );
}
