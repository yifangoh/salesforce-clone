import Link from "next/link";
import { Database } from "lucide-react";
import { getSession } from "@/lib/supabase/server";
import { OPEN_STAGES, formatCurrency, formatDate } from "@/lib/objects";
import { seedSampleData } from "@/app/actions";
import { Badge } from "@/components/badge";
import { SubmitButton } from "@/components/submit-button";
import { ActivityCheckbox } from "@/components/activity-checkbox";

export const metadata = { title: "Home" };

export default async function Home() {
  const session = (await getSession())!;
  const { supabase, user, profile } = session;
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const in30 = new Date(today.getTime() + 30 * 864e5).toISOString().slice(0, 10);
  const qStart = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1).toISOString().slice(0, 10);

  const [opps, leads, cases, tasks, accountCount] = await Promise.all([
    supabase.from("opportunities").select("id, name, amount, stage, close_date, probability, is_closed, is_won, account:account_id(name)"),
    supabase.from("leads").select("id, status, rating, created_at").eq("is_converted", false),
    supabase.from("cases").select("id, case_number, subject, status, priority, created_at, account:account_id(name)").neq("status", "Closed").order("created_at", { ascending: false }),
    supabase.from("activities").select("id, subject, type, due_date, priority, status").eq("owner_id", user.id).neq("status", "Completed").order("due_date", { ascending: true, nullsFirst: false }).limit(8),
    supabase.from("accounts").select("id", { count: "exact", head: true }),
  ]);

  const allOpps = (opps.data ?? []) as any[];
  const open = allOpps.filter((o) => !o.is_closed);
  const pipeline = open.reduce((s, o) => s + Number(o.amount ?? 0), 0);
  const weighted = open.reduce((s, o) => s + Number(o.amount ?? 0) * (o.probability ?? 0) / 100, 0);
  const wonQ = allOpps.filter((o) => o.is_won && o.close_date >= qStart).reduce((s, o) => s + Number(o.amount ?? 0), 0);
  const closed = allOpps.filter((o) => o.is_closed);
  const winRate = closed.length ? Math.round((closed.filter((o) => o.is_won).length / closed.length) * 100) : null;
  const byStage = OPEN_STAGES.map((s) => ({ stage: s, total: open.filter((o) => o.stage === s).reduce((a, o) => a + Number(o.amount ?? 0), 0), n: open.filter((o) => o.stage === s).length }));
  const maxStage = Math.max(1, ...byStage.map((s) => s.total));
  const closingSoon = open.filter((o) => o.close_date <= in30).sort((a, b) => a.close_date.localeCompare(b.close_date)).slice(0, 6);
  const leadList = (leads.data ?? []) as any[];
  const leadByStatus = ["New", "Working", "Nurturing", "Qualified", "Unqualified"].map((s) => ({ s, n: leadList.filter((l) => l.status === s).length }));
  const openCases = (cases.data ?? []) as any[];
  const firstName = (profile?.full_name || user.email || "").split(/[\s@]/)[0];
  const empty = (accountCount.count ?? 0) === 0 && allOpps.length === 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Good {greeting()}, {firstName}</h1>
          <p className="text-sm text-slate-500">{today.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
        </div>
      </div>

      {empty && (
        <div className="card flex flex-wrap items-center gap-4 border-brand-100 bg-brand-50 p-5">
          <Database className="text-brand-600" />
          <div className="mr-auto">
            <p className="font-medium text-ink">Your workspace is empty</p>
            <p className="text-sm text-slate-600">Load sample accounts, contacts, leads, opportunities, cases and products to explore the app.</p>
          </div>
          <form action={seedSampleData}><SubmitButton pendingText="Loading…">Load sample data</SubmitButton></form>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Kpi label="Open pipeline" value={formatCurrency(pipeline, true)} sub={`${open.length} opportunities`} href="/pipeline" />
        <Kpi label="Weighted pipeline" value={formatCurrency(weighted, true)} sub="by stage probability" href="/opportunities" />
        <Kpi label="Won this quarter" value={formatCurrency(wonQ, true)} sub={winRate === null ? "no closed deals yet" : `${winRate}% win rate`} href="/opportunities?filter=Closed+Won" />
        <Kpi label="Open leads" value={String(leadList.length)} sub={`${leadList.filter((l) => l.rating === "Hot").length} hot`} href="/leads" />
        <Kpi label="Open cases" value={String(openCases.length)} sub={`${openCases.filter((c) => c.priority === "High" || c.priority === "Critical").length} high priority`} href="/cases" />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="card p-4 xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink">Pipeline by stage</h2>
            <Link href="/pipeline" className="link text-xs">View pipeline</Link>
          </div>
          <div className="space-y-3">
            {byStage.map((s) => (
              <div key={s.stage} className="grid grid-cols-[8rem_1fr_6rem] items-center gap-3 text-sm">
                <span className="truncate text-slate-600">{s.stage}</span>
                <div className="h-6 rounded bg-slate-100">
                  <div className="flex h-6 items-center rounded bg-brand-500 px-2 text-xs font-medium text-white" style={{ width: `${Math.max(s.total ? 4 : 0, (s.total / maxStage) * 100)}%` }}>
                    {s.n > 0 && s.total / maxStage > 0.15 ? s.n : ""}
                  </div>
                </div>
                <span className="text-right font-medium tabular-nums text-slate-700">{formatCurrency(s.total, true)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink">My open tasks</h2>
            <Link href="/activities/new" className="link text-xs">New task</Link>
          </div>
          <ul className="space-y-2">
            {(tasks.data ?? []).map((t: any) => (
              <li key={t.id} className="flex items-start gap-2">
                <ActivityCheckbox id={t.id} done={false} path="/" />
                <div className="min-w-0">
                  <Link href={`/activities/${t.id}`} className="block truncate text-sm text-brand-600 hover:underline">{t.subject}</Link>
                  <p className={`text-xs ${t.due_date && t.due_date < todayStr ? "font-medium text-rose-600" : "text-slate-500"}`}>
                    {t.type}{t.due_date ? ` · ${formatDate(t.due_date)}` : ""}
                  </p>
                </div>
              </li>
            ))}
            {!tasks.data?.length && <li className="text-sm text-slate-400">Nothing due. Nice work.</li>}
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="card overflow-hidden xl:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <h2 className="text-sm font-semibold text-ink">Closing in the next 30 days</h2>
            <Link href="/opportunities" className="link text-xs">All opportunities</Link>
          </div>
          <table className="min-w-full divide-y divide-slate-100">
            <tbody className="divide-y divide-slate-100">
              {closingSoon.map((o) => (
                <tr key={o.id}>
                  <td className="td"><Link className="link font-medium" href={`/opportunities/${o.id}`}>{o.name}</Link><p className="text-xs text-slate-500">{o.account?.name}</p></td>
                  <td className="td"><Badge value={o.stage} /></td>
                  <td className={`td ${o.close_date < todayStr ? "text-rose-600" : ""}`}>{formatDate(o.close_date)}</td>
                  <td className="td text-right font-medium tabular-nums">{formatCurrency(o.amount)}</td>
                </tr>
              ))}
              {closingSoon.length === 0 && <tr><td className="td text-slate-400">No deals closing soon.</td></tr>}
            </tbody>
          </table>
        </div>

        <div className="space-y-4">
          <div className="card p-4">
            <h2 className="mb-3 text-sm font-semibold text-ink">Leads by status</h2>
            <div className="space-y-2">
              {leadByStatus.map(({ s, n }) => (
                <Link key={s} href={`/leads?filter=${s}`} className="flex items-center justify-between rounded-md px-2 py-1 text-sm hover:bg-slate-50">
                  <Badge value={s} /><span className="font-medium tabular-nums">{n}</span>
                </Link>
              ))}
            </div>
          </div>
          <div className="card p-4">
            <h2 className="mb-3 text-sm font-semibold text-ink">Recent open cases</h2>
            <ul className="space-y-2">
              {openCases.slice(0, 5).map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-2">
                  <Link href={`/cases/${c.id}`} className="truncate text-sm text-brand-600 hover:underline">{c.case_number} · {c.subject}</Link>
                  <Badge value={c.priority} />
                </li>
              ))}
              {!openCases.length && <li className="text-sm text-slate-400">No open cases.</li>}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value, sub, href }: { label: string; value: string; sub: string; href: string }) {
  return (
    <Link href={href} className="card block p-4 transition hover:border-brand-200 hover:shadow">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-ink tabular-nums">{value}</p>
      <p className="text-xs text-slate-500">{sub}</p>
    </Link>
  );
}

function greeting() {
  const h = Number(new Date().toLocaleString("en-US", { hour: "numeric", hour12: false, timeZone: "Asia/Singapore" }));
  return h < 12 ? "morning" : h < 18 ? "afternoon" : "evening";
}
