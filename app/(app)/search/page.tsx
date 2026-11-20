import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { OBJECTS, isObjectKey } from "@/lib/objects";
import { ObjectIcon } from "@/components/icon";

export const metadata = { title: "Search" };

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const term = q.trim();
  const supabase = await createClient();
  const { data } = term.length >= 2 ? await supabase.rpc("global_search", { q: term }) : { data: [] };
  const rows = (data ?? []) as { object: string; id: string; title: string; subtitle: string }[];
  const groups = Object.entries(
    rows.reduce<Record<string, typeof rows>>((acc, r) => ((acc[r.object] ??= []).push(r), acc), {}),
  );

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-lg font-semibold text-ink dark:text-slate-100">
        {term ? <>Results for &ldquo;{term}&rdquo;</> : "Search"}
      </h1>
      {term.length > 0 && term.length < 2 && <p className="text-sm text-slate-500 dark:text-slate-400">Type at least 2 characters.</p>}
      {term.length >= 2 && rows.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400">No matching records.</p>}
      {groups.map(([obj, items]) => {
        if (!isObjectKey(obj)) return null;
        const def = OBJECTS[obj];
        return (
          <div key={obj} className="card overflow-hidden">
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 px-4 py-2.5">
              <ObjectIcon name={def.icon} color={def.color} size="sm" />
              <h2 className="text-sm font-semibold">{def.plural} ({items.length})</h2>
            </div>
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {items.map((r) => (
                <li key={r.id} className="px-4 py-2.5">
                  <Link href={`/${obj}/${r.id}`} className="link text-sm font-medium">{r.title}</Link>
                  {r.subtitle && <p className="text-xs text-slate-500 dark:text-slate-400">{r.subtitle}</p>}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
