-- Database schema for Lead Copilot. Safe to re-run: every statement is idempotent.

create extension if not exists pgcrypto;

create table if not exists leads (
  id                 uuid primary key default gen_random_uuid(),
  name               text not null,
  phone              text null,
  phone_norm         text null,
  email              text null,
  location           text not null,
  property_req       text not null,
  budget_text        text not null,
  timeline_text      text not null,
  message            text not null,
  source             text not null,
  status             text not null default 'new',
  analysis           jsonb null,
  score              int null,
  tier               text null,
  next_follow_up_at  timestamptz null,
  follow_up_reason   text null,
  last_contacted_at  timestamptz null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create table if not exists lead_events (
  id          uuid primary key default gen_random_uuid(),
  lead_id     uuid not null references leads(id) on delete cascade,
  type        text not null,
  payload     jsonb null,
  score       int null,
  created_at  timestamptz not null default now()
);

create table if not exists chat_messages (
  id          uuid primary key default gen_random_uuid(),
  lead_id     uuid not null references leads(id) on delete cascade,
  role        text not null,
  content     text not null,
  created_at  timestamptz not null default now()
);

create table if not exists briefings (
  id          uuid primary key default gen_random_uuid(),
  date_ist    date not null,
  leads_hash  text not null,
  content     jsonb not null,
  created_at  timestamptz not null default now(),
  unique (date_ist, leads_hash)
);

create index if not exists leads_tier_score_idx on leads (tier, score desc);
create index if not exists leads_follow_up_idx on leads (next_follow_up_at);
create index if not exists leads_phone_norm_idx on leads (phone_norm);
create index if not exists leads_email_idx on leads (email);
create index if not exists lead_events_lead_created_idx on lead_events (lead_id, created_at);

-- Later schema changes go below as "alter table ... add column if not exists" lines.
