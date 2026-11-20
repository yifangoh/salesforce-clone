import "server-only";
import { createClient } from "@/lib/supabase/server";
import { OBJECTS, allFields, selectFor, type ObjectDef, type ObjectKey } from "@/lib/objects";

export interface ListParams {
  q?: string;
  filter?: string;
  sort?: string;
  dir?: string;
  mine?: boolean;
  limit?: number;
}

export async function listRecords(def: ObjectDef, p: ListParams = {}) {
  const supabase = await createClient();
  const sortable = new Set([...allFields(def).map((f) => f.name), "created_at", "updated_at", "last_name"]);
  const sortCol = p.sort === "name" && (def.key === "contacts" || def.key === "leads") ? "last_name" : p.sort;
  const column = sortCol && sortable.has(sortCol) ? sortCol : def.defaultSort.column;
  const ascending = p.dir ? p.dir === "asc" : def.defaultSort.ascending;

  let query = supabase.from(def.key).select(selectFor(def), { count: "exact" });
  if (p.q) {
    const safe = p.q.replace(/[%,()*]/g, " ").trim();
    if (safe) query = query.or(def.searchColumns.map((c) => `${c}.ilike.%${safe}%`).join(","));
  }
  if (def.filterField && p.filter) query = query.eq(def.filterField, p.filter);
  if (def.key === "leads" && p.filter !== "Converted") query = query.eq("is_converted", false);
  if (p.mine) {
    const { data } = await supabase.auth.getUser();
    if (data.user) query = query.eq("owner_id", data.user.id);
  }
  const { data, count, error } = await query
    .order(column, { ascending, nullsFirst: false })
    .limit(p.limit ?? 200);
  if (error) throw new Error(error.message);
  return { rows: (data ?? []) as any[], count: count ?? 0 };
}

export async function getRecord(def: ObjectDef, id: string) {
  const supabase = await createClient();
  const { data } = await supabase.from(def.key).select(selectFor(def)).eq("id", id).maybeSingle();
  return data as any;
}

export async function getRelated(object: ObjectKey, fk: string, id: string) {
  const supabase = await createClient();
  const def = OBJECTS[object];
  const { data } = await supabase
    .from(object)
    .select(selectFor(def))
    .eq(fk, id)
    .order(def.defaultSort.column, { ascending: def.defaultSort.ascending })
    .limit(50);
  return (data ?? []) as any[];
}

export async function getActivities(fk: string, id: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("activities")
    .select("*, owner:owner_id(id, full_name, email)")
    .eq(fk, id)
    .order("due_date", { ascending: true, nullsFirst: false });
  return (data ?? []) as any[];
}

/** Picklist options for every reference field on an object form. */
export async function getRefOptions(def: ObjectDef) {
  const supabase = await createClient();
  const refs = Array.from(new Set(allFields(def).filter((f) => f.type === "reference").map((f) => f.ref!)));
  const out: Record<string, { id: string; label: string }[]> = {};
  await Promise.all(
    refs.map(async (ref) => {
      const rdef = OBJECTS[ref];
      let q = supabase.from(ref).select(rdef.refColumns).limit(1000);
      if (ref === "leads") q = q.eq("is_converted", false);
      const { data } = await q;
      out[ref] = ((data ?? []) as any[])
        .map((r) => ({ id: r.id, label: rdef.display(r) }))
        .sort((a, b) => a.label.localeCompare(b.label));
    }),
  );
  return out;
}
