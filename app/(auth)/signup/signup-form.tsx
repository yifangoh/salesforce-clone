"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { signUp, type FormState } from "@/app/actions";
import { SubmitButton } from "@/components/submit-button";

export function SignupForm() {
  const [state, action] = useActionState<FormState & { sent?: boolean }, FormData>(signUp, {});
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);

  if (state.sent) {
    return (
      <div className="space-y-3">
        <h2 className="text-2xl font-semibold text-ink dark:text-slate-100">Check your inbox</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">We sent you a confirmation link. Click it to activate your workspace, then log in.</p>
        <Link className="link text-sm" href="/login">Back to log in</Link>
      </div>
    );
  }
  return (
    <form action={action} className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold text-ink dark:text-slate-100">Create your workspace</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">You&apos;ll be the admin of a new organization.</p>
      </div>
      {state.error && <p className="rounded-lg bg-rose-50 dark:bg-rose-500/10 p-3 text-sm text-rose-700 dark:text-rose-400">{state.error}</p>}
      <input type="hidden" name="origin" value={origin} />
      <div>
        <label className="label" htmlFor="full_name">Full name</label>
        <input className="input" id="full_name" name="full_name" required />
      </div>
      <div>
        <label className="label" htmlFor="company">Company</label>
        <input className="input" id="company" name="company" required />
      </div>
      <div>
        <label className="label" htmlFor="email">Work email</label>
        <input className="input" id="email" name="email" type="email" required autoComplete="email" />
      </div>
      <div>
        <label className="label" htmlFor="password">Password</label>
        <input className="input" id="password" name="password" type="password" minLength={6} required autoComplete="new-password" />
      </div>
      <SubmitButton className="btn-primary w-full py-2" pendingText="Creating…">Sign up</SubmitButton>
      <p className="text-center text-sm text-slate-500 dark:text-slate-400">
        Already have an account? <Link className="link" href="/login">Log in</Link>
      </p>
    </form>
  );
}
