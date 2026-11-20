import Link from "next/link";
import { CalendarCheck, Mail, Phone, Users as UsersIcon } from "lucide-react";
import { ACTIVITY_TYPES, formatDate } from "@/lib/objects";
import { logActivity } from "@/app/actions";
import { SubmitButton } from "./submit-button";
import { ActivityCheckbox } from "./activity-checkbox";

const TYPE_ICON = { Task: CalendarCheck, Call: Phone, Meeting: UsersIcon, Email: Mail } as const;

export function ActivityPanel({ fk, id, activities, path }: { fk: string; id: string; activities: any[]; path: string }) {
  const open = activities.filter((a) => a.status !== "Completed");
  const done = activities.filter((a) => a.status === "Completed").reverse();
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="card">
      <div className="border-b border-slate-200 dark:border-slate-800 px-4 py-3">
        <h2 className="text-sm font-semibold text-ink dark:text-slate-100">Activity</h2>
      </div>
      <form action={logActivity} className="space-y-2 border-b border-slate-200 dark:border-slate-800 p-4">
        <input type="hidden" name={fk} value={id} />
        <input type="hidden" name="_path" value={path} />
        <div className="flex gap-2">
          <select name="type" className="input w-28" defaultValue="Task">
            {ACTIVITY_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
          <input name="subject" required placeholder="Subject" className="input" />
        </div>
        <div className="flex items-center gap-2">
          <input type="date" name="due_date" className="input w-40" defaultValue={today} />
          <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
            <input type="checkbox" name="completed" className="h-3.5 w-3.5 rounded border-slate-300 dark:border-slate-700" /> Already done
          </label>
          <SubmitButton className="btn-primary ml-auto" pendingText="Adding…">Add</SubmitButton>
        </div>
      </form>
      <div className="space-y-4 p-4">
        <Group title="Upcoming & Overdue" items={open} path={path} today={today} />
        <Group title="Past Activity" items={done} path={path} today={today} />
        {activities.length === 0 && <p className="text-center text-sm text-slate-400 dark:text-slate-500">No activities yet.</p>}
      </div>
    </div>
  );
}

function Group({ title, items, path, today }: { title: string; items: any[]; path: string; today: string }) {
  if (!items.length) return null;
  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold tracking-wide text-slate-500 dark:text-slate-400 uppercase">{title}</h3>
      <ul className="space-y-2">
        {items.map((a) => {
          const Icon = TYPE_ICON[a.type as keyof typeof TYPE_ICON] ?? CalendarCheck;
          const overdue = a.status !== "Completed" && a.due_date && a.due_date < today;
          return (
            <li key={a.id} className="flex items-start gap-2.5">
              <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
                <Icon size={13} />
              </span>
              <div className="min-w-0 flex-1">
                <Link href={`/activities/${a.id}`} className={`block truncate text-sm font-medium hover:underline ${a.status === "Completed" ? "text-slate-500 dark:text-slate-400 line-through" : "text-brand-600 dark:text-brand-400"}`}>
                  {a.subject}
                </Link>
                <p className={`text-xs ${overdue ? "font-medium text-rose-600 dark:text-rose-400" : "text-slate-500 dark:text-slate-400"}`}>
                  {a.type}{a.due_date ? ` · ${overdue ? "Overdue · " : ""}${formatDate(a.due_date)}` : ""}
                  {a.owner ? ` · ${a.owner.full_name || a.owner.email}` : ""}
                </p>
              </div>
              <ActivityCheckbox id={a.id} done={a.status === "Completed"} path={path} />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
