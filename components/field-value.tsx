import Link from "next/link";
import { OBJECTS, formatCurrency, formatDate, type Field } from "@/lib/objects";
import { Badge } from "./badge";

export function FieldValue({ field, record }: { field: Field; record: Record<string, any> }) {
  if (field.name === "owner") {
    const o = record.owner;
    return o ? <span>{o.full_name || o.email}</span> : <Empty />;
  }
  if (field.name === "related") {
    for (const k of ["opportunity_id", "case_id", "account_id", "contact_id", "lead_id"] as const) {
      const ref = record[`r_${k}`];
      if (ref) {
        const obj = OBJECTS[k === "opportunity_id" ? "opportunities" : k === "case_id" ? "cases" : k === "account_id" ? "accounts" : k === "contact_id" ? "contacts" : "leads"];
        return <Link className="link" href={`/${obj.key}/${ref.id}`}>{obj.display(ref)}</Link>;
      }
    }
    return <Empty />;
  }
  const v = field.name === "name" && record.name === undefined
    ? [record.first_name, record.last_name].filter(Boolean).join(" ")
    : record[field.name];
  if (v === null || v === undefined || v === "") return <Empty />;

  switch (field.type) {
    case "reference": {
      const ref = record[`r_${field.name}`];
      if (!ref || !field.ref) return <Empty />;
      return <Link className="link" href={`/${field.ref}/${ref.id}`}>{OBJECTS[field.ref].display(ref)}</Link>;
    }
    case "currency": return <span className="tabular-nums">{formatCurrency(v)}</span>;
    case "percent": return <span className="tabular-nums">{v}%</span>;
    case "number": return <span className="tabular-nums">{Number(v).toLocaleString()}</span>;
    case "date": return <span>{formatDate(v)}</span>;
    case "boolean": return <span>{v ? "Yes" : "No"}</span>;
    case "email": return <a className="link" href={`mailto:${v}`}>{v}</a>;
    case "phone": return <a className="link" href={`tel:${v}`}>{v}</a>;
    case "url": {
      const href = /^https?:\/\//.test(v) ? v : `https://${v}`;
      return <a className="link" href={href} target="_blank" rel="noreferrer">{v}</a>;
    }
    case "select": return <Badge value={v} />;
    case "textarea": return <p className="whitespace-pre-wrap">{v}</p>;
    default: return <span>{v}</span>;
  }
}

function Empty() {
  return <span className="text-slate-300 dark:text-slate-600">—</span>;
}
