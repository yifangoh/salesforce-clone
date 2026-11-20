import Link from "next/link";
import { List, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ObjectIcon } from "@/components/icon";
import { PipelineBoard } from "./board";

export const metadata = { title: "Pipeline" };

export default async function PipelinePage({ searchParams }: { searchParams: Promise<{ mine?: string }> }) {
  const sp = await searchParams;
  const supabase = await createClient();
  let q = supabase
    .from("opportunities")
    .select("id, name, amount, close_date, stage, probability, account:account_id(id, name), owner:owner_id(full_name, email)")
    .order("close_date");
  if (sp.mine === "1") {
    const { data } = await supabase.auth.getUser();
    if (data.user) q = q.eq("owner_id", data.user.id);
  }
  const { data } = await q;

  return (
    <div className="space-y-4">
      <div className="card flex flex-wrap items-center gap-3 p-4">
        <ObjectIcon name="Target" color="bg-orange-500" size="lg" />
        <div className="mr-auto">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Opportunities</p>
          <h1 className="text-lg font-semibold text-ink dark:text-slate-100">Pipeline</h1>
        </div>
        <p className="hidden text-xs text-slate-500 dark:text-slate-400 md:block">Drag cards between columns to change the stage.</p>
        <Link href={sp.mine === "1" ? "/pipeline" : "/pipeline?mine=1"} className="btn">{sp.mine === "1" ? "All opportunities" : "My opportunities"}</Link>
        <Link href="/opportunities" className="btn"><List size={16} /> List</Link>
        <Link href="/opportunities/new?return_to=/pipeline" className="btn-primary"><Plus size={16} /> New</Link>
      </div>
      <PipelineBoard initial={(data ?? []) as any[]} />
    </div>
  );
}
