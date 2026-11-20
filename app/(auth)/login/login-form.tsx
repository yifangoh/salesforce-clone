"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signIn, type FormState } from "@/app/actions";
import { SubmitButton } from "@/components/submit-button";

export function LoginForm({ next, notice }: { next?: string; notice?: string }) {
  const [state, action] = useActionState<FormState, FormData>(signIn, {});
  return (
    <form action={action} className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold text-ink dark:text-slate-100">Log in</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Welcome back. Enter your details to continue.</p>
      </div>
      {notice && <p className="rounded-lg bg-emerald-50 dark:bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-400">{notice}</p>}
      {state.error && <p className="rounded-lg bg-rose-50 dark:bg-rose-500/10 p-3 text-sm text-rose-700 dark:text-rose-400">{state.error}</p>}
      <input type="hidden" name="next" value={next ?? "/"} />
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input className="input" id="email" name="email" type="email" required autoComplete="email" />
      </div>
      <div>
        <label className="label" htmlFor="password">Password</label>
        <input className="input" id="password" name="password" type="password" required autoComplete="current-password" />
      </div>
      <SubmitButton className="btn-primary w-full py-2" pendingText="Signing in…">Log in</SubmitButton>
      <p className="text-center text-sm text-slate-500 dark:text-slate-400">
        New here? <Link className="link" href="/signup">Create an account</Link>
      </p>
    </form>
  );
}
