"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { convertLead, type FormState } from "@/app/actions";
import { SubmitButton } from "@/components/submit-button";

export function ConvertForm({ lead, accounts }: { lead: any; accounts: { id: string; label: string }[] }) {
  const [state, action] = useActionState<FormState, FormData>(convertLead, {});
  const [mode, setMode] = useState<"new" | "existing">("new");
  const [createOpp, setCreateOpp] = useState(true);
  const name = [lead.first_name, lead.last_name].filter(Boolean).join(" ");

  return (
    <form action={action} className="card mx-auto max-w-2xl">
      <div className="border-b border-slate-200 px-6 py-4">
        <h1 className="text-lg font-semibold text-ink">Convert Lead: {name}</h1>
        <p className="text-sm text-slate-500">Creates a contact, links or creates an account, and optionally opens an opportunity.</p>
      </div>
      <input type="hidden" name="lead_id" value={lead.id} />
      <input type="hidden" name="account_mode" value={mode} />
      <div className="space-y-5 p-6">
        {state.error && <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{state.error}</p>}

        <section className="rounded-lg border border-slate-200 p-4">
          <h2 className="mb-3 text-sm font-semibold">Account</h2>
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" checked={mode === "new"} onChange={() => setMode("new")} /> Create new account: <b>{lead.company}</b>
          </label>
          <label className="mt-2 flex items-center gap-2 text-sm">
            <input type="radio" checked={mode === "existing"} onChange={() => setMode("existing")} disabled={!accounts.length} /> Choose existing account
          </label>
          {mode === "existing" && (
            <select name="existing_account_id" className="input mt-2" required>
              {accounts.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
            </select>
          )}
        </section>

        <section className="rounded-lg border border-slate-200 p-4">
          <h2 className="mb-1 text-sm font-semibold">Contact</h2>
          <p className="text-sm text-slate-600">A new contact <b>{name}</b> will be created{lead.email ? ` (${lead.email})` : ""}.</p>
        </section>

        <section className="rounded-lg border border-slate-200 p-4">
          <h2 className="mb-3 text-sm font-semibold">Opportunity</h2>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="create_opportunity" checked={createOpp} onChange={(e) => setCreateOpp(e.target.checked)} />
            Create a new opportunity
          </label>
          {createOpp && (
            <input name="opportunity_name" className="input mt-2" defaultValue={`${lead.company} - New Deal`} />
          )}
        </section>
      </div>
      <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-6 py-3">
        <Link href={`/leads/${lead.id}`} className="btn">Cancel</Link>
        <SubmitButton pendingText="Converting…">Convert</SubmitButton>
      </div>
    </form>
  );
}
