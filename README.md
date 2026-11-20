# Tidal CRM — a Salesforce-style CRM on Supabase

A multi-tenant CRM in the spirit of Salesforce Sales & Service Cloud, built with **Next.js 16 (App Router)**, **Supabase** (Postgres, Auth, Row Level Security) and **Tailwind CSS 4**. Deploys to **Vercel** as-is.

> Independent project, not affiliated with Salesforce. The app uses its own name and branding; the name is configurable with `NEXT_PUBLIC_APP_NAME`.

## Features

| Area | What you get |
|---|---|
| **Leads** | Status / rating / source, list filters, **lead conversion** into account + contact + opportunity (or link to an existing account) |
| **Accounts** | Parent accounts, billing address, related contacts, opportunities, cases, activity timeline |
| **Contacts** | Linked to accounts, related opportunities and cases |
| **Opportunities** | Stage **path** bar, stage-based default probability, **product line items** that auto-sum into the amount, drag-and-drop **pipeline (kanban)** |
| **Cases** | Auto case numbers (`C-1000`…), priority, origin, auto `closed_at` stamping |
| **Activities** | Tasks, calls, meetings, emails logged on any record; complete them inline |
| **Products** | Price book with list prices and product families |
| **Home dashboard** | Open & weighted pipeline, won this quarter, win rate, pipeline by stage, closing soon, my tasks, leads by status, open cases |
| **Global search** | Across accounts, contacts, leads, opportunities and cases |
| **Multi-tenancy** | Every signup creates its own organization; RLS isolates all data per org |
| **Dark mode** | Light / dark / system theme toggle in the header (and on login/signup), remembered per browser, no flash on load |
| **Sample data** | One-click "Load sample data" on an empty workspace |

The UI is **metadata-driven**: each object is described once in [`lib/objects.ts`](lib/objects.ts) (fields, picklists, list columns, related lists), and the generic list, detail and form pages render from that config. To add a field: add a column in a migration, then add it to the object's `sections`.

## Database schema

Migrations live in [`supabase/migrations`](supabase/migrations) and are already applied to the Supabase project **`salesforce-clone`** (`hubhctjlihufofitavkf`, ap-southeast-1).

```
organizations ─┬─< profiles (1:1 auth.users, role admin|user)
               ├─< accounts ──< contacts
               │      │  └─< accounts (parent)
               │      ├─< opportunities ──< opportunity_line_items >── products
               │      └─< cases
               ├─< leads ──(converted_*)──> accounts / contacts / opportunities
               └─< activities ── optional FK to account / contact / lead / opportunity / case
```

- **Tenancy:** every CRM table has `org_id`, defaulted from `private.current_org_id()`, and `owner_id` defaulted from `auth.uid()`. The client never sends either.
- **RLS:** `select / insert / update / delete` are allowed only where `org_id = current_org_id()`. The anon role has no table access at all. Users can't change their own `role` or `org_id`.
- **Triggers:** `updated_at`; case `closed_at` and activity `completed_at`; opportunity probability by stage; line items → opportunity amount; new auth user → organization + admin profile.
- **RPCs** (security invoker, RLS still applies): `convert_lead`, `global_search`, `seed_sample_data`.
- **Generated columns:** `opportunities.is_closed / is_won`, `opportunity_line_items.total_price`.
- Supabase's security advisor reports no issues.

Regenerate TypeScript types with:

```bash
npx supabase gen types typescript --project-id hubhctjlihufofitavkf > lib/database.types.ts
```

## Run locally

```bash
cp .env.example .env.local   # already points at the salesforce-clone Supabase project
npm install
npm run dev                  # http://localhost:3000
```

Sign up, confirm the email, log in, then click **Load sample data** on Home.

## Deploy to Vercel

1. In Vercel: **Add New → Project → Import** `yifangoh/salesforce-clone`. The framework is detected as Next.js; keep the defaults.
2. Add the environment variables from `.env.example`:
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://hubhctjlihufofitavkf.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` = `sb_publishable_uLZGDIaf7QMw2wnT5qSi2Q_0LnAlJIy`
   - optional: `NEXT_PUBLIC_APP_NAME`, `NEXT_PUBLIC_CURRENCY` (e.g. `SGD`)
3. Deploy. (`vercel.json` pins functions to `sin1`, next to the Supabase region.)
4. In Supabase → **Authentication → URL Configuration**, set **Site URL** to your Vercel URL and add `https://<your-app>.vercel.app/auth/callback` under **Redirect URLs**. Without this step, confirmation emails link to localhost.

The publishable key is designed to be public. Data is protected by RLS, not by hiding the key. Never put the `service_role` / secret key in a `NEXT_PUBLIC_` variable.

## Project structure

```
app/
  (auth)/login, signup        email + password auth
  auth/callback               email confirmation handler
  (app)/page.tsx              Home dashboard
  (app)/[object]/…            generic list / new / detail / edit for every object
  (app)/[object]/[id]/convert lead conversion
  (app)/pipeline              kanban board
  (app)/search, settings
  actions.ts                  all server actions (CRUD, stage moves, activities, conversion, auth)
components/                   UI building blocks (record form, related lists, stage path, …)
lib/objects.ts                object metadata (the "schema" the UI renders from)
lib/data.ts                   server-side queries
lib/supabase/                 server / browser / proxy Supabase clients
proxy.ts                      session refresh + auth redirect (Next 16 proxy)
supabase/migrations/          SQL schema
```

## Ideas for next steps

Inviting teammates into an existing org · role-based field permissions · reports builder · email-to-case via an Edge Function · CSV import/export · Supabase Realtime on the pipeline board.
