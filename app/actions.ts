"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OBJECTS, STAGES, allFields, isObjectKey, type ObjectKey } from "@/lib/objects";

export interface FormState {
  error?: string;
}

function parseRecord(object: ObjectKey, form: FormData) {
  const def = OBJECTS[object];
  const out: Record<string, unknown> = {};
  for (const f of allFields(def)) {
    if (f.readOnly) continue;
    if (f.type === "boolean") {
      out[f.name] = form.get(f.name) === "on";
      continue;
    }
    if (!form.has(f.name)) continue;
    const raw = String(form.get(f.name) ?? "").trim();
    if (raw === "") {
      out[f.name] = null;
    } else if (["number", "currency", "percent"].includes(f.type)) {
      const n = Number(raw.replace(/,/g, ""));
      if (Number.isNaN(n)) throw new Error(`${f.label} must be a number`);
      out[f.name] = f.type === "number" || f.type === "percent" ? Math.round(n) : n;
    } else {
      out[f.name] = raw;
    }
    if (f.required && out[f.name] === null) throw new Error(`${f.label} is required`);
  }
  if (object === "opportunities" && form.get("_stage_changed") === "1") out.probability = null;
  return out;
}

export async function saveRecord(object: string, id: string | null, _prev: FormState, form: FormData): Promise<FormState> {
  if (!isObjectKey(object)) return { error: "Unknown object" };
  const supabase = await createClient();
  let values: Record<string, unknown>;
  try {
    values = parseRecord(object, form);
  } catch (e) {
    return { error: (e as Error).message };
  }

  let recordId = id;
  if (id) {
    const { error } = await supabase.from(object).update(values).eq("id", id);
    if (error) return { error: error.message };
  } else {
    const { data, error } = await supabase.from(object).insert(values).select("id").single();
    if (error) return { error: error.message };
    recordId = data.id;
  }
  revalidatePath(`/${object}`);
  const back = String(form.get("_return") || "");
  redirect(back.startsWith("/") ? back : `/${object}/${recordId}`);
}

export async function deleteRecord(object: string, id: string) {
  if (!isObjectKey(object)) return;
  const supabase = await createClient();
  const { error } = await supabase.from(object).delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/${object}`);
  redirect(`/${object}`);
}

export async function updateStage(id: string, stage: string) {
  if (!(STAGES as readonly string[]).includes(stage)) return { error: "Invalid stage" };
  const supabase = await createClient();
  const { error } = await supabase.from("opportunities").update({ stage, probability: null }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/opportunities");
  revalidatePath("/pipeline");
  revalidatePath(`/opportunities/${id}`);
  revalidatePath("/");
  return {};
}

const ACTIVITY_FKS = ["account_id", "contact_id", "lead_id", "opportunity_id", "case_id"];

export async function logActivity(form: FormData) {
  const supabase = await createClient();
  const subject = String(form.get("subject") || "").trim();
  if (!subject) return;
  const values: Record<string, unknown> = {
    subject,
    type: String(form.get("type") || "Task"),
    due_date: String(form.get("due_date") || "") || null,
    description: String(form.get("description") || "") || null,
    status: form.get("completed") === "on" ? "Completed" : "Open",
  };
  for (const fk of ACTIVITY_FKS) {
    const v = String(form.get(fk) || "");
    if (v) values[fk] = v;
  }
  // Inherit the parent account for contacts / opportunities / cases
  for (const [fk, table] of [["contact_id", "contacts"], ["opportunity_id", "opportunities"], ["case_id", "cases"]] as const) {
    if (values[fk] && !values.account_id) {
      const { data } = await supabase.from(table).select("account_id").eq("id", values[fk] as string).maybeSingle();
      if (data?.account_id) values.account_id = data.account_id;
    }
  }
  const { error } = await supabase.from("activities").insert(values);
  if (error) throw new Error(error.message);
  revalidatePath(String(form.get("_path") || "/"));
}

export async function toggleActivity(id: string, done: boolean, path: string) {
  const supabase = await createClient();
  await supabase.from("activities").update({ status: done ? "Completed" : "Open" }).eq("id", id);
  revalidatePath(path);
}

export async function convertLead(_prev: FormState, form: FormData): Promise<FormState> {
  const supabase = await createClient();
  const leadId = String(form.get("lead_id"));
  const accountMode = String(form.get("account_mode"));
  const { data, error } = await supabase.rpc("convert_lead", {
    p_lead_id: leadId,
    p_create_opportunity: form.get("create_opportunity") === "on",
    p_opportunity_name: String(form.get("opportunity_name") || ""),
    p_existing_account_id: accountMode === "existing" ? String(form.get("existing_account_id") || "") || null : null,
  });
  if (error) return { error: error.message };
  revalidatePath("/leads");
  const res = data as { opportunity_id?: string; contact_id: string };
  redirect(res.opportunity_id ? `/opportunities/${res.opportunity_id}` : `/contacts/${res.contact_id}`);
}

export async function seedSampleData() {
  const supabase = await createClient();
  const { error } = await supabase.rpc("seed_sample_data");
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}

export async function addLineItem(form: FormData) {
  const supabase = await createClient();
  const opportunity_id = String(form.get("opportunity_id"));
  const product_id = String(form.get("product_id"));
  const { data: product } = await supabase.from("products").select("unit_price").eq("id", product_id).single();
  if (!product) return;
  const quantity = Number(form.get("quantity") || 1);
  const discount_pct = Number(form.get("discount_pct") || 0);
  const priceRaw = String(form.get("unit_price") || "");
  const unit_price = priceRaw ? Number(priceRaw) : product.unit_price;
  const { error } = await supabase.from("opportunity_line_items").insert({ opportunity_id, product_id, quantity, discount_pct, unit_price });
  if (error) throw new Error(error.message);
  revalidatePath(`/opportunities/${opportunity_id}`);
}

export async function deleteLineItem(id: string, opportunityId: string) {
  const supabase = await createClient();
  await supabase.from("opportunity_line_items").delete().eq("id", id);
  revalidatePath(`/opportunities/${opportunityId}`);
}

export async function updateProfile(form: FormData) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return;
  await supabase
    .from("profiles")
    .update({ full_name: String(form.get("full_name") || "") || null, title: String(form.get("title") || "") || null })
    .eq("id", data.user.id);
  const orgName = String(form.get("org_name") || "").trim();
  const orgId = String(form.get("org_id") || "");
  if (orgName && orgId) await supabase.from("organizations").update({ name: orgName }).eq("id", orgId);
  revalidatePath("/", "layout");
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
export async function signIn(_prev: FormState, form: FormData): Promise<FormState> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(form.get("email")),
    password: String(form.get("password")),
  });
  if (error) return { error: error.message };
  const next = String(form.get("next") || "/");
  redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/");
}

export async function signUp(_prev: FormState & { sent?: boolean }, form: FormData): Promise<FormState & { sent?: boolean }> {
  const supabase = await createClient();
  const origin = String(form.get("origin") || "");
  const { data, error } = await supabase.auth.signUp({
    email: String(form.get("email")),
    password: String(form.get("password")),
    options: {
      data: { full_name: String(form.get("full_name") || ""), company: String(form.get("company") || "") },
      emailRedirectTo: origin ? `${origin}/auth/callback` : undefined,
    },
  });
  if (error) return { error: error.message };
  if (data.session) redirect("/");
  return { sent: true };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
