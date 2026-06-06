create extension if not exists pgcrypto with schema extensions;

create schema if not exists app_private;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  plan text not null default 'starter',
  settings jsonb not null default '{}'::jsonb,
  status text not null default 'active' check (status in ('active', 'suspended', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  email text not null,
  name text not null,
  phone text,
  role text not null default 'member' check (role in ('platform_admin', 'operator', 'leader', 'member')),
  language_preference text not null default 'zh' check (language_preference in ('zh', 'en', 'ms')),
  status text not null default 'pending' check (status in ('pending', 'active', 'suspended')),
  avatar_url text,
  bio text,
  metadata jsonb not null default '{}'::jsonb,
  onboarding_completed boolean not null default false,
  sponsor_id uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (tenant_id, email)
);

create table public.tags (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  color text not null default '#6366f1',
  created_at timestamptz not null default now(),
  unique (tenant_id, name)
);

create table public.pipeline_stages (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  stage_order integer not null,
  color text not null default '#6366f1',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, name),
  unique (tenant_id, stage_order)
);

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  owner_id uuid not null references public.users(id) on delete restrict,
  name text not null,
  phone text,
  email text,
  source text,
  pipeline_stage text not null default 'new',
  score integer not null default 0 check (score >= 0 and score <= 100),
  notes_text text,
  metadata jsonb not null default '{}'::jsonb,
  last_contacted timestamptz,
  next_followup timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.lead_tags (
  lead_id uuid not null references public.leads(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (lead_id, tag_id)
);

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete restrict,
  content text not null,
  created_at timestamptz not null default now()
);

create table public.activities (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete set null,
  user_id uuid not null references public.users(id) on delete restrict,
  type text not null,
  description text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.funnel_templates (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  type text not null,
  config jsonb not null default '{}'::jsonb,
  thumbnail text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.funnels (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  owner_id uuid not null references public.users(id) on delete restrict,
  template_id uuid references public.funnel_templates(id) on delete set null,
  title text not null,
  slug text not null unique,
  config jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  published_at timestamptz,
  views integer not null default 0,
  conversions integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.ai_prompt_templates (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  category text not null,
  prompt text not null,
  variables jsonb not null default '[]'::jsonb,
  language text not null default 'zh' check (language in ('zh', 'en', 'ms')),
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.ai_usage_logs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete restrict,
  provider text not null,
  model text not null,
  category text not null,
  tokens_in integer not null default 0,
  tokens_out integer not null default 0,
  cost_usd numeric(12, 6) not null default 0,
  created_at timestamptz not null default now()
);

create table public.whatsapp_sequences (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  trigger text not null,
  steps jsonb not null default '[]'::jsonb,
  status text not null default 'active' check (status in ('active', 'paused', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.scheduled_messages (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete restrict,
  channel text not null default 'whatsapp',
  message text not null,
  scheduled_at timestamptz not null,
  sent_at timestamptz,
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed', 'cancelled')),
  created_at timestamptz not null default now()
);

create table public.daily_actions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  date date not null,
  type text not null,
  description text not null,
  completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.training_progress (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  module_id text not null,
  module_name text not null,
  status text not null default 'not_started' check (status in ('not_started', 'in_progress', 'completed')),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, module_id)
);

create table public.contents (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  owner_id uuid not null references public.users(id) on delete restrict,
  type text not null,
  platform text,
  body text not null,
  language text not null default 'zh' check (language in ('zh', 'en', 'ms')),
  generated_by_ai boolean not null default false,
  prompt_used text,
  created_at timestamptz not null default now()
);

create table public.voice_profiles (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  audio_url text not null,
  transcript text,
  extracted_data jsonb,
  status text not null default 'uploaded' check (status in ('uploaded', 'transcribed', 'extracted', 'reviewed', 'deleted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid references public.users(id) on delete set null,
  lead_id uuid references public.leads(id) on delete set null,
  funnel_id uuid references public.funnels(id) on delete set null,
  event_name text not null,
  properties jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index users_tenant_id_idx on public.users (tenant_id);
create index users_sponsor_id_idx on public.users (sponsor_id);
create index tags_tenant_id_idx on public.tags (tenant_id);
create index pipeline_stages_tenant_order_idx on public.pipeline_stages (tenant_id, stage_order);
create index leads_tenant_id_idx on public.leads (tenant_id);
create index leads_owner_id_idx on public.leads (owner_id);
create index leads_tenant_stage_idx on public.leads (tenant_id, pipeline_stage);
create index leads_tenant_score_idx on public.leads (tenant_id, score);
create index leads_next_followup_idx on public.leads (next_followup);
create index notes_lead_id_idx on public.notes (lead_id);
create index activities_tenant_id_idx on public.activities (tenant_id);
create index activities_lead_id_idx on public.activities (lead_id);
create index activities_user_id_idx on public.activities (user_id);
create index activities_created_at_idx on public.activities (created_at);
create index funnel_templates_tenant_id_idx on public.funnel_templates (tenant_id);
create index funnels_tenant_id_idx on public.funnels (tenant_id);
create index funnels_slug_idx on public.funnels (slug);
create index ai_prompt_templates_tenant_category_idx on public.ai_prompt_templates (tenant_id, category);
create index ai_usage_logs_tenant_created_idx on public.ai_usage_logs (tenant_id, created_at);
create index ai_usage_logs_tenant_user_idx on public.ai_usage_logs (tenant_id, user_id);
create index whatsapp_sequences_tenant_id_idx on public.whatsapp_sequences (tenant_id);
create index scheduled_messages_status_scheduled_idx on public.scheduled_messages (status, scheduled_at);
create index scheduled_messages_tenant_id_idx on public.scheduled_messages (tenant_id);
create index daily_actions_user_date_idx on public.daily_actions (user_id, date);
create index daily_actions_tenant_date_idx on public.daily_actions (tenant_id, date);
create index training_progress_tenant_id_idx on public.training_progress (tenant_id);
create index contents_tenant_id_idx on public.contents (tenant_id);
create index contents_owner_id_idx on public.contents (owner_id);
create index voice_profiles_tenant_id_idx on public.voice_profiles (tenant_id);
create index voice_profiles_user_id_idx on public.voice_profiles (user_id);
create index analytics_events_tenant_created_idx on public.analytics_events (tenant_id, created_at);
create index analytics_events_name_created_idx on public.analytics_events (event_name, created_at);

create trigger set_tenants_updated_at before update on public.tenants for each row execute function public.set_updated_at();
create trigger set_users_updated_at before update on public.users for each row execute function public.set_updated_at();
create trigger set_pipeline_stages_updated_at before update on public.pipeline_stages for each row execute function public.set_updated_at();
create trigger set_leads_updated_at before update on public.leads for each row execute function public.set_updated_at();
create trigger set_funnel_templates_updated_at before update on public.funnel_templates for each row execute function public.set_updated_at();
create trigger set_funnels_updated_at before update on public.funnels for each row execute function public.set_updated_at();
create trigger set_ai_prompt_templates_updated_at before update on public.ai_prompt_templates for each row execute function public.set_updated_at();
create trigger set_whatsapp_sequences_updated_at before update on public.whatsapp_sequences for each row execute function public.set_updated_at();
create trigger set_voice_profiles_updated_at before update on public.voice_profiles for each row execute function public.set_updated_at();

create or replace function app_private.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.users where id = auth.uid() and deleted_at is null limit 1
$$;

create or replace function app_private.current_user_tenant_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select tenant_id from public.users where id = auth.uid() and deleted_at is null limit 1
$$;

create or replace function app_private.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(app_private.current_user_role() = 'platform_admin', false)
$$;

create or replace function app_private.is_operator_or_leader()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(app_private.current_user_role() in ('platform_admin', 'operator', 'leader'), false)
$$;

grant usage on schema public to anon, authenticated;
grant usage on schema app_private to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant select on public.funnels to anon;
grant execute on all functions in schema app_private to authenticated;

alter table public.tenants enable row level security;
alter table public.users enable row level security;
alter table public.tags enable row level security;
alter table public.pipeline_stages enable row level security;
alter table public.leads enable row level security;
alter table public.lead_tags enable row level security;
alter table public.notes enable row level security;
alter table public.activities enable row level security;
alter table public.funnel_templates enable row level security;
alter table public.funnels enable row level security;
alter table public.ai_prompt_templates enable row level security;
alter table public.ai_usage_logs enable row level security;
alter table public.whatsapp_sequences enable row level security;
alter table public.scheduled_messages enable row level security;
alter table public.daily_actions enable row level security;
alter table public.training_progress enable row level security;
alter table public.contents enable row level security;
alter table public.voice_profiles enable row level security;
alter table public.analytics_events enable row level security;

create policy tenants_select_same_tenant_or_admin on public.tenants
  for select to authenticated
  using (id = app_private.current_user_tenant_id() or app_private.is_platform_admin());

create policy tenants_update_operator_or_admin on public.tenants
  for update to authenticated
  using (id = app_private.current_user_tenant_id() and app_private.current_user_role() in ('operator', 'platform_admin'))
  with check (id = app_private.current_user_tenant_id() or app_private.is_platform_admin());

create policy users_select_same_tenant_or_self on public.users
  for select to authenticated
  using (tenant_id = app_private.current_user_tenant_id() or id = auth.uid() or app_private.is_platform_admin());

create policy users_insert_own_profile on public.users
  for insert to authenticated
  with check (id = auth.uid());

create policy users_update_self_or_operator on public.users
  for update to authenticated
  using (
    id = auth.uid()
    or (tenant_id = app_private.current_user_tenant_id() and app_private.current_user_role() in ('operator', 'platform_admin'))
    or app_private.is_platform_admin()
  )
  with check (
    id = auth.uid()
    or (tenant_id = app_private.current_user_tenant_id() and app_private.current_user_role() in ('operator', 'platform_admin'))
    or app_private.is_platform_admin()
  );

create policy tenant_scoped_tags_all on public.tags
  for all to authenticated
  using (tenant_id = app_private.current_user_tenant_id() or app_private.is_platform_admin())
  with check (tenant_id = app_private.current_user_tenant_id() or app_private.is_platform_admin());

create policy tenant_scoped_pipeline_stages_all on public.pipeline_stages
  for all to authenticated
  using (tenant_id = app_private.current_user_tenant_id() or app_private.is_platform_admin())
  with check (tenant_id = app_private.current_user_tenant_id() or app_private.is_platform_admin());

create policy leads_select_same_tenant on public.leads
  for select to authenticated
  using (tenant_id = app_private.current_user_tenant_id() or app_private.is_platform_admin());

create policy leads_insert_same_tenant on public.leads
  for insert to authenticated
  with check (tenant_id = app_private.current_user_tenant_id() or app_private.is_platform_admin());

create policy leads_update_owner_or_leadership on public.leads
  for update to authenticated
  using (
    owner_id = auth.uid()
    or (tenant_id = app_private.current_user_tenant_id() and app_private.is_operator_or_leader())
    or app_private.is_platform_admin()
  )
  with check (
    tenant_id = app_private.current_user_tenant_id()
    or app_private.is_platform_admin()
  );

create policy leads_delete_operator_or_admin on public.leads
  for delete to authenticated
  using (
    (tenant_id = app_private.current_user_tenant_id() and app_private.current_user_role() in ('operator', 'platform_admin'))
    or app_private.is_platform_admin()
  );

create policy lead_tags_same_tenant_all on public.lead_tags
  for all to authenticated
  using (
    exists (
      select 1 from public.leads
      where leads.id = lead_tags.lead_id
        and (leads.tenant_id = app_private.current_user_tenant_id() or app_private.is_platform_admin())
    )
  )
  with check (
    exists (
      select 1 from public.leads
      where leads.id = lead_tags.lead_id
        and (leads.tenant_id = app_private.current_user_tenant_id() or app_private.is_platform_admin())
    )
  );

create policy notes_same_tenant_all on public.notes
  for all to authenticated
  using (
    exists (
      select 1 from public.leads
      where leads.id = notes.lead_id
        and (leads.tenant_id = app_private.current_user_tenant_id() or app_private.is_platform_admin())
    )
  )
  with check (
    exists (
      select 1 from public.leads
      where leads.id = notes.lead_id
        and (leads.tenant_id = app_private.current_user_tenant_id() or app_private.is_platform_admin())
    )
  );

create policy tenant_scoped_activities_all on public.activities
  for all to authenticated
  using (tenant_id = app_private.current_user_tenant_id() or app_private.is_platform_admin())
  with check (tenant_id = app_private.current_user_tenant_id() or app_private.is_platform_admin());

create policy tenant_scoped_funnel_templates_all on public.funnel_templates
  for all to authenticated
  using (tenant_id = app_private.current_user_tenant_id() or app_private.is_platform_admin())
  with check (tenant_id = app_private.current_user_tenant_id() or app_private.is_platform_admin());

create policy funnels_public_published_select on public.funnels
  for select to anon
  using (status = 'published');

create policy tenant_scoped_funnels_all on public.funnels
  for all to authenticated
  using (tenant_id = app_private.current_user_tenant_id() or app_private.is_platform_admin())
  with check (tenant_id = app_private.current_user_tenant_id() or app_private.is_platform_admin());

create policy tenant_scoped_ai_prompt_templates_all on public.ai_prompt_templates
  for all to authenticated
  using (tenant_id = app_private.current_user_tenant_id() or app_private.is_platform_admin())
  with check (tenant_id = app_private.current_user_tenant_id() or app_private.is_platform_admin());

create policy tenant_scoped_ai_usage_logs_all on public.ai_usage_logs
  for all to authenticated
  using (tenant_id = app_private.current_user_tenant_id() or app_private.is_platform_admin())
  with check (tenant_id = app_private.current_user_tenant_id() or app_private.is_platform_admin());

create policy tenant_scoped_whatsapp_sequences_all on public.whatsapp_sequences
  for all to authenticated
  using (tenant_id = app_private.current_user_tenant_id() or app_private.is_platform_admin())
  with check (tenant_id = app_private.current_user_tenant_id() or app_private.is_platform_admin());

create policy tenant_scoped_scheduled_messages_all on public.scheduled_messages
  for all to authenticated
  using (tenant_id = app_private.current_user_tenant_id() or app_private.is_platform_admin())
  with check (tenant_id = app_private.current_user_tenant_id() or app_private.is_platform_admin());

create policy daily_actions_same_tenant_or_self_all on public.daily_actions
  for all to authenticated
  using (
    user_id = auth.uid()
    or tenant_id = app_private.current_user_tenant_id()
    or app_private.is_platform_admin()
  )
  with check (
    user_id = auth.uid()
    or tenant_id = app_private.current_user_tenant_id()
    or app_private.is_platform_admin()
  );

create policy training_progress_same_tenant_or_self_all on public.training_progress
  for all to authenticated
  using (
    user_id = auth.uid()
    or tenant_id = app_private.current_user_tenant_id()
    or app_private.is_platform_admin()
  )
  with check (
    user_id = auth.uid()
    or tenant_id = app_private.current_user_tenant_id()
    or app_private.is_platform_admin()
  );

create policy contents_same_tenant_or_owner_all on public.contents
  for all to authenticated
  using (
    owner_id = auth.uid()
    or tenant_id = app_private.current_user_tenant_id()
    or app_private.is_platform_admin()
  )
  with check (
    owner_id = auth.uid()
    or tenant_id = app_private.current_user_tenant_id()
    or app_private.is_platform_admin()
  );

create policy voice_profiles_same_tenant_or_owner_all on public.voice_profiles
  for all to authenticated
  using (
    user_id = auth.uid()
    or tenant_id = app_private.current_user_tenant_id()
    or app_private.is_platform_admin()
  )
  with check (
    user_id = auth.uid()
    or tenant_id = app_private.current_user_tenant_id()
    or app_private.is_platform_admin()
  );

create policy tenant_scoped_analytics_events_all on public.analytics_events
  for all to authenticated
  using (tenant_id = app_private.current_user_tenant_id() or app_private.is_platform_admin())
  with check (tenant_id = app_private.current_user_tenant_id() or app_private.is_platform_admin());
