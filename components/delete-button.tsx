"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteRecord } from "@/app/actions";

export function DeleteButton({ object, id }: { object: string; id: string }) {
  const [armed, setArmed] = useState(false);
  const [pending, start] = useTransition();
  if (!armed) {
    return <button className="btn-danger" onClick={() => setArmed(true)}><Trash2 size={15} /> Delete</button>;
  }
  return (
    <span className="inline-flex items-center gap-2">
      <span className="text-sm text-slate-600 dark:text-slate-400">Delete this record?</span>
      <button className="btn" onClick={() => setArmed(false)} disabled={pending}>Cancel</button>
      <button className="btn-danger" disabled={pending} onClick={() => start(() => deleteRecord(object, id))}>
        {pending ? "Deleting…" : "Confirm"}
      </button>
    </span>
  );
}
