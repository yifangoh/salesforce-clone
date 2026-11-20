import { Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/objects";
import { addLineItem, deleteLineItem } from "@/app/actions";
import { ObjectIcon } from "./icon";
import { SubmitButton } from "./submit-button";

export async function LineItems({ opportunityId }: { opportunityId: string }) {
  const supabase = await createClient();
  const [{ data: items }, { data: products }] = await Promise.all([
    supabase.from("opportunity_line_items").select("*, product:product_id(id, name, product_code)").eq("opportunity_id", opportunityId).order("created_at"),
    supabase.from("products").select("id, name, unit_price").eq("is_active", true).order("name"),
  ]);
  const total = (items ?? []).reduce((s, i: any) => s + Number(i.total_price), 0);

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-2.5">
        <ObjectIcon name="Package" color="bg-sky-500" size="sm" />
        <h2 className="text-sm font-semibold text-ink">Products ({items?.length ?? 0})</h2>
        <span className="ml-auto text-sm font-semibold tabular-nums text-slate-700">{formatCurrency(total)}</span>
      </div>
      {!!items?.length && (
        <table className="min-w-full divide-y divide-slate-100">
          <thead className="bg-slate-50">
            <tr>
              <th className="th py-2">Product</th><th className="th py-2">Qty</th><th className="th py-2">Unit Price</th>
              <th className="th py-2">Discount</th><th className="th py-2">Total</th><th className="th py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((i: any) => (
              <tr key={i.id}>
                <td className="td py-2 font-medium">{i.product?.name}</td>
                <td className="td py-2 tabular-nums">{Number(i.quantity)}</td>
                <td className="td py-2 tabular-nums">{formatCurrency(i.unit_price)}</td>
                <td className="td py-2 tabular-nums">{Number(i.discount_pct)}%</td>
                <td className="td py-2 font-medium tabular-nums">{formatCurrency(i.total_price)}</td>
                <td className="td py-2 text-right">
                  <form action={deleteLineItem.bind(null, i.id, opportunityId)}>
                    <button className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600" title="Remove"><Trash2 size={14} /></button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {products?.length ? (
        <form action={addLineItem} className="flex flex-wrap items-end gap-2 border-t border-slate-100 bg-slate-50 px-4 py-3">
          <input type="hidden" name="opportunity_id" value={opportunityId} />
          <div className="min-w-48 flex-1">
            <label className="label">Product</label>
            <select name="product_id" className="input" required>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name} — {formatCurrency(p.unit_price)}</option>)}
            </select>
          </div>
          <div className="w-20"><label className="label">Qty</label><input name="quantity" type="number" min="1" step="1" defaultValue="1" className="input" /></div>
          <div className="w-32"><label className="label">Price (optional)</label><input name="unit_price" type="number" step="0.01" placeholder="List" className="input" /></div>
          <div className="w-24"><label className="label">Discount %</label><input name="discount_pct" type="number" min="0" max="100" step="0.5" defaultValue="0" className="input" /></div>
          <SubmitButton pendingText="Adding…">Add product</SubmitButton>
        </form>
      ) : (
        <p className="border-t border-slate-100 px-4 py-3 text-sm text-slate-500">Create products first to add them to this opportunity.</p>
      )}
      <p className="border-t border-slate-100 px-4 py-2 text-xs text-slate-400">Adding products recalculates the opportunity amount automatically.</p>
    </div>
  );
}
