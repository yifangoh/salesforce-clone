const TONES: Record<string, string> = {
  // positive
  "Closed Won": "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  Customer: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  Qualified: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  Completed: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  Closed: "bg-slate-100 text-slate-600 ring-slate-500/20",
  // negative
  "Closed Lost": "bg-rose-50 text-rose-700 ring-rose-600/20",
  Unqualified: "bg-rose-50 text-rose-700 ring-rose-600/20",
  Critical: "bg-rose-50 text-rose-700 ring-rose-600/20",
  Escalated: "bg-rose-50 text-rose-700 ring-rose-600/20",
  Hot: "bg-rose-50 text-rose-700 ring-rose-600/20",
  High: "bg-orange-50 text-orange-700 ring-orange-600/20",
  Warm: "bg-amber-50 text-amber-700 ring-amber-600/20",
  Cold: "bg-sky-50 text-sky-700 ring-sky-600/20",
  Negotiation: "bg-violet-50 text-violet-700 ring-violet-600/20",
  Proposal: "bg-indigo-50 text-indigo-700 ring-indigo-600/20",
  New: "bg-blue-50 text-blue-700 ring-blue-600/20",
  Working: "bg-blue-50 text-blue-700 ring-blue-600/20",
  "In Progress": "bg-blue-50 text-blue-700 ring-blue-600/20",
};

export function Badge({ value }: { value: string }) {
  const tone = TONES[value] ?? "bg-slate-50 text-slate-700 ring-slate-500/20";
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${tone}`}>
      {value}
    </span>
  );
}
