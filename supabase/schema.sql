create extension if not exists "pgcrypto";

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  product_url text,
  product_description text,
  target_audience text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.scripts (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  hook_variations jsonb not null default '[]'::jsonb,
  body_text text not null,
  cta_text text not null,
  selected_hook integer,
  voice_id text,
  created_at timestamptz not null default timezone('utc', now())
);

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'video_status'
  ) then
    create type public.video_status as enum ('pending', 'processing', 'completed', 'failed');
  end if;
end $$;

create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  script_id uuid references public.scripts(id) on delete set null,
  status public.video_status not null default 'pending',
  video_url text,
  thumbnail_url text,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.projects enable row level security;
alter table public.scripts enable row level security;
alter table public.videos enable row level security;

drop policy if exists "Users can view their own projects" on public.projects;
create policy "Users can view their own projects"
on public.projects
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own projects" on public.projects;
create policy "Users can insert their own projects"
on public.projects
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own projects" on public.projects;
create policy "Users can update their own projects"
on public.projects
for update
using (auth.uid() = user_id);

drop policy if exists "Users can view scripts for their own projects" on public.scripts;
create policy "Users can view scripts for their own projects"
on public.scripts
for select
using (
  exists (
    select 1
    from public.projects
    where projects.id = scripts.project_id
      and projects.user_id = auth.uid()
  )
);

drop policy if exists "Users can insert scripts for their own projects" on public.scripts;
create policy "Users can insert scripts for their own projects"
on public.scripts
for insert
with check (
  exists (
    select 1
    from public.projects
    where projects.id = scripts.project_id
      and projects.user_id = auth.uid()
  )
);

drop policy if exists "Users can update scripts for their own projects" on public.scripts;
create policy "Users can update scripts for their own projects"
on public.scripts
for update
using (
  exists (
    select 1
    from public.projects
    where projects.id = scripts.project_id
      and projects.user_id = auth.uid()
  )
);

drop policy if exists "Users can view videos for their own projects" on public.videos;
create policy "Users can view videos for their own projects"
on public.videos
for select
using (
  exists (
    select 1
    from public.projects
    where projects.id = videos.project_id
      and projects.user_id = auth.uid()
  )
);

drop policy if exists "Users can insert videos for their own projects" on public.videos;
create policy "Users can insert videos for their own projects"
on public.videos
for insert
with check (
  exists (
    select 1
    from public.projects
    where projects.id = videos.project_id
      and projects.user_id = auth.uid()
  )
);

drop policy if exists "Users can update videos for their own projects" on public.videos;
create policy "Users can update videos for their own projects"
on public.videos
for update
using (
  exists (
    select 1
    from public.projects
    where projects.id = videos.project_id
      and projects.user_id = auth.uid()
  )
);
