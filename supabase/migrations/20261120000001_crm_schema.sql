-- =============================================================================
-- Nimbus CRM — core schema
-- Multi-tenant: every CRM row belongs to an organization. Users see only rows
-- of their own organization (enforced with Row Level Security).
-- =============================================================================

create extension if not exists pg_trgm with schema extensions;

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

-- -----------------------------------------------------------------------------
-- Tenancy & users
-- -----------------------------------------------------------------------------
create table public.organizations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  org_id      uuid not null references public.organizations (id) on delete cascade,
  full_name   text,
  email       text,
  title       text,
  role        text not null default 'user' check (role in ('admin', 'user')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index profiles_org_id_idx on public.profiles (org_id);

-- Helpers (in a non-exposed schema). SECURITY DEFINER so RLS on profiles
-- doesn't recurse when policies call them.
create or replace function private.current_org_id()
returns uuid
language sql stable security definer set search_path = ''
as $$
  select org_id from public.profiles where id = auth.uid()
$$;

create or replace function private.is_org_admin()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
$$;

grant execute on function private.current_org_id() to authenticated;
grant execute on function private.is_org_admin() to authenticated;

create or replace function private.set_updated_at()
returns trigger
language plpgsql set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- CRM objects
-- -----------------------------------------------------------------------------
create table public.accounts (
  id                 uuid primary key default gen_random_uuid(),
  org_id             uuid not null default private.current_org_id() references public.organizations (id) on delete cascade,
  owner_id           uuid default auth.uid() references public.profiles (id) on delete set null,
  parent_account_id  uuid references public.accounts (id) on delete set null,
  name               text not null,
  type               text check (type in ('Prospect', 'Customer', 'Partner', 'Reseller', 'Competitor', 'Other')),
  industry           text,
  website            text,
  phone              text,
  annual_revenue     numeric(16, 2),
  employees          integer,
  rating             text check (rating in ('Hot', 'Warm', 'Cold')),
  billing_street     text,
  billing_city       text,
  billing_state      text,
  billing_postal_code text,
  billing_country    text,
  description        text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create table public.contacts (
  id                 uuid primary key default gen_random_uuid(),
  org_id             uuid not null default private.current_org_id() references public.organizations (id) on delete cascade,
  owner_id           uuid default auth.uid() references public.profiles (id) on delete set null,
  account_id         uuid references public.accounts (id) on delete set null,
  first_name         text,
  last_name          text not null,
  title              text,
  department         text,
  email              text,
  phone              text,
  mobile             text,
  lead_source        text,
  mailing_street     text,
  mailing_city       text,
  mailing_state      text,
  mailing_postal_code text,
  mailing_country    text,
  birthdate          date,
  description        text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create table public.leads (
  id                       uuid primary key default gen_random_uuid(),
  org_id                   uuid not null default private.current_org_id() references public.organizations (id) on delete cascade,
  owner_id                 uuid default auth.uid() references public.profiles (id) on delete set null,
  first_name               text,
  last_name                text not null,
  company                  text not null,
  title                    text,
  email                    text,
  phone                    text,
  website                  text,
  status                   text not null default 'New'
                           check (status in ('New', 'Working', 'Nurturing', 'Qualified', 'Unqualified', 'Converted')),
  rating                   text check (rating in ('Hot', 'Warm', 'Cold')),
  lead_source              text,
  industry                 text,
  annual_revenue           numeric(16, 2),
  employees                integer,
  city                     text,
  country                  text,
  description              text,
  is_converted             boolean not null default false,
  converted_at             timestamptz,
  converted_account_id     uuid references public.accounts (id) on delete set null,
  converted_contact_id     uuid references public.contacts (id) on delete set null,
  converted_opportunity_id uuid,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create table public.opportunities (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null default private.current_org_id() references public.organizations (id) on delete cascade,
  owner_id      uuid default auth.uid() references public.profiles (id) on delete set null,
  account_id    uuid references public.accounts (id) on delete set null,
  contact_id    uuid references public.contacts (id) on delete set null,
  name          text not null,
  amount        numeric(16, 2),
  close_date    date not null default (current_date + 30),
  stage         text not null default 'Prospecting'
                check (stage in ('Prospecting', 'Qualification', 'Needs Analysis', 'Proposal',
                                 'Negotiation', 'Closed Won', 'Closed Lost')),
  probability   integer check (probability between 0 and 100),
  type          text check (type in ('New Business', 'Existing Business', 'Renewal', 'Upsell')),
  lead_source   text,
  next_step     text,
  description   text,
  is_closed     boolean generated always as (stage in ('Closed Won', 'Closed Lost')) stored,
  is_won        boolean generated always as (stage = 'Closed Won') stored,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.leads
  add constraint leads_converted_opportunity_id_fkey
  foreign key (converted_opportunity_id) references public.opportunities (id) on delete set null;

create table public.products (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null default private.current_org_id() references public.organizations (id) on delete cascade,
  name          text not null,
  product_code  text,
  family        text,
  unit_price    numeric(16, 2) not null default 0,
  is_active     boolean not null default true,
  description   text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table public.opportunity_line_items (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null default private.current_org_id() references public.organizations (id) on delete cascade,
  opportunity_id  uuid not null references public.opportunities (id) on delete cascade,
  product_id      uuid not null references public.products (id) on delete restrict,
  quantity        numeric(12, 2) not null default 1 check (quantity > 0),
  unit_price      numeric(16, 2) not null,
  discount_pct    numeric(5, 2) not null default 0 check (discount_pct between 0 and 100),
  total_price     numeric(18, 2) generated always as (round(quantity * unit_price * (1 - discount_pct / 100), 2)) stored,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create sequence public.case_number_seq start 1000;

create table public.cases (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null default private.current_org_id() references public.organizations (id) on delete cascade,
  owner_id     uuid default auth.uid() references public.profiles (id) on delete set null,
  account_id   uuid references public.accounts (id) on delete set null,
  contact_id   uuid references public.contacts (id) on delete set null,
  case_number  text not null default ('C-' || nextval('public.case_number_seq')::text),
  subject      text not null,
  description  text,
  status       text not null default 'New' check (status in ('New', 'Working', 'Escalated', 'Closed')),
  priority     text not null default 'Medium' check (priority in ('Low', 'Medium', 'High', 'Critical')),
  origin       text check (origin in ('Email', 'Phone', 'Web', 'Chat')),
  type         text check (type in ('Question', 'Problem', 'Feature Request')),
  closed_at    timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Tasks, calls, meetings and emails logged against any record.
create table public.activities (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null default private.current_org_id() references public.organizations (id) on delete cascade,
  owner_id        uuid default auth.uid() references public.profiles (id) on delete set null,
  type            text not null default 'Task' check (type in ('Task', 'Call', 'Meeting', 'Email')),
  subject         text not null,
  description     text,
  status          text not null default 'Open' check (status in ('Open', 'In Progress', 'Completed')),
  priority        text not null default 'Normal' check (priority in ('Low', 'Normal', 'High')),
  due_date        date,
  completed_at    timestamptz,
  account_id      uuid references public.accounts (id) on delete cascade,
  contact_id      uuid references public.contacts (id) on delete cascade,
  lead_id         uuid references public.leads (id) on delete cascade,
  opportunity_id  uuid references public.opportunities (id) on delete cascade,
  case_id         uuid references public.cases (id) on delete cascade,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Indexes
-- -----------------------------------------------------------------------------
create index accounts_org_idx            on public.accounts (org_id);
create index accounts_owner_idx          on public.accounts (owner_id);
create index accounts_parent_idx         on public.accounts (parent_account_id);
create index accounts_name_trgm_idx      on public.accounts using gin (name extensions.gin_trgm_ops);

create index contacts_org_idx            on public.contacts (org_id);
create index contacts_owner_idx          on public.contacts (owner_id);
create index contacts_account_idx        on public.contacts (account_id);

create index leads_org_idx               on public.leads (org_id);
create index leads_owner_idx             on public.leads (owner_id);
create index leads_status_idx            on public.leads (org_id, status);
create index leads_conv_account_idx      on public.leads (converted_account_id);
create index leads_conv_contact_idx      on public.leads (converted_contact_id);
create index leads_conv_opp_idx          on public.leads (converted_opportunity_id);

create index opps_org_idx                on public.opportunities (org_id);
create index opps_owner_idx              on public.opportunities (owner_id);
create index opps_account_idx            on public.opportunities (account_id);
create index opps_contact_idx            on public.opportunities (contact_id);
create index opps_stage_idx              on public.opportunities (org_id, stage);

create index products_org_idx            on public.products (org_id);
create index oli_org_idx                 on public.opportunity_line_items (org_id);
create index oli_opp_idx                 on public.opportunity_line_items (opportunity_id);
create index oli_product_idx             on public.opportunity_line_items (product_id);

create index cases_org_idx               on public.cases (org_id);
create index cases_owner_idx             on public.cases (owner_id);
create index cases_account_idx           on public.cases (account_id);
create index cases_contact_idx           on public.cases (contact_id);
create unique index cases_number_idx     on public.cases (org_id, case_number);

create index activities_org_idx          on public.activities (org_id);
create index activities_owner_idx        on public.activities (owner_id);
create index activities_account_idx      on public.activities (account_id);
create index activities_contact_idx      on public.activities (contact_id);
create index activities_lead_idx         on public.activities (lead_id);
create index activities_opp_idx          on public.activities (opportunity_id);
create index activities_case_idx         on public.activities (case_id);

-- -----------------------------------------------------------------------------
-- updated_at triggers
-- -----------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['organizations','profiles','accounts','contacts','leads',
                           'opportunities','products','opportunity_line_items','cases','activities']
  loop
    execute format(
      'create trigger set_updated_at before update on public.%I
         for each row execute function private.set_updated_at()', t);
  end loop;
end $$;

-- Close timestamps
create or replace function private.stamp_closed()
returns trigger
language plpgsql set search_path = ''
as $$
begin
  if tg_table_name = 'cases' then
    if new.status = 'Closed' and new.closed_at is null then new.closed_at = now(); end if;
    if new.status <> 'Closed' then new.closed_at = null; end if;
  elsif tg_table_name = 'activities' then
    if new.status = 'Completed' and new.completed_at is null then new.completed_at = now(); end if;
    if new.status <> 'Completed' then new.completed_at = null; end if;
  end if;
  return new;
end;
$$;
create trigger stamp_closed before insert or update on public.cases
  for each row execute function private.stamp_closed();
create trigger stamp_closed before insert or update on public.activities
  for each row execute function private.stamp_closed();

-- Default probability from stage when not supplied / stage changes
create or replace function private.opportunity_probability()
returns trigger
language plpgsql set search_path = ''
as $$
begin
  if new.probability is null or (tg_op = 'UPDATE' and new.stage is distinct from old.stage
                                 and new.probability is not distinct from old.probability) then
    new.probability = case new.stage
      when 'Prospecting'    then 10
      when 'Qualification'  then 20
      when 'Needs Analysis' then 40
      when 'Proposal'       then 60
      when 'Negotiation'    then 80
      when 'Closed Won'     then 100
      when 'Closed Lost'    then 0
    end;
  end if;
  return new;
end;
$$;
create trigger opportunity_probability before insert or update on public.opportunities
  for each row execute function private.opportunity_probability();

-- -----------------------------------------------------------------------------
-- New user → organization + admin profile
-- -----------------------------------------------------------------------------
create or replace function private.handle_new_user()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  new_org uuid;
begin
  insert into public.organizations (name)
  values (coalesce(nullif(new.raw_user_meta_data ->> 'company', ''), split_part(new.email, '@', 1) || '''s Company'))
  returning id into new_org;

  insert into public.profiles (id, org_id, full_name, email, role)
  values (new.id, new_org, new.raw_user_meta_data ->> 'full_name', new.email, 'admin');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
alter table public.organizations          enable row level security;
alter table public.profiles               enable row level security;
alter table public.accounts               enable row level security;
alter table public.contacts               enable row level security;
alter table public.leads                  enable row level security;
alter table public.opportunities          enable row level security;
alter table public.products               enable row level security;
alter table public.opportunity_line_items enable row level security;
alter table public.cases                  enable row level security;
alter table public.activities             enable row level security;

create policy "members read own org" on public.organizations
  for select to authenticated using (id = (select private.current_org_id()));
create policy "admins update own org" on public.organizations
  for update to authenticated
  using (id = (select private.current_org_id()) and (select private.is_org_admin()))
  with check (id = (select private.current_org_id()));

create policy "members read org profiles" on public.profiles
  for select to authenticated using (org_id = (select private.current_org_id()));
create policy "users update own profile" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()) and org_id = (select private.current_org_id()));

-- Users may not promote themselves or move orgs.
create or replace function private.protect_profile_fields()
returns trigger
language plpgsql set search_path = ''
as $$
begin
  if (new.role is distinct from old.role or new.org_id is distinct from old.org_id)
     and current_user = 'authenticated' then
    raise exception 'role and org_id cannot be changed by the user';
  end if;
  return new;
end;
$$;
create trigger protect_profile_fields before update on public.profiles
  for each row execute function private.protect_profile_fields();

-- Same org-scoped CRUD policy for every CRM object
do $$
declare t text;
begin
  foreach t in array array['accounts','contacts','leads','opportunities','products',
                           'opportunity_line_items','cases','activities']
  loop
    execute format('create policy "org select" on public.%I for select to authenticated
                      using (org_id = (select private.current_org_id()))', t);
    execute format('create policy "org insert" on public.%I for insert to authenticated
                      with check (org_id = (select private.current_org_id()))', t);
    execute format('create policy "org update" on public.%I for update to authenticated
                      using (org_id = (select private.current_org_id()))
                      with check (org_id = (select private.current_org_id()))', t);
    execute format('create policy "org delete" on public.%I for delete to authenticated
                      using (org_id = (select private.current_org_id()))', t);
  end loop;
end $$;

-- Lock anonymous access down entirely
revoke all on all tables in schema public from anon;
