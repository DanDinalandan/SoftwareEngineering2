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
  timezone text not null default 'UTC',
  streak integer not null default 0,
  days_logged integer not null default 0,
  total_points integer not null default 0,
  last_relapse_risk integer not null default 0 check (last_relapse_risk between 0 and 100),
  profile_complete boolean not null default false,
  connected_peer_user_id uuid references public.app_users(id) on delete set null,
  connected_vape_user_id uuid references public.app_users(id) on delete set null,
  connected_peer_username text,
  connected_vape_user_username text,
  connected_provider_name text,
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
  notification_preferences jsonb not null default '{"highRiskAlerts":true,"dailyReports":true,"patientMessages":true,"connectionRequests":true}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.providers add column if not exists notification_preferences jsonb not null default '{"highRiskAlerts":true,"dailyReports":true,"patientMessages":true,"connectionRequests":true}'::jsonb;

create table if not exists public.mood_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  log_date date not null,
  mood text not null check (mood in ('Awful', 'Bad', 'Okay', 'Good', 'Great')),
  triggers text[] not null default '{}',
  craving integer not null check (craving between 0 and 10),
  vaped boolean not null default false,
  puffs_today integer not null default 0,
  vape_minutes integer not null default 0,
  vaped_sessions jsonb not null default '[]'::jsonb,
  vaped_hour text,
  comment text not null default '',
  relapse_risk integer not null check (relapse_risk between 0 and 100),
  points integer not null default 0,
  device_timezone text not null default 'UTC',
  local_logged_at text not null default '',
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
  subject text,
  text text not null,
  read_by_provider boolean not null default false,
  device_timezone text not null default 'UTC',
  local_sent_at text not null default '',
  display_timestamp text not null default '',
  created_at timestamptz not null default now()
);

alter table public.messages add column if not exists subject text;
alter table public.messages add column if not exists read_by_provider boolean not null default false;

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  to_user_id uuid not null references public.app_users(id) on delete cascade,
  from_user_id uuid references public.app_users(id) on delete set null,
  type text not null,
  title text,
  icon text,
  message text not null,
  request_id uuid references public.connection_requests(id) on delete set null,
  provider_request_id uuid,
  to_provider_id uuid references public.providers(id) on delete cascade,
  from_provider_id uuid references public.providers(id) on delete set null,
  from_display_name text,
  read boolean not null default false,
  display_timestamp text not null default '',
  created_at timestamptz not null default now()
);

alter table public.app_users add column if not exists timezone text not null default 'UTC';
alter table public.app_users add column if not exists connected_provider_id uuid references public.providers(id) on delete set null;
alter table public.app_users add column if not exists connected_provider_name text;
alter table public.mood_logs add column if not exists vape_minutes integer not null default 0;
alter table public.mood_logs add column if not exists vaped_sessions jsonb not null default '[]'::jsonb;
alter table public.mood_logs add column if not exists device_timezone text not null default 'UTC';
alter table public.mood_logs add column if not exists local_logged_at text not null default '';
alter table public.messages add column if not exists device_timezone text not null default 'UTC';
alter table public.messages add column if not exists local_sent_at text not null default '';

alter table public.notifications add column if not exists title text;
alter table public.notifications add column if not exists icon text;
alter table public.notifications add column if not exists provider_request_id uuid;
alter table public.notifications add column if not exists to_provider_id uuid references public.providers(id) on delete cascade;
alter table public.notifications add column if not exists from_provider_id uuid references public.providers(id) on delete set null;

alter table public.app_users add column if not exists days_logged integer not null default 0;

update public.app_users users
set days_logged = logs.total_logs
from (
  select user_id, count(*)::integer as total_logs
  from public.mood_logs
  group by user_id
) logs
where users.id = logs.user_id;

create table if not exists public.user_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.app_users(id) on delete cascade,
  label text not null default '',
  daily_puff_limit integer,
  weekly_goal text not null default '',
  color text not null default '',
  raw_goal jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reward_goals (
  id text primary key,
  name text not null,
  description text not null default '',
  icon_key text not null default '',
  points_required integer not null default 0,
  criteria jsonb not null,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_reward_goals (
  user_id uuid not null references public.app_users(id) on delete cascade,
  reward_goal_id text not null references public.reward_goals(id) on delete cascade,
  progress integer not null default 0,
  unlocked boolean not null default false,
  unlocked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, reward_goal_id)
);

create table if not exists public.provider_messages (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers(id) on delete cascade,
  to_user_id uuid not null references public.app_users(id) on delete cascade,
  original_message_id uuid references public.messages(id) on delete set null,
  subject text,
  text text not null,
  read_by_user boolean not null default false,
  display_timestamp text not null default '',
  created_at timestamptz not null default now()
);

alter table public.provider_messages add column if not exists subject text;
alter table public.provider_messages add column if not exists read_by_user boolean not null default false;

create table if not exists public.provider_patient_requests (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers(id) on delete cascade,
  vape_user_id uuid not null references public.app_users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists provider_patient_requests_one_pending_idx
  on public.provider_patient_requests (provider_id, vape_user_id)
  where status = 'pending';

create table if not exists public.provider_patient_connections (
  provider_id uuid not null references public.providers(id) on delete cascade,
  vape_user_id uuid not null references public.app_users(id) on delete cascade,
  active boolean not null default true,
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (provider_id, vape_user_id)
);

alter table public.notifications
  add constraint notifications_provider_request_fk
  foreign key (provider_request_id)
  references public.provider_patient_requests(id)
  on delete set null;

create table if not exists public.clinical_cessation_patterns (
  id integer primary key,
  age_range text not null default '',
  gender text not null default '',
  years_smoking text not null default '',
  time_to_first_smoke text not null default '',
  past_quit_attempts text not null default '',
  longest_smoke_free_period text not null default '',
  stress_anxiety_trigger integer not null check (stress_anxiety_trigger between 1 and 5),
  emotion_management integer not null check (emotion_management between 1 and 5),
  concentration_difficulty integer not null check (concentration_difficulty between 1 and 5),
  craving_intensity integer not null check (craving_intensity between 1 and 5),
  social_pressure_trigger integer not null check (social_pressure_trigger between 1 and 5),
  stress_confidence integer not null check (stress_confidence between 1 and 5),
  quit_motivation integer not null check (quit_motivation between 1 and 5),
  early_relapse_history text not null default '',
  main_relapse_reason text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.ai_prompt_templates (
  id uuid primary key default gen_random_uuid(),
  template_key text not null unique,
  description text not null default '',
  prompt text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  recommendation_type text not null check (recommendation_type in ('dashboard', 'weekly_report')),
  prompt_template_id uuid references public.ai_prompt_templates(id) on delete set null,
  clinical_match_ids integer[] not null default '{}',
  source text not null default 'rules',
  payload jsonb not null default '{}'::jsonb,
  response jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.motivational_quotes (
  id uuid primary key default gen_random_uuid(),
  quote text not null unique,
  category text not null default 'general',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.user_daily_quotes (
  user_id uuid not null references public.app_users(id) on delete cascade,
  quote_date date not null,
  quote_id uuid not null references public.motivational_quotes(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, quote_date)
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
create index if not exists notifications_provider_created_idx on public.notifications (to_provider_id, created_at desc);
create index if not exists otp_codes_user_created_idx on public.otp_codes (user_id, created_at desc);
create index if not exists provider_messages_provider_created_idx on public.provider_messages (provider_id, created_at desc);
create index if not exists provider_patient_connections_provider_idx on public.provider_patient_connections (provider_id, active);
create unique index if not exists provider_patient_connections_one_active_user_idx
  on public.provider_patient_connections (vape_user_id)
  where active = true;
create index if not exists provider_patient_requests_user_status_idx on public.provider_patient_requests (vape_user_id, status);
create index if not exists user_reward_goals_user_idx on public.user_reward_goals (user_id);
create index if not exists reward_goals_active_sort_idx on public.reward_goals (active, sort_order);
create index if not exists clinical_patterns_relapse_reason_idx on public.clinical_cessation_patterns (main_relapse_reason);
create index if not exists ai_recommendations_user_created_idx on public.ai_recommendations (user_id, created_at desc);
create index if not exists ai_prompt_templates_key_idx on public.ai_prompt_templates (template_key, active);

alter table public.app_users enable row level security;
alter table public.providers enable row level security;
alter table public.mood_logs enable row level security;
alter table public.connection_requests enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;
alter table public.user_goals enable row level security;
alter table public.reward_goals enable row level security;
alter table public.user_reward_goals enable row level security;
alter table public.otp_codes enable row level security;
alter table public.provider_messages enable row level security;
alter table public.provider_patient_requests enable row level security;
alter table public.provider_patient_connections enable row level security;
alter table public.clinical_cessation_patterns enable row level security;
alter table public.ai_prompt_templates enable row level security;
alter table public.ai_recommendations enable row level security;
alter table public.motivational_quotes enable row level security;
alter table public.user_daily_quotes enable row level security;
