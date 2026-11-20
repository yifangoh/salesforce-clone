import { getSession } from "@/lib/supabase/server";
import { updateProfile } from "@/app/actions";
import { SubmitButton } from "@/components/submit-button";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const { supabase, profile, user } = (await getSession())!;
  const org = profile?.organization as unknown as { id: string; name: string } | null;
  const { data: members } = await supabase.from("profiles").select("id, full_name, email, title, role").order("created_at");
  const isAdmin = profile?.role === "admin";

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <form action={updateProfile} className="card">
        <div className="border-b border-slate-200 px-6 py-4"><h1 className="text-lg font-semibold text-ink">Settings</h1></div>
        <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2">
          <div><label className="label">Full name</label><input name="full_name" className="input" defaultValue={profile?.full_name ?? ""} /></div>
          <div><label className="label">Title</label><input name="title" className="input" defaultValue={profile?.title ?? ""} /></div>
          <div><label className="label">Email</label><input className="input bg-slate-50" value={user.email ?? ""} disabled /></div>
          <div><label className="label">Role</label><input className="input bg-slate-50 capitalize" value={profile?.role ?? ""} disabled /></div>
          <div className="md:col-span-2">
            <label className="label">Organization name</label>
            <input type="hidden" name="org_id" value={org?.id ?? ""} />
            <input name="org_name" className="input disabled:bg-slate-50" defaultValue={org?.name ?? ""} disabled={!isAdmin} />
            {!isAdmin && <p className="mt-1 text-xs text-slate-500">Only admins can rename the organization.</p>}
          </div>
        </div>
        <div className="flex justify-end border-t border-slate-200 bg-slate-50 px-6 py-3"><SubmitButton>Save changes</SubmitButton></div>
      </form>

      <div className="card overflow-hidden">
        <div className="border-b border-slate-200 px-6 py-4"><h2 className="text-sm font-semibold text-ink">Team members</h2></div>
        <table className="min-w-full divide-y divide-slate-100">
          <thead className="bg-slate-50"><tr><th className="th">Name</th><th className="th">Email</th><th className="th">Title</th><th className="th">Role</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {(members ?? []).map((m) => (
              <tr key={m.id}>
                <td className="td font-medium">{m.full_name || "—"}</td><td className="td">{m.email}</td>
                <td className="td">{m.title || "—"}</td><td className="td capitalize">{m.role}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
