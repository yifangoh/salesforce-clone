import Link from "next/link";
import { redirect } from "next/navigation";
import { Search, Settings, LogOut } from "lucide-react";
import { getSession } from "@/lib/supabase/server";
import { signOut } from "@/app/actions";
import { Logo } from "@/components/logo";
import { NavTabs } from "@/components/nav-tabs";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  const p = session.profile;
  const name: string = p?.full_name || session.user.email || "";
  const initials = name.split(/[\s@.]+/).filter(Boolean).slice(0, 2).map((s) => s[0]!.toUpperCase()).join("");
  const org = (p?.organization as unknown as { name: string } | null)?.name;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="flex h-14 items-center gap-4 px-4 lg:px-6">
          <Link href="/" className="shrink-0"><Logo /></Link>
          <form action="/search" className="relative mx-auto w-full max-w-xl">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input name="q" placeholder="Search accounts, contacts, leads, opportunities, cases…" className="input rounded-full bg-slate-50 dark:bg-slate-800/50 pl-9" />
          </form>
          <div className="flex shrink-0 items-center gap-3">
            <div className="hidden text-right md:block">
              <p className="text-sm font-medium leading-tight text-slate-800 dark:text-slate-200">{name}</p>
              <p className="text-xs leading-tight text-slate-500 dark:text-slate-400">{org}</p>
            </div>
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white">{initials}</span>
            <ThemeToggle />
            <Link href="/settings" className="rounded-md p-1.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" title="Settings"><Settings size={18} /></Link>
            <form action={signOut}>
              <button className="rounded-md p-1.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" title="Sign out"><LogOut size={18} /></button>
            </form>
          </div>
        </div>
        <NavTabs />
      </header>
      <main className="flex-1 p-4 lg:p-6">{children}</main>
    </div>
  );
}
