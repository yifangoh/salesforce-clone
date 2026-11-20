"use client";

import { useOptimistic, useTransition } from "react";
import { Check } from "lucide-react";
import { STAGES } from "@/lib/objects";
import { updateStage } from "@/app/actions";

export function StagePath({ id, stage }: { id: string; stage: string }) {
  const [current, setCurrent] = useOptimistic(stage);
  const [pending, start] = useTransition();
  const idx = STAGES.indexOf(current as (typeof STAGES)[number]);
  const lost = current === "Closed Lost";

  return (
    <div className={`flex w-full overflow-hidden rounded-full bg-slate-100 text-xs font-medium ${pending ? "opacity-70" : ""}`}>
      {STAGES.map((s, i) => {
        const done = i < idx && !(lost && s === "Closed Won");
        const active = s === current;
        const tone = active
          ? lost ? "bg-rose-600 text-white" : s === "Closed Won" ? "bg-emerald-600 text-white" : "bg-brand-600 text-white"
          : done ? "bg-emerald-100 text-emerald-800" : "text-slate-600 hover:bg-slate-200";
        return (
          <button
            key={s}
            type="button"
            onClick={() => start(async () => { setCurrent(s); await updateStage(id, s); })}
            className={`flex flex-1 items-center justify-center gap-1 px-2 py-2 transition ${tone} ${i ? "border-l border-white" : ""}`}
            title={`Mark as ${s}`}
          >
            {done && <Check size={12} />}
            <span className="truncate">{s}</span>
          </button>
        );
      })}
    </div>
  );
}
