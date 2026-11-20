import { notFound, redirect } from "next/navigation";
import { OBJECTS } from "@/lib/objects";
import { getRecord } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { ConvertForm } from "./convert-form";

export const metadata = { title: "Convert Lead" };

export default async function ConvertPage({ params }: { params: Promise<{ object: string; id: string }> }) {
  const { object, id } = await params;
  if (object !== "leads") notFound();
  const lead = await getRecord(OBJECTS.leads, id);
  if (!lead) notFound();
  if (lead.is_converted) redirect(`/leads/${id}`);
  const supabase = await createClient();
  const { data } = await supabase.from("accounts").select("id, name").order("name").limit(1000);
  return <ConvertForm lead={lead} accounts={(data ?? []).map((a) => ({ id: a.id, label: a.name }))} />;
}
