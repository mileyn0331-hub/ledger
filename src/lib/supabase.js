import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

/*
──────────────────────────────────────────────
  Supabase SQL — Dashboard > SQL Editor 에서 실행
──────────────────────────────────────────────

create table public.entries (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  day_key     text not null,        -- 'YYYY-MM-DD'
  name        text not null,
  cat_id      text not null,
  amount      integer not null,
  ts          bigint not null,
  created_at  timestamptz default now()
);

create table public.income (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  month_key   text not null,        -- 'YYYY-MM'
  amount      integer not null default 0,
  updated_at  timestamptz default now(),
  unique(user_id, month_key)
);

-- Row Level Security
alter table public.entries enable row level security;
alter table public.income  enable row level security;

create policy "own entries" on public.entries
  for all using (auth.uid() = user_id);

create policy "own income" on public.income
  for all using (auth.uid() = user_id);

──────────────────────────────────────────────
*/
