-- Run this in your Supabase SQL editor

create table video_projects (
  id uuid primary key default gen_random_uuid(),
  user_id text not null default 'ali',
  seed_idea text not null,
  status text default 'research',
  current_title text,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

create table title_suggestions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references video_projects(id) on delete cascade,
  title text not null,
  ctr_score numeric,
  search_volume integer,
  competition text,
  raw_data jsonb,
  selected boolean default false,
  created_at timestamp default now()
);

create table video_packages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references video_projects(id) on delete cascade,
  description text,
  tags text[],
  thumbnail_brief text,
  title_score numeric,
  created_at timestamp default now()
);

create table thumbnails (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references video_projects(id) on delete cascade,
  image_url text not null,
  engine text not null,
  prompt_used text,
  ctr_score numeric,
  selected boolean default false,
  created_at timestamp default now()
);

create index on title_suggestions(project_id);
create index on video_packages(project_id);
create index on thumbnails(project_id);

-- Storage bucket (run in Storage > New bucket)
-- Name: thumbnails
-- Public: true
