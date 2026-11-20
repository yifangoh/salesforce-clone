import Link from "next/link";
import { Plus } from "lucide-react";
import { OBJECTS, getField, type RelatedList as RL } from "@/lib/objects";
import { ObjectIcon } from "./icon";
import { FieldValue } from "./field-value";

export function RelatedList({ rel, rows, parentId, parentPath }: { rel: RL; rows: any[]; parentId: string; parentPath: string }) {
  const def = OBJECTS[rel.object];
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-2.5">
        <ObjectIcon name={def.icon} color={def.color} size="sm" />
        <h2 className="text-sm font-semibold text-ink">{rel.title ?? def.plural} ({rows.length})</h2>
        <Link href={`/${rel.object}/new?${rel.fk}=${parentId}&return_to=${encodeURIComponent(parentPath)}`} className="btn ml-auto py-1 text-xs">
          <Plus size={14} /> New
        </Link>
      </div>
      {rows.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50">
              <tr>{rel.columns.map((c) => <th key={c} className="th py-2">{getField(def, c)?.label}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r) => (
                <tr key={r.id}>
                  {rel.columns.map((c, i) => (
                    <td key={c} className="td py-2">
                      {i === 0 ? (
                        <Link href={`/${rel.object}/${r.id}`} className="link font-medium">{c === "name" ? def.display(r) : r[c]}</Link>
                      ) : (
                        <FieldValue field={getField(def, c)!} record={r} />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="px-4 py-4 text-sm text-slate-400">None yet.</p>
      )}
    </div>
  );
}
