-- ═══════════════════════════════════════════════════════════════════
-- Project Nexus — Initial Schema
-- ═══════════════════════════════════════════════════════════════════

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";
create extension if not exists "vector";

-- ── Enums ──────────────────────────────────────────────────────────
create type project_status as enum (
  'pending', 'crawling', 'analyzing', 'planning', 'mapping', 'ready', 'failed'
);

create type requirement_priority as enum ('p0','p1','p2','p3');
create type requirement_kind     as enum ('epic','story','spec','nfr');
create type task_status          as enum ('todo','in_progress','review','done','blocked');
create type component_registry   as enum ('shadcn','aceternity','magic_ui','tremor','custom');

-- ── projects ───────────────────────────────────────────────────────
create table projects (
  id            uuid primary key default uuid_generate_v4(),
  owner_id      uuid not null references auth.users(id) on delete cascade,
  name          text not null,
  source_url    text not null,
  status        project_status not null default 'pending',
  error         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index on projects(owner_id, created_at desc);

-- ── crawl_artifacts (one per crawl, JSONB for flexible extraction) ─
create table crawl_artifacts (
  id            uuid primary key default uuid_generate_v4(),
  project_id    uuid not null references projects(id) on delete cascade,
  dom_tree      jsonb not null,         -- component tree
  design_tokens jsonb not null,         -- { colors, typography, spacing, radii }
  seo           jsonb not null,         -- meta, OG, schema.org
  forms         jsonb not null,         -- detected form patterns
  screenshots   text[],                 -- storage URLs
  raw_markdown  text,                   -- Firecrawl output
  crawled_at    timestamptz not null default now()
);
create index on crawl_artifacts(project_id);

-- ── requirements (PRD, specs, stories — polymorphic by `kind`) ─────
create table requirements (
  id            uuid primary key default uuid_generate_v4(),
  project_id    uuid not null references projects(id) on delete cascade,
  parent_id     uuid references requirements(id) on delete cascade,
  kind          requirement_kind not null,
  title         text not null,
  body          text not null,            -- markdown or Gherkin
  priority      requirement_priority not null default 'p2',
  acceptance    jsonb,                    -- Gherkin scenarios as array
  embedding     vector(1536),             -- for component RAG
  created_at    timestamptz not null default now()
);
create index on requirements(project_id, kind);
create index on requirements using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- ── sprints ────────────────────────────────────────────────────────
create table sprints (
  id            uuid primary key default uuid_generate_v4(),
  project_id    uuid not null references projects(id) on delete cascade,
  number        int  not null,
  goal          text not null,
  starts_on     date not null,
  ends_on       date not null,
  capacity_pts  int  not null default 30,
  created_at    timestamptz not null default now(),
  unique(project_id, number)
);

-- ── tasks (implementation units tied to requirements) ──────────────
create table tasks (
  id              uuid primary key default uuid_generate_v4(),
  project_id      uuid not null references projects(id) on delete cascade,
  sprint_id       uuid references sprints(id) on delete set null,
  requirement_id  uuid references requirements(id) on delete cascade,
  title           text not null,
  description     text,
  story_points    int check (story_points in (1,2,3,5,8,13,21)),
  status          task_status not null default 'todo',
  assignee_id     uuid references auth.users(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index on tasks(project_id, status);
create index on tasks(sprint_id);

-- ── component_mappings (requirement → GitHub component) ────────────
create table component_mappings (
  id              uuid primary key default uuid_generate_v4(),
  requirement_id  uuid not null references requirements(id) on delete cascade,
  registry        component_registry not null,
  component_name  text not null,
  install_cmd     text,
  source_url      text,
  code_snippet    text,
  match_score     numeric(4,3),
  created_at      timestamptz not null default now()
);
create index on component_mappings(requirement_id);

-- ── sprint_artifacts (mermaid diagrams, burn-up, etc.) ─────────────
create table sprint_artifacts (
  id            uuid primary key default uuid_generate_v4(),
  project_id    uuid not null references projects(id) on delete cascade,
  kind          text not null,            -- 'mermaid_roadmap' | 'gantt' | etc.
  content       text not null,
  created_at    timestamptz not null default now()
);

-- ═══════════════════════════════════════════════════════════════════
-- Row Level Security
-- ═══════════════════════════════════════════════════════════════════

alter table projects            enable row level security;
alter table crawl_artifacts     enable row level security;
alter table requirements        enable row level security;
alter table sprints             enable row level security;
alter table tasks               enable row level security;
alter table component_mappings  enable row level security;
alter table sprint_artifacts    enable row level security;

create policy "own projects" on projects
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "own crawl"    on crawl_artifacts
  for all using (exists (select 1 from projects p where p.id = project_id and p.owner_id = auth.uid()));

create policy "own reqs"     on requirements
  for all using (exists (select 1 from projects p where p.id = project_id and p.owner_id = auth.uid()));

create policy "own sprints"  on sprints
  for all using (exists (select 1 from projects p where p.id = project_id and p.owner_id = auth.uid()));

create policy "own tasks"    on tasks
  for all using (exists (select 1 from projects p where p.id = project_id and p.owner_id = auth.uid()));

create policy "own mappings" on component_mappings
  for all using (exists (
    select 1 from requirements r
    join projects p on p.id = r.project_id
    where r.id = requirement_id and p.owner_id = auth.uid()
  ));

create policy "own artifacts" on sprint_artifacts
  for all using (exists (select 1 from projects p where p.id = project_id and p.owner_id = auth.uid()));

-- ── updated_at trigger ─────────────────────────────────────────────
create or replace function touch_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger t_projects_touch before update on projects
  for each row execute function touch_updated_at();
create trigger t_tasks_touch before update on tasks
  for each row execute function touch_updated_at();
