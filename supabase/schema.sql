-- ============================================================
-- CineList — Supabase schema + RLS
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ----------------------------------------------------------------
-- profiles
-- ----------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  username    text not null unique,
  avatar_url  text,
  bio         text,
  created_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can insert their own profile"
  on public.profiles for insert with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'username',
      split_part(new.email, '@', 1)
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ----------------------------------------------------------------
-- media
-- ----------------------------------------------------------------
create table if not exists public.media (
  id           uuid primary key default uuid_generate_v4(),
  tmdb_id      integer not null,
  title        text not null,
  type         text not null check (type in ('movie', 'series')),
  poster_url   text,
  release_year integer,
  genres       text[] not null default '{}',
  overview     text,
  created_at   timestamptz not null default now(),
  unique (tmdb_id, type)
);

alter table public.media enable row level security;
create policy "Media is viewable by everyone" on public.media for select using (true);
create policy "Authenticated users can insert media" on public.media for insert with check (auth.uid() is not null);

-- ----------------------------------------------------------------
-- entries
-- ----------------------------------------------------------------
create table if not exists public.entries (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  media_id     uuid not null references public.media(id) on delete cascade,
  status       text not null check (status in ('watching','completed','plan_to_watch','dropped')),
  rating       integer check (rating >= 1 and rating <= 10),
  review_text  text,
  watched_at   timestamptz,
  created_at   timestamptz not null default now(),
  unique (user_id, media_id)
);

alter table public.entries enable row level security;

create policy "Entries are viewable by everyone"
  on public.entries for select using (true);

create policy "Users can insert their own entries"
  on public.entries for insert with check (auth.uid() = user_id);

create policy "Users can update their own entries"
  on public.entries for update using (auth.uid() = user_id);

create policy "Users can delete their own entries"
  on public.entries for delete using (auth.uid() = user_id);

-- ----------------------------------------------------------------
-- comments
-- ----------------------------------------------------------------
create table if not exists public.comments (
  id         uuid primary key default uuid_generate_v4(),
  entry_id   uuid not null references public.entries(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  text       text not null,
  created_at timestamptz not null default now()
);

alter table public.comments enable row level security;

create policy "Comments are viewable by everyone"
  on public.comments for select using (true);

create policy "Users can insert their own comments"
  on public.comments for insert with check (auth.uid() = user_id);

create policy "Users can delete their own comments"
  on public.comments for delete using (auth.uid() = user_id);

-- ----------------------------------------------------------------
-- follows
-- ----------------------------------------------------------------
create table if not exists public.follows (
  follower_id  uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

alter table public.follows enable row level security;

create policy "Follows are viewable by everyone"
  on public.follows for select using (true);

create policy "Users can follow others"
  on public.follows for insert with check (auth.uid() = follower_id);

create policy "Users can unfollow"
  on public.follows for delete using (auth.uid() = follower_id);

-- ----------------------------------------------------------------
-- tags
-- ----------------------------------------------------------------
create table if not exists public.tags (
  id   uuid primary key default uuid_generate_v4(),
  name text not null unique
);

alter table public.tags enable row level security;
create policy "Tags are viewable by everyone" on public.tags for select using (true);
create policy "Authenticated users can create tags" on public.tags for insert with check (auth.uid() is not null);

-- ----------------------------------------------------------------
-- entry_tags
-- ----------------------------------------------------------------
create table if not exists public.entry_tags (
  entry_id uuid not null references public.entries(id) on delete cascade,
  tag_id   uuid not null references public.tags(id) on delete cascade,
  primary key (entry_id, tag_id)
);

alter table public.entry_tags enable row level security;
create policy "Entry tags are viewable by everyone" on public.entry_tags for select using (true);
create policy "Users can manage their entry tags"
  on public.entry_tags for insert
  with check (
    auth.uid() = (select user_id from public.entries where id = entry_id)
  );
create policy "Users can delete their entry tags"
  on public.entry_tags for delete
  using (
    auth.uid() = (select user_id from public.entries where id = entry_id)
  );

-- ----------------------------------------------------------------
-- Storage: avatars bucket
-- ----------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "Avatar images are publicly accessible"
  on storage.objects for select using (bucket_id = 'avatars');

create policy "Users can upload their own avatar"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can update their own avatar"
  on storage.objects for update
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can delete their own avatar"
  on storage.objects for delete
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
