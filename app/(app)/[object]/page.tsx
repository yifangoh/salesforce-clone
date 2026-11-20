import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowDown, ArrowUp, Columns3, Plus, Search } from "lucide-react";
import { OBJECTS, getField, isObjectKey } from "@/lib/objects";
import { listRecords } from "@/lib/data";
import { ObjectIcon } from "@/components/icon";
import { FieldValue } from "@/components/field-value";

type SP = { q?: string; filter?: string; sort?: string; dir?: string; mine?: string };

export async function generateMetadata({ params }: { params: Promise<{ object: string }> }) {
  const { object } = await params;
  return { title: isObjectKey(object) ? OBJECTS[object].plural : "Not found" };
}

export default async function ListPage({ params, searchParams }: { params: Promise<{ object: string }>; searchParams: Promise<SP> }) {
  const { object } = await params;
  if (!isObjectKey(object)) notFound();
  const def = OBJECTS[object];
  const sp = await searchParams;
  const { rows, count } = await listRecords(def, { ...sp, mine: sp.mine === "1" });

  const filterOptions = def.filterField ? getField(def, def.filterField)?.options ?? [] : [];
  const extraFilters = object === "leads" ? [...filterOptions, "Converted"] : filterOptions;

  const qs = (patch: Partial<SP>) => {
    const next = new URLSearchParams();
    const merged = { ...sp, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v) next.set(k, v);
    const s = next.toString();
    return s ? `?${s}` : "";
  };

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 dark:border-slate-800 p-4">
        <ObjectIcon name={def.icon} color={def.color} size="lg" />
        <div className="mr-auto">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{def.plural}</p>
          <h1 className="text-lg font-semibold text-ink dark:text-slate-100">
            {sp.mine === "1" ? `My ${def.plural}` : `All ${def.plural}`} <span className="text-sm font-normal text-slate-400 dark:text-slate-500">· {count} item{count === 1 ? "" : "s"}</span>
          </h1>
        </div>
        <form className="relative">
          {sp.filter && <input type="hidden" name="filter" value={sp.filter} />}
          {sp.mine && <input type="hidden" name="mine" value={sp.mine} />}
          <Search className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input name="q" defaultValue={sp.q} placeholder={`Search this list…`} className="input w-56 pl-8" />
        </form>
        {def.hasOwner && (
          <Link href={qs({ mine: sp.mine === "1" ? undefined : "1" })} className="btn">
            {sp.mine === "1" ? "All records" : "My records"}
          </Link>
        )}
        {object === "opportunities" && (
          <Link href="/pipeline" className="btn"><Columns3 size={16} /> Pipeline</Link>
        )}
        <Link href={`/${object}/new`} className="btn-primary"><Plus size={16} /> New</Link>
      </div>

      {extraFilters.length > 0 && (
        <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 px-4 py-2">
          <FilterPill href={qs({ filter: undefined })} active={!sp.filter} label="All" />
          {extraFilters.map((o) => (
            <FilterPill key={o} href={qs({ filter: o })} active={sp.filter === o} label={o} />
          ))}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
          <thead className="bg-slate-50 dark:bg-slate-800/50">
            <tr>
              {def.listColumns.map((c) => {
                const f = getField(def, c)!;
                const sortable = c !== "owner" && c !== "related" && f.type !== "reference";
                const activeSort = (sp.sort ?? def.defaultSort.column) === c || (c === "name" && sp.sort === "name");
                const asc = sp.dir ? sp.dir === "asc" : def.defaultSort.ascending;
                return (
                  <th key={c} className="th">
                    {sortable ? (
                      <Link href={qs({ sort: c, dir: activeSort && asc ? "desc" : "asc" })} className="inline-flex items-center gap-1 hover:text-slate-800 dark:hover:text-slate-200">
                        {f.label}
                        {activeSort && sp.sort && (asc ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
                      </Link>
                    ) : f.label}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                {def.listColumns.map((c, i) => {
                  const f = getField(def, c)!;
                  return (
                    <td key={c} className="td">
                      {i === 0 ? (
                        <Link href={`/${object}/${r.id}`} className="font-medium text-brand-600 dark:text-brand-400 hover:underline">
                          {(c === "name" ? def.display(r) : r[c]) || "Untitled"}
                        </Link>
                      ) : (
                        <FieldValue field={f} record={r} />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={def.listColumns.length} className="px-4 py-16 text-center text-sm text-slate-500 dark:text-slate-400">
                  No {def.plural.toLowerCase()} found.{" "}
                  <Link className="link" href={`/${object}/new`}>Create one</Link>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FilterPill({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      className={`rounded-full px-3 py-1 text-xs font-medium transition ${
        active ? "bg-brand-600 text-white" : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 ring-1 ring-slate-200 dark:ring-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
      }`}
    >
      {label}
    </Link>
  );
}
