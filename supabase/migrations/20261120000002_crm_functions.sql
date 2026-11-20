-- =============================================================================
-- RPC functions (SECURITY INVOKER: they run under the caller's RLS)
-- =============================================================================

-- Convert a lead into an account, a contact and (optionally) an opportunity.
create or replace function public.convert_lead(
  p_lead_id uuid,
  p_create_opportunity boolean default true,
  p_opportunity_name text default null,
  p_existing_account_id uuid default null
)
returns jsonb
language plpgsql security invoker set search_path = ''
as $$
declare
  l public.leads;
  v_account uuid;
  v_contact uuid;
  v_opp uuid;
begin
  select * into l from public.leads where id = p_lead_id for update;
  if not found then raise exception 'Lead not found'; end if;
  if l.is_converted then raise exception 'Lead is already converted'; end if;

  if p_existing_account_id is not null then
    v_account := p_existing_account_id;
  else
    insert into public.accounts (name, industry, website, phone, annual_revenue, employees,
                                 rating, billing_city, billing_country, type, owner_id)
    values (l.company, l.industry, l.website, l.phone, l.annual_revenue, l.employees,
            l.rating, l.city, l.country, 'Prospect', l.owner_id)
    returning id into v_account;
  end if;

  insert into public.contacts (account_id, first_name, last_name, title, email, phone,
                               lead_source, mailing_city, mailing_country, owner_id, description)
  values (v_account, l.first_name, l.last_name, l.title, l.email, l.phone,
          l.lead_source, l.city, l.country, l.owner_id, l.description)
  returning id into v_contact;

  if p_create_opportunity then
    insert into public.opportunities (name, account_id, contact_id, lead_source, owner_id, type)
    values (coalesce(nullif(p_opportunity_name, ''), l.company || ' - New Deal'),
            v_account, v_contact, l.lead_source, l.owner_id, 'New Business')
    returning id into v_opp;
  end if;

  -- Re-point the lead's activities to the new records
  update public.activities
     set contact_id = v_contact, account_id = v_account, opportunity_id = coalesce(opportunity_id, v_opp)
   where lead_id = p_lead_id;

  update public.leads
     set is_converted = true, status = 'Converted', converted_at = now(),
         converted_account_id = v_account, converted_contact_id = v_contact,
         converted_opportunity_id = v_opp
   where id = p_lead_id;

  return jsonb_build_object('account_id', v_account, 'contact_id', v_contact, 'opportunity_id', v_opp);
end;
$$;

-- Recalculate an opportunity amount from its line items
create or replace function private.sync_opportunity_amount()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare v_opp uuid := coalesce(new.opportunity_id, old.opportunity_id);
begin
  update public.opportunities
     set amount = (select coalesce(sum(total_price), 0) from public.opportunity_line_items where opportunity_id = v_opp)
   where id = v_opp;
  return null;
end;
$$;
create trigger sync_opportunity_amount
  after insert or update or delete on public.opportunity_line_items
  for each row execute function private.sync_opportunity_amount();

-- Global search across main objects
create or replace function public.global_search(q text)
returns table (object text, id uuid, title text, subtitle text)
language sql stable security invoker set search_path = ''
as $$
  with term as (select '%' || q || '%' as t)
  select 'accounts', a.id, a.name, coalesce(a.industry, a.billing_city, '')
    from public.accounts a, term where a.name ilike term.t
  union all
  select 'contacts', c.id, concat_ws(' ', c.first_name, c.last_name), coalesce(c.email, c.title, '')
    from public.contacts c, term
   where concat_ws(' ', c.first_name, c.last_name) ilike term.t or c.email ilike term.t
  union all
  select 'leads', l.id, concat_ws(' ', l.first_name, l.last_name), l.company
    from public.leads l, term
   where not l.is_converted and (concat_ws(' ', l.first_name, l.last_name) ilike term.t or l.company ilike term.t or l.email ilike term.t)
  union all
  select 'opportunities', o.id, o.name, o.stage
    from public.opportunities o, term where o.name ilike term.t
  union all
  select 'cases', s.id, s.case_number || ' · ' || s.subject, s.status
    from public.cases s, term where s.subject ilike term.t or s.case_number ilike term.t
  limit 25
$$;

-- Load demo data into the caller's organization
create or replace function public.seed_sample_data()
returns void
language plpgsql security invoker set search_path = ''
as $$
declare
  a1 uuid; a2 uuid; a3 uuid; a4 uuid;
  c1 uuid; c2 uuid; c3 uuid; c4 uuid;
  o1 uuid; o2 uuid;
  p1 uuid; p2 uuid; p3 uuid;
  k1 uuid;
begin
  if exists (select 1 from public.accounts where name = 'Acme Robotics') then
    raise exception 'Sample data already loaded';
  end if;

  insert into public.accounts (name, type, industry, website, phone, annual_revenue, employees, rating, billing_city, billing_country)
  values ('Acme Robotics', 'Customer', 'Manufacturing', 'acme-robotics.example', '+65 6123 4567', 48000000, 420, 'Hot', 'Singapore', 'Singapore')
  returning id into a1;
  insert into public.accounts (name, type, industry, website, phone, annual_revenue, employees, rating, billing_city, billing_country)
  values ('Blue Harbor Logistics', 'Prospect', 'Transportation', 'blueharbor.example', '+60 3 2201 8800', 12500000, 180, 'Warm', 'Kuala Lumpur', 'Malaysia')
  returning id into a2;
  insert into public.accounts (name, type, industry, website, phone, annual_revenue, employees, rating, billing_city, billing_country)
  values ('Greenleaf Health', 'Customer', 'Healthcare', 'greenleaf.example', '+61 2 9000 1111', 91000000, 1300, 'Warm', 'Sydney', 'Australia')
  returning id into a3;
  insert into public.accounts (name, type, industry, website, phone, annual_revenue, employees, rating, billing_city, billing_country)
  values ('Orbit Fintech', 'Partner', 'Financial Services', 'orbitfin.example', '+852 3000 4000', 26000000, 240, 'Cold', 'Hong Kong', 'Hong Kong')
  returning id into a4;

  insert into public.contacts (account_id, first_name, last_name, title, email, phone)
  values (a1, 'Mei', 'Tan', 'VP Operations', 'mei.tan@acme-robotics.example', '+65 9123 0001') returning id into c1;
  insert into public.contacts (account_id, first_name, last_name, title, email, phone)
  values (a2, 'Arjun', 'Nair', 'Head of IT', 'arjun@blueharbor.example', '+60 12 330 4455') returning id into c2;
  insert into public.contacts (account_id, first_name, last_name, title, email, phone)
  values (a3, 'Sophie', 'Clarke', 'CIO', 'sophie.clarke@greenleaf.example', '+61 400 111 222') returning id into c3;
  insert into public.contacts (account_id, first_name, last_name, title, email, phone)
  values (a4, 'Daniel', 'Wong', 'Partnerships Lead', 'daniel@orbitfin.example', '+852 9000 1234') returning id into c4;

  insert into public.products (name, product_code, family, unit_price) values
    ('CRM Pro Seat', 'SEAT-STD', 'Licenses', 1200) returning id into p1;
  insert into public.products (name, product_code, family, unit_price) values
    ('Implementation Package', 'SVC-IMPL', 'Services', 15000) returning id into p2;
  insert into public.products (name, product_code, family, unit_price) values
    ('Premium Support', 'SUP-PREM', 'Support', 5000) returning id into p3;

  insert into public.opportunities (account_id, contact_id, name, stage, close_date, type, next_step)
  values (a1, c1, 'Acme Robotics - Expansion 2027', 'Negotiation', current_date + 14, 'Upsell', 'Send revised quote')
  returning id into o1;
  insert into public.opportunities (account_id, contact_id, name, stage, close_date, type, next_step)
  values (a2, c2, 'Blue Harbor - Fleet CRM Rollout', 'Proposal', current_date + 35, 'New Business', 'Proposal review call')
  returning id into o2;
  insert into public.opportunities (account_id, contact_id, name, amount, stage, close_date, type) values
    (a3, c3, 'Greenleaf - Renewal FY27', 180000, 'Closed Won', current_date - 10, 'Renewal'),
    (a3, c3, 'Greenleaf - Patient Portal Add-on', 64000, 'Needs Analysis', current_date + 60, 'Upsell'),
    (a4, c4, 'Orbit - Co-sell Pilot', 30000, 'Qualification', current_date + 45, 'New Business'),
    (a2, c2, 'Blue Harbor - Analytics', 22000, 'Prospecting', current_date + 90, 'New Business'),
    (a4, c4, 'Orbit - Data Integration', 41000, 'Closed Lost', current_date - 20, 'New Business');

  insert into public.opportunity_line_items (opportunity_id, product_id, quantity, unit_price) values
    (o1, p1, 100, 1200), (o1, p3, 1, 5000),
    (o2, p1, 40, 1200), (o2, p2, 1, 15000);

  insert into public.leads (first_name, last_name, company, title, email, status, rating, lead_source, industry, city, country) values
    ('Priya', 'Raman', 'Sunrise Retail', 'COO', 'priya@sunrise.example', 'New', 'Hot', 'Web', 'Retail', 'Singapore', 'Singapore'),
    ('Kenji', 'Sato', 'Kaze Energy', 'IT Director', 'kenji@kaze.example', 'Working', 'Warm', 'Trade Show', 'Energy', 'Tokyo', 'Japan'),
    ('Lucas', 'Silva', 'Verde Foods', 'Founder', 'lucas@verde.example', 'Nurturing', 'Cold', 'Referral', 'Food & Beverage', 'Jakarta', 'Indonesia'),
    ('Hannah', 'Lee', 'Peak Learning', 'Head of Ops', 'hannah@peak.example', 'Qualified', 'Warm', 'Partner', 'Education', 'Seoul', 'South Korea');

  insert into public.cases (account_id, contact_id, subject, description, status, priority, origin, type)
  values (a1, c1, 'Dashboard export failing', 'CSV export times out for reports over 10k rows.', 'Working', 'High', 'Email', 'Problem')
  returning id into k1;
  insert into public.cases (account_id, contact_id, subject, status, priority, origin, type) values
    (a3, c3, 'Request: SSO with Azure AD', 'New', 'Medium', 'Web', 'Feature Request'),
    (a2, c2, 'How to import contacts?', 'Closed', 'Low', 'Chat', 'Question');

  insert into public.activities (type, subject, due_date, priority, opportunity_id, account_id, contact_id) values
    ('Call', 'Pricing follow-up with Mei', current_date + 1, 'High', o1, a1, c1),
    ('Meeting', 'Proposal walkthrough', current_date + 3, 'Normal', o2, a2, c2),
    ('Task', 'Prepare QBR deck for Greenleaf', current_date + 7, 'Normal', null, a3, c3),
    ('Email', 'Send case update', current_date, 'High', null, a1, c1);
  update public.activities set case_id = k1 where subject = 'Send case update';
end;
$$;

revoke execute on function public.convert_lead(uuid, boolean, text, uuid) from anon, public;
revoke execute on function public.global_search(text) from anon, public;
revoke execute on function public.seed_sample_data() from anon, public;
grant execute on function public.convert_lead(uuid, boolean, text, uuid) to authenticated;
grant execute on function public.global_search(text) to authenticated;
grant execute on function public.seed_sample_data() to authenticated;
