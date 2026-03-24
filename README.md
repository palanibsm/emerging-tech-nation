# Emerging Tech Nation

An AI-powered, automated tech blog that researches, writes, and publishes daily articles on enterprise technology, cybersecurity, and emerging AI — with minimal human intervention.

## How It Works

The publication pipeline runs on an hourly cron and advances through a state machine:

```
IDLE → TOPICS_SENT → TOPIC_SELECTED → DRAFT_SENT → APPROVED → PUBLISHED
```

1. **Research** — 8 parallel web searches across TechCrunch, The Verge, Ars Technica, ZDNet, Wired, Reuters Tech, and TechRadar. Claude (acting as a senior technology research analyst) curates 5 enterprise-focused topic suggestions covering AI agents, cybersecurity, GenAI governance, and financial services impact.
2. **Topic Selection** — Owner receives an email with 5 one-click topic links and selects one.
3. **Writing** — Writer agent runs 3 targeted searches on the chosen topic; Claude writes a 500–800 word HTML blog post and injects a relevant Wikipedia image.
4. **Approval** — Owner receives a draft preview email with approve/reject buttons.
5. **Publishing** — Post is inserted into the database, ISR revalidation triggers on `/`, `/blog`, and the new post's slug, and a confirmation email with the live URL is sent.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14.2 (App Router) + TypeScript |
| Database | Supabase (PostgreSQL + RLS) |
| AI | Claude Sonnet 4.6 (Anthropic) |
| Search | Tavily API |
| Email | Resend + React Email |
| Styling | Tailwind CSS |
| Hosting | Vercel |
| Cron | GitHub Actions (hourly) |

## Project Structure

```
app/                  # Next.js app router — pages, API routes
lib/
  agents/             # research-agent, writer-agent, publisher-agent
  workflow/           # state-machine orchestrator
  services/           # email (Resend) + search (Tavily)
  supabase/           # DB client
components/           # React UI (blog, admin, comments)
emails/               # React Email templates
scripts/              # Local test runners
types/                # TypeScript interfaces
```

## Environment Variables

Copy `.env.local.example` to `.env.local` and fill in the values:

```bash
cp .env.local.example .env.local
```

| Variable | Description |
|---|---|
| `ANTHROPIC_API_KEY` | Claude API key |
| `TAVILY_API_KEY` | Tavily web search key |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (full DB access) |
| `NEXT_PUBLIC_SUPABASE_URL` | Public Supabase URL (browser) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (browser) |
| `RESEND_API_KEY` | Resend email key |
| `OWNER_EMAIL` | Recipient for topic/draft/publish emails |
| `SITE_URL` | Production domain (used in email links + ISR) |
| `CRON_SECRET` | Bearer token securing the cron endpoint |

## Local Development

```bash
npm install
npm run dev        # Start dev server at http://localhost:3000
```

### Test the research agent locally

```bash
npx tsx scripts/test-research-agent.ts
```

### Manually trigger the full workflow cron

```bash
npx tsx scripts/run-cron.ts --force
```

`--force` bypasses the daily schedule check. The cron advances whatever state the workflow is currently in (starts research, writes draft, or publishes — one step per invocation).

## Admin

Visit `/admin` to manually create, edit, and publish posts.

## Database

Schema files are in the repo root:
- `supabase-migrations.sql` — posts and workflow_runs tables
- `supabase-comments.sql` — comments table with OAuth user fields
