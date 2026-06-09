-- Phase 34: Launch readiness — analytics, error logging, referrals

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  session_id text,
  event_name text not null,
  properties jsonb default '{}'::jsonb,
  route text,
  created_at timestamptz not null default now()
);

create index if not exists analytics_events_event_name_idx on public.analytics_events (event_name);
create index if not exists analytics_events_created_at_idx on public.analytics_events (created_at desc);
create index if not exists analytics_events_user_id_idx on public.analytics_events (user_id);

alter table public.analytics_events enable row level security;

create policy "Users can insert own analytics events"
  on public.analytics_events for insert
  to authenticated
  with check (auth.uid() = user_id or user_id is null);

create policy "Service role reads analytics"
  on public.analytics_events for select
  to authenticated
  using (auth.uid() = user_id);

create table if not exists public.client_errors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  message text not null,
  stack text,
  route text,
  component_stack text,
  kind text default 'error',
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists client_errors_created_at_idx on public.client_errors (created_at desc);

alter table public.client_errors enable row level security;

create policy "Users can insert client errors"
  on public.client_errors for insert
  to authenticated, anon
  with check (true);

create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_code text not null,
  invitee_user_id uuid references auth.users(id) on delete cascade,
  trial_granted boolean default true,
  created_at timestamptz not null default now(),
  unique (referrer_code, invitee_user_id)
);

create index if not exists referrals_referrer_code_idx on public.referrals (referrer_code);

alter table public.referrals enable row level security;

create policy "Users can insert referral redemption"
  on public.referrals for insert
  to authenticated
  with check (auth.uid() = invitee_user_id);

create policy "Users can read own referral rows"
  on public.referrals for select
  to authenticated
  using (auth.uid() = invitee_user_id);
