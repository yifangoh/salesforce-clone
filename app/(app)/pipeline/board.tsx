"use client";

import { useOptimistic, useState, useTransition } from "react";
import Link from "next/link";
import { STAGES, formatCurrency, formatDate } from "@/lib/objects";
import { updateStage } from "@/app/actions";

type Opp = { id: string; name: string; amount: number | null; close_date: string; stage: string; probability: number | null; account: { id: string; name: string } | null; owner: { full_name: string | null; email: string } | null };

export function PipelineBoard({ initial }: { initial: Opp[] }) {
  const [opps, move] = useOptimistic(initial, (state, { id, stage }: { id: string; stage: string }) =>
    state.map((o) => (o.id === id ? { ...o, stage } : o)),
  );
  const [, start] = useTransition();
  const [over, setOver] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const drop = (stage: string, id: string) => {
    setOver(null);
    const o = opps.find((x) => x.id === id);
    if (!o || o.stage === stage) return;
    start(async () => {
      move({ id, stage });
      const res = await updateStage(id, stage);
      if (res?.error) setError(res.error);
    });
  };

  return (
    <>
      {error && <p className="mb-2 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      <div className="flex gap-3 overflow-x-auto pb-4">
        {STAGES.map((stage) => {
          const items = opps.filter((o) => o.stage === stage);
          const total = items.reduce((s, o) => s + Number(o.amount ?? 0), 0);
          const tone = stage === "Closed Won" ? "border-t-emerald-500" : stage === "Closed Lost" ? "border-t-rose-500" : "border-t-brand-500";
          return (
            <div
              key={stage}
              onDragOver={(e) => { e.preventDefault(); setOver(stage); }}
              onDragLeave={() => setOver((s) => (s === stage ? null : s))}
              onDrop={(e) => drop(stage, e.dataTransfer.getData("text/plain"))}
              className={`flex w-72 shrink-0 flex-col rounded-xl border border-t-4 border-slate-200 ${tone} ${over === stage ? "bg-brand-50" : "bg-slate-50"}`}
            >
              <div className="px-3 py-2.5">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-ink">{stage}</h2>
                  <span className="rounded-full bg-white px-2 text-xs text-slate-500 ring-1 ring-slate-200">{items.length}</span>
                </div>
                <p className="text-xs font-medium text-slate-500 tabular-nums">{formatCurrency(total)}</p>
              </div>
              <div className="flex min-h-24 flex-1 flex-col gap-2 px-2 pb-2">
                {items.map((o) => (
                  <div
                    key={o.id}
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData("text/plain", o.id)}
                    className="cursor-grab rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition hover:shadow active:cursor-grabbing"
                  >
                    <Link href={`/opportunities/${o.id}`} className="block text-sm font-medium text-brand-600 hover:underline">{o.name}</Link>
                    {o.account && <p className="truncate text-xs text-slate-500">{o.account.name}</p>}
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700 tabular-nums">{formatCurrency(o.amount)}</span>
                      <span className="text-slate-500">{formatDate(o.close_date)}</span>
                    </div>
                    <select
                      aria-label="Stage"
                      value={o.stage}
                      onChange={(e) => drop(e.target.value, o.id)}
                      className="mt-2 w-full rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-xs text-slate-600 md:hidden"
                    >
                      {STAGES.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
