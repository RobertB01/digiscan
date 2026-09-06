create extension if not exists pgcrypto;

create table if not exists public.scans (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  questionnaire_version text not null,
  consent_version text not null,
  bouw text not null check (bouw in ('Onderbouw', 'Middenbouw', 'Bovenbouw', 'Anders')),
  extra_answer text,
  recommended_route smallint not null check (recommended_route between 1 and 6),
  scores jsonb not null,
  individual_scores jsonb not null,
  school_scores jsonb not null,
  overall_score numeric(4,2) not null check (overall_score between 1 and 10)
);

create table if not exists public.responses (
  scan_id uuid not null references public.scans(id) on delete cascade,
  question_id smallint not null check (question_id between 1 and 60),
  theme_id smallint not null check (theme_id between 1 and 6),
  perspective text not null check (perspective in ('ik', 'school')),
  score smallint not null check (score between 1 and 5),
  primary key (scan_id, question_id)
);

create table if not exists public.email_deliveries (
  id bigint generated always as identity primary key,
  scan_id uuid not null references public.scans(id) on delete cascade,
  sent_at timestamptz not null default now(),
  provider_message_id text
);

create index if not exists responses_scan_id_idx on public.responses(scan_id);
create index if not exists email_deliveries_scan_id_sent_at_idx
  on public.email_deliveries(scan_id, sent_at desc);

alter table public.scans enable row level security;
alter table public.responses enable row level security;
alter table public.email_deliveries enable row level security;

-- Bewust geen publieke policies: alleen Edge Functions met de service-role key
-- mogen deze tabellen lezen en schrijven.