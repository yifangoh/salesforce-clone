"use client";

import { useActionState } from "react";
import Link from "next/link";
import { saveRecord, type FormState } from "@/app/actions";
import { OBJECTS, type Field, type ObjectKey } from "@/lib/objects";
import { SubmitButton } from "./submit-button";

type RefOptions = Record<string, { id: string; label: string }[]>;

export function RecordForm({
  object, id, record, refOptions, returnTo,
}: { object: ObjectKey; id?: string; record: Record<string, any>; refOptions: RefOptions; returnTo?: string }) {
  const def = OBJECTS[object];
  const [state, action] = useActionState<FormState, FormData>(saveRecord.bind(null, object, id ?? null), {});
  const cancel = returnTo || (id ? `/${object}/${id}` : `/${object}`);

  return (
    <form action={action} className="card mx-auto max-w-4xl">
      <div className="border-b border-slate-200 px-6 py-4">
        <h1 className="text-lg font-semibold text-ink">{id ? `Edit ${def.display(record) || def.label}` : `New ${def.label}`}</h1>
      </div>
      {returnTo && <input type="hidden" name="_return" value={returnTo} />}
      <div className="space-y-6 p-6">
        {state.error && <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{state.error}</p>}
        {def.sections.map((s) => {
          const fields = s.fields.filter((f) => !(f.readOnly && !id));
          if (!fields.length) return null;
          return (
            <section key={s.title}>
              <h2 className="mb-3 rounded-md bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700">{s.title}</h2>
              <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
                {fields.map((f) => (
                  <div key={f.name} className={f.full ? "md:col-span-2" : ""}>
                    <label className="label" htmlFor={f.name}>
                      {f.required && <span className="text-rose-600">* </span>}
                      {f.label}
                    </label>
                    <Input field={f} value={record[f.name]} refOptions={refOptions} />
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
      <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-6 py-3">
        <Link href={cancel} className="btn">Cancel</Link>
        <SubmitButton>Save</SubmitButton>
      </div>
    </form>
  );
}

function Input({ field: f, value, refOptions }: { field: Field; value: any; refOptions: RefOptions }) {
  const common = { id: f.name, name: f.name, required: f.required, className: "input" };
  if (f.readOnly) return <input {...common} name={undefined} defaultValue={value ?? ""} disabled className="input bg-slate-50" />;
  switch (f.type) {
    case "textarea":
      return <textarea {...common} rows={4} defaultValue={value ?? ""} />;
    case "select":
      return (
        <select {...common} defaultValue={value ?? ""}>
          <option value="">{f.required ? "Select…" : "--None--"}</option>
          {f.options?.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      );
    case "reference":
      return (
        <select {...common} defaultValue={value ?? ""}>
          <option value="">--None--</option>
          {(refOptions[f.ref!] ?? []).map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
        </select>
      );
    case "boolean":
      return (
        <div className="pt-1">
          <input id={f.name} name={f.name} type="checkbox" defaultChecked={value ?? true} className="h-4 w-4 rounded border-slate-300 text-brand-600" />
        </div>
      );
    case "date":
      return <input {...common} type="date" defaultValue={value ? String(value).slice(0, 10) : ""} />;
    case "number":
    case "percent":
      return <input {...common} type="number" step="1" min={f.type === "percent" ? 0 : undefined} max={f.type === "percent" ? 100 : undefined} defaultValue={value ?? ""} />;
    case "currency":
      return <input {...common} type="number" step="0.01" defaultValue={value ?? ""} />;
    case "email":
      return <input {...common} type="email" defaultValue={value ?? ""} />;
    case "phone":
      return <input {...common} type="tel" defaultValue={value ?? ""} />;
    default:
      return <input {...common} type="text" defaultValue={value ?? ""} />;
  }
}
