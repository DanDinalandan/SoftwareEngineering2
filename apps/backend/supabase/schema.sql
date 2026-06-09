create extension if not exists pgcrypto;

create table if not exists public.app_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  username text not null unique,
  password_hash text not null,
  role text not null default '' check (role in ('', 'Vape User', 'Peer')),
  first_name text not null default '',
  last_name text not null default '',
  middle_name text not null default '',
  suffix text not null default '',
  birthday text not null default '',
  age integer,
  gender text not null default '',
  phone text not null default '',
  streak integer not null default 0,
  total_points integer not null default 0,
  last_relapse_risk integer not null default 0 check (last_relapse_risk between 0 and 100),
  profile_complete boolean not null default false,
  connected_peer_user_id uuid references public.app_users(id) on delete set null,
  connected_vape_user_id uuid references public.app_users(id) on delete set null,
  connected_peer_username text,
  connected_vape_user_username text,
  peer_relationship text,
  progress_shared_with_peer boolean not null default false,
  vape_user_relationship_label text,
  vape_types text[] not null default '{}',
  goal jsonb,
  two_fa_enabled boolean not null default false,
  unlocked_rewards text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.providers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  first_name text not null default '',
  last_name text not null default '',
  middle_name text not null default '',
  suffix text not null default '',
  gender text not null default '',
  dob date,
  license text not null unique,
  department text not null default 'Cessation Clinic',
  phone text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mood_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  log_date date not null,
  mood text not null check (mood in ('Awful', 'Bad', 'Okay', 'Good', 'Great')),
  triggers text[] not null default '{}',
  craving integer not null check (craving between 0 and 10),
  vaped boolean not null default false,
  puffs_today integer not null default 0,
  vaped_hour text,
  comment text not null default '',
  relapse_risk integer not null check (relapse_risk between 0 and 100),
  points integer not null default 0,
  display_timestamp text not null default '',
  created_at timestamptz not null default now(),
  unique (user_id, log_date)
);

create table if not exists public.connection_requests (
  id uuid primary key default gen_random_uuid(),
  from_user_id uuid not null references public.app_users(id) on delete cascade,
  to_user_id uuid not null references public.app_users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz not null default now()
);

create unique index if not exists connection_requests_one_pending_idx
  on public.connection_requests (from_user_id, to_user_id)
  where status = 'pending';

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  from_user_id uuid not null references public.app_users(id) on delete cascade,
  to_user_id uuid not null references public.app_users(id) on delete cascade,
  text text not null,
  display_timestamp text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  to_user_id uuid not null references public.app_users(id) on delete cascade,
  from_user_id uuid references public.app_users(id) on delete set null,
  type text not null,
  message text not null,
  request_id uuid references public.connection_requests(id) on delete set null,
  from_display_name text,
  read boolean not null default false,
  display_timestamp text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.otp_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  phone text not null,
  code_hash text not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists mood_logs_user_date_idx on public.mood_logs (user_id, log_date desc);
create index if not exists messages_conversation_idx on public.messages (from_user_id, to_user_id, created_at);
create index if not exists notifications_user_created_idx on public.notifications (to_user_id, created_at desc);
create index if not exists otp_codes_user_created_idx on public.otp_codes (user_id, created_at desc);

alter table public.app_users enable row level security;
alter table public.providers enable row level security;
alter table public.mood_logs enable row level security;
alter table public.connection_requests enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;
alter table public.otp_codes enable row level security;
