import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil, Shuffle } from "lucide-react";
import { OBJECTS, getField, isObjectKey } from "@/lib/objects";
import { getActivities, getRecord, getRelated } from "@/lib/data";
import { ObjectIcon } from "@/components/icon";
import { FieldValue } from "@/components/field-value";
import { DeleteButton } from "@/components/delete-button";
import { StagePath } from "@/components/stage-path";
import { ActivityPanel } from "@/components/activity-panel";
import { RelatedList } from "@/components/related-list";
import { LineItems } from "@/components/line-items";

export async function generateMetadata({ params }: { params: Promise<{ object: string; id: string }> }) {
  const { object, id } = await params;
  if (!isObjectKey(object)) return {};
  const r = await getRecord(OBJECTS[object], id);
  return { title: r ? OBJECTS[object].display(r) : OBJECTS[object].label };
}

export default async function DetailPage({ params }: { params: Promise<{ object: string; id: string }> }) {
  const { object, id } = await params;
  if (!isObjectKey(object)) notFound();
  const def = OBJECTS[object];
  const record = await getRecord(def, id);
  if (!record) notFound();
  const path = `/${object}/${id}`;

  const [related, activities] = await Promise.all([
    Promise.all((def.related ?? []).map((rel) => getRelated(rel.object, rel.fk, id))),
    def.activityFk ? getActivities(def.activityFk, id) : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <ObjectIcon name={def.icon} color={def.color} size="lg" />
          <div className="mr-auto min-w-0">
            <Link href={`/${object}`} className="text-xs font-medium text-slate-500 dark:text-slate-400 hover:underline">{def.label}</Link>
            <h1 className="truncate text-xl font-semibold text-ink dark:text-slate-100">{def.display(record) || "Untitled"}</h1>
          </div>
          {object === "leads" && !record.is_converted && (
            <Link href={`${path}/convert`} className="btn-primary"><Shuffle size={15} /> Convert</Link>
          )}
          <Link href={`${path}/edit`} className="btn"><Pencil size={15} /> Edit</Link>
          <DeleteButton object={object} id={id} />
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-800 pt-4 sm:grid-cols-3 lg:grid-cols-6">
          {def.highlights.map((h) => {
            const f = getField(def, h)!;
            return (
              <div key={h} className="min-w-0">
                <dt className="text-xs text-slate-500 dark:text-slate-400">{f.label}</dt>
                <dd className="truncate text-sm font-medium"><FieldValue field={f} record={record} /></dd>
              </div>
            );
          })}
        </dl>
        {object === "opportunities" && <div className="mt-4"><StagePath id={id} stage={record.stage} /></div>}
      </div>

      {object === "leads" && record.is_converted && (
        <div className="card border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 p-4 text-sm text-emerald-800 dark:text-emerald-300">
          This lead was converted on {new Date(record.converted_at).toLocaleDateString()}.{" "}
          {record.converted_account_id && <Link className="link" href={`/accounts/${record.converted_account_id}`}>View account</Link>}
          {record.converted_contact_id && <> · <Link className="link" href={`/contacts/${record.converted_contact_id}`}>View contact</Link></>}
          {record.converted_opportunity_id && <> · <Link className="link" href={`/opportunities/${record.converted_opportunity_id}`}>View opportunity</Link></>}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          {object === "opportunities" && <LineItems opportunityId={id} />}
          {(def.related ?? []).map((rel, i) => (
            <RelatedList key={rel.object + rel.fk} rel={rel} rows={related[i]} parentId={id} parentPath={path} />
          ))}
          <div className="card">
            <div className="border-b border-slate-200 dark:border-slate-800 px-4 py-3"><h2 className="text-sm font-semibold text-ink dark:text-slate-100">Details</h2></div>
            <div className="space-y-5 p-4">
              {def.sections.map((s) => (
                <section key={s.title}>
                  <h3 className="mb-2 text-xs font-semibold tracking-wide text-slate-500 dark:text-slate-400 uppercase">{s.title}</h3>
                  <dl className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
                    {s.fields.map((f) => (
                      <div key={f.name} className={`border-b border-slate-100 dark:border-slate-800 py-2 ${f.full ? "sm:col-span-2" : ""}`}>
                        <dt className="text-xs text-slate-500 dark:text-slate-400">{f.label}</dt>
                        <dd className="mt-0.5 min-h-5 text-sm"><FieldValue field={f} record={record} /></dd>
                      </div>
                    ))}
                  </dl>
                </section>
              ))}
              <p className="text-xs text-slate-400 dark:text-slate-500">
                {def.hasOwner && <>Owner: {record.owner?.full_name || record.owner?.email || "—"} · </>}
                Created {new Date(record.created_at).toLocaleString()} · Last modified {new Date(record.updated_at).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        {def.activityFk && (
          <div><ActivityPanel fk={def.activityFk} id={id} activities={activities} path={path} /></div>
        )}
      </div>
    </div>
  );
}
