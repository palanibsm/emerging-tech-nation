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


-- ── Migration 003: Agent Runs Observability Table ─────────────────────────────

create table if not exists public.agent_runs (
  id                uuid primary key default uuid_generate_v4(),
  workflow_run_id   uuid references public.workflow_runs(id) on delete set null,
  agent_name        text not null check (
    agent_name in (
      'research-agent',
      'writer-agent',
      'publisher-agent',
      'topic-ranker-agent',
      'fact-check-agent',
      'editor-agent'
    )
  ),
  status            text not null check (status in ('started', 'success', 'failure')),
  input_payload     jsonb,
  output_payload    jsonb,
  error_message     text,
  latency_ms        integer,
  token_cost_usd    numeric(10, 6),
  created_at        timestamptz not null default now()
);

create index if not exists agent_runs_workflow_run_id_idx
  on public.agent_runs (workflow_run_id, created_at desc);

create index if not exists agent_runs_agent_name_idx
  on public.agent_runs (agent_name, created_at desc);

alter table public.agent_runs enable row level security;

create policy "Service role only for agent runs"
  on public.agent_runs for all
  using (auth.role() = 'service_role');


-- ── Migration 004: Learning Memory Tables ─────────────────────────────────────

create table if not exists public.topic_performance (
  id                uuid primary key default uuid_generate_v4(),
  workflow_run_id   uuid not null references public.workflow_runs(id) on delete cascade,
  topic_title       text not null,
  topic_category    text not null,
  topic_index       integer not null,
  was_selected      boolean not null default false,
  was_custom        boolean not null default false,
  selected_at       timestamptz,
  published_post_id uuid references public.posts(id) on delete set null,
  published_at      timestamptz,
  created_at        timestamptz not null default now(),
  constraint topic_performance_category_check check (
    topic_category in (
      'Agentic AI','AI','Quantum','Robotics','AR/VR','IoT',
      'Biotech','Space Tech','Cybersecurity','Green Tech','Web3','Semiconductors'
    )
  )
);

create index if not exists topic_performance_run_idx
  on public.topic_performance (workflow_run_id, topic_index);

create index if not exists topic_performance_selected_idx
  on public.topic_performance (was_selected, published_at desc);

alter table public.topic_performance enable row level security;

create policy "Service role only for topic performance"
  on public.topic_performance for all
  using (auth.role() = 'service_role');

create table if not exists public.prompt_versions (
  id            uuid primary key default uuid_generate_v4(),
  agent_name    text not null check (
    agent_name in (
      'research-agent',
      'writer-agent',
      'publisher-agent',
      'topic-ranker-agent',
      'fact-check-agent',
      'editor-agent'
    )
  ),
  version_label text not null,
  prompt_hash   text not null,
  prompt_text   text not null,
  is_active     boolean not null default true,
  notes         text,
  created_at    timestamptz not null default now(),
  unique(agent_name, version_label)
);

create index if not exists prompt_versions_agent_idx
  on public.prompt_versions (agent_name, created_at desc);

alter table public.prompt_versions enable row level security;

create policy "Service role only for prompt versions"
  on public.prompt_versions for all
  using (auth.role() = 'service_role');
