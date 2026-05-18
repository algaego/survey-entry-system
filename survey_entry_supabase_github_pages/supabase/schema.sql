-- Supabase schema for Survey Data Entry System
-- Run this file in Supabase SQL Editor after creating your project.
-- It creates: public.profiles, public.survey_entries, update trigger, and RLS policies.

create extension if not exists pgcrypto;

-- 1. User profiles linked to Supabase Auth users.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  recorder_code text unique not null,
  display_name text not null,
  role text not null check (role in ('admin', 'clerk')),
  created_at timestamptz not null default now()
);

-- 2. One row = one paper questionnaire entry.
create table if not exists public.survey_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  recorder_code text not null,
  paper_no text not null,
  entry_num integer not null,
  status text not null default 'draft' check (status in ('draft', 'submitted')),
  answers jsonb not null default '{}'::jsonb,
  others jsonb not null default '{}'::jsonb,
  email text,
  interview text,
  flag_haphazard boolean not null default false,
  flag_illegible boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (recorder_code, entry_num),
  unique (paper_no)
);

create index if not exists survey_entries_user_id_idx on public.survey_entries(user_id);
create index if not exists survey_entries_recorder_code_idx on public.survey_entries(recorder_code);
create index if not exists survey_entries_status_idx on public.survey_entries(status);

-- 3. Keep updated_at fresh.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists survey_entries_set_updated_at on public.survey_entries;
create trigger survey_entries_set_updated_at
before update on public.survey_entries
for each row execute function public.set_updated_at();

-- 4. Helper functions used by RLS policies.
create or replace function public.current_user_role()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.current_recorder_code()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select recorder_code from public.profiles where id = auth.uid();
$$;

-- 5. Enable Row Level Security.
alter table public.profiles enable row level security;
alter table public.survey_entries enable row level security;

-- 6. Drop old policies before recreating.
drop policy if exists "profiles_select_own_or_admin" on public.profiles;
drop policy if exists "survey_entries_select_own_or_admin" on public.survey_entries;
drop policy if exists "survey_entries_insert_own" on public.survey_entries;
drop policy if exists "survey_entries_update_own_or_admin" on public.survey_entries;
drop policy if exists "survey_entries_delete_own_or_admin" on public.survey_entries;

-- Profiles: clerks see only their own profile; admin sees all profiles.
create policy "profiles_select_own_or_admin"
on public.profiles
for select
to authenticated
using (id = auth.uid() or public.current_user_role() = 'admin');

-- Survey entries: clerks see only their own rows; admin sees all rows.
create policy "survey_entries_select_own_or_admin"
on public.survey_entries
for select
to authenticated
using (user_id = auth.uid() or public.current_user_role() = 'admin');

-- Clerks can insert only rows under their own account and recorder code.
create policy "survey_entries_insert_own"
on public.survey_entries
for insert
to authenticated
with check (
  user_id = auth.uid()
  and recorder_code = public.current_recorder_code()
);

-- Clerks update own entries; admin updates all entries.
create policy "survey_entries_update_own_or_admin"
on public.survey_entries
for update
to authenticated
using (user_id = auth.uid() or public.current_user_role() = 'admin')
with check (user_id = auth.uid() or public.current_user_role() = 'admin');

-- Clerks delete own entries; admin deletes all entries.
create policy "survey_entries_delete_own_or_admin"
on public.survey_entries
for delete
to authenticated
using (user_id = auth.uid() or public.current_user_role() = 'admin');
