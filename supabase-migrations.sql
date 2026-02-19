-- ============================================================
-- Run these in your Supabase Dashboard > SQL Editor
-- Run Migration 001 first, then Migration 002
-- ============================================================

-- ── Migration 001: Posts Table ─────────────────────────────

create extension if not exists "uuid-ossp";

create table public.posts (
  id            uuid primary key default uuid_generate_v4(),
  title         text not null,
  slug          text not null unique,
  content       text not null,
  excerpt       text not null,
  tags          text[] not null default '{}',
  status        text not null default 'draft' check (status in ('draft', 'published')),
  created_at    timestamptz not null default now(),
  published_at  timestamptz
);

create index posts_slug_idx on public.posts (slug);
create index posts_status_published_at_idx on public.posts (status, published_at desc);

alter table public.posts enable row level security;

create policy "Published posts are public"
  on public.posts for select
  using (status = 'published');

create policy "Service role can do anything"
  on public.posts for all
  using (auth.role() = 'service_role');


-- ── Migration 002: Workflow Runs Table ─────────────────────

create table public.workflow_runs (
  id                  uuid primary key default uuid_generate_v4(),
  status              text not null default 'IDLE' check (
    status in ('IDLE','TOPICS_SENT','TOPIC_SELECTED','DRAFT_SENT','APPROVED','PUBLISHED')
  ),
  topics              jsonb,
  selected_topic      jsonb,
  draft_post          jsonb,
  approval_token      text unique,
  post_id             uuid references public.posts(id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  topics_sent_at      timestamptz,
  topic_selected_at   timestamptz,
  draft_sent_at       timestamptz,
  approved_at         timestamptz,
  published_at        timestamptz
);

-- Enforce only one active workflow at a time
create unique index one_active_workflow
  on public.workflow_runs (status)
  where status not in ('IDLE', 'PUBLISHED');

-- Auto-update updated_at timestamp
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger workflow_runs_updated_at
  before update on public.workflow_runs
  for each row execute function update_updated_at();

alter table public.workflow_runs enable row level security;

create policy "Service role only"
  on public.workflow_runs for all
  using (auth.role() = 'service_role');
