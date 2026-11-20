import { notFound } from "next/navigation";
import { OBJECTS, allFields, isObjectKey } from "@/lib/objects";
import { getRefOptions } from "@/lib/data";
import { RecordForm } from "@/components/record-form";

const DEFAULTS: Record<string, Record<string, unknown>> = {
  leads: { status: "New" },
  opportunities: { stage: "Prospecting", close_date: new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10) },
  cases: { status: "New", priority: "Medium" },
  activities: { type: "Task", status: "Open", priority: "Normal" },
  products: { is_active: true },
};

export default async function NewPage({ params, searchParams }: { params: Promise<{ object: string }>; searchParams: Promise<Record<string, string>> }) {
  const { object } = await params;
  if (!isObjectKey(object)) notFound();
  const def = OBJECTS[object];
  const sp = await searchParams;
  // Prefill from query string, e.g. /contacts/new?account_id=… from a related list
  const names = new Set(allFields(def).map((f) => f.name));
  const prefill = Object.fromEntries(Object.entries(sp).filter(([k]) => names.has(k)));
  const refOptions = await getRefOptions(def);
  return (
    <RecordForm
      object={object}
      record={{ ...DEFAULTS[object], ...prefill }}
      refOptions={refOptions}
      returnTo={sp.return_to?.startsWith("/") ? sp.return_to : undefined}
    />
  );
}
