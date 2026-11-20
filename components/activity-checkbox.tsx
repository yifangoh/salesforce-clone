"use client";

import { useOptimistic, useTransition } from "react";
import { toggleActivity } from "@/app/actions";

export function ActivityCheckbox({ id, done, path }: { id: string; done: boolean; path: string }) {
  const [checked, setChecked] = useOptimistic(done);
  const [, start] = useTransition();
  return (
    <input
      type="checkbox"
      checked={checked}
      title={checked ? "Mark as open" : "Mark complete"}
      onChange={(e) => {
        const v = e.target.checked;
        start(async () => { setChecked(v); await toggleActivity(id, v, path); });
      }}
      className="mt-1 h-4 w-4 cursor-pointer rounded border-slate-300 text-emerald-600"
    />
  );
}
