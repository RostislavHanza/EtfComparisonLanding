-- Run on a Supabase project. No production ETF data is fabricated or seeded.
create table public.etfs (
 ticker text primary key check (ticker ~ '^[A-Z0-9.-]{1,10}$'),
 name text not null, exchange text not null check (exchange = 'NYSE Arca'),
 tracked_index text not null, expense_ratio_percent numeric(9,6) not null check (expense_ratio_percent between 0 and 10),
 dividends text not null, description text not null,
 verified_at timestamptz not null check (verified_at <= now()), data_as_of date not null,
 sources jsonb not null check (jsonb_typeof(sources) = 'array' and jsonb_array_length(sources) >= 6),
 verified_by text not null, usage_review jsonb not null,
 published boolean not null default false
);
create table public.contacts (
 id uuid primary key default gen_random_uuid(), email text unique not null check(length(email) <= 254),
 created_at timestamptz not null default now()
);
create table public.comparisons (
 id uuid primary key, contact_id uuid not null references public.contacts(id) on delete cascade,
 tickers text[] not null check(cardinality(tickers) between 2 and 5),
 amount_halere bigint not null check(amount_halere between 0 and 1000000000),
 snapshot jsonb not null check(jsonb_typeof(snapshot) = 'array'),
 token_hash text unique not null check(token_hash ~ '^[a-f0-9]{64}$'),
 token_expires_at timestamptz not null, confirmed_at timestamptz,
 attribution jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.consent_records (
 id uuid primary key default gen_random_uuid(), contact_id uuid not null references public.contacts(id) on delete cascade,
 comparison_id uuid not null references public.comparisons(id) on delete cascade,
 marketing_granted boolean not null, text_version text not null, created_at timestamptz not null default now()
);
create table public.comparison_sessions (
 session_hash text primary key check(session_hash ~ '^[a-f0-9]{64}$'), comparison_id uuid not null references public.comparisons(id) on delete cascade,
 expires_at timestamptz not null
);
create table public.email_messages (
 comparison_id uuid primary key references public.comparisons(id) on delete cascade,
 provider_id text unique, status text not null default 'pending' check(status in ('pending','sent','delivered','failed','bounced','complained')),
 sent_at timestamptz, delivered_at timestamptz, failed_at timestamptz, created_at timestamptz not null default now()
);
create table public.webhook_receipts (event_id text primary key, received_at timestamptz not null default now());
create table public.funnel_events (
 id uuid primary key default gen_random_uuid(), name text not null check(name in ('landing_view','comparison_interacted','comparison_configured','form_started','lead_submit_attempt','lead_accepted','email_sent','email_confirmed','comparison_opened')),
 visit_id uuid, campaign text check(campaign in ('ad-a','ad-b','direct')), comparison_id uuid references public.comparisons(id) on delete cascade,
 created_at timestamptz not null default now(),
 check(visit_id is not null or comparison_id is not null)
);
create unique index event_once_per_visit on public.funnel_events(visit_id,name) where visit_id is not null and comparison_id is null;
create unique index event_once_per_comparison on public.funnel_events(comparison_id,name) where comparison_id is not null;
create table public.rate_limits (
 key text not null, bucket bigint not null, count integer not null, expires_at timestamptz not null,
 primary key(key,bucket)
);
create index sessions_expiry on public.comparison_sessions(expires_at);
create index comparisons_created on public.comparisons(created_at);

-- Deny every direct browser operation. Only server-side service_role may access.
alter table public.etfs enable row level security;
alter table public.contacts enable row level security;
alter table public.comparisons enable row level security;
alter table public.consent_records enable row level security;
alter table public.comparison_sessions enable row level security;
alter table public.email_messages enable row level security;
alter table public.webhook_receipts enable row level security;
alter table public.funnel_events enable row level security;
alter table public.rate_limits enable row level security;
revoke all on public.etfs,public.contacts,public.comparisons,public.consent_records,public.comparison_sessions,public.email_messages,public.webhook_receipts,public.funnel_events,public.rate_limits from anon,authenticated;
grant all on public.etfs,public.contacts,public.comparisons,public.consent_records,public.comparison_sessions,public.email_messages,public.webhook_receipts,public.funnel_events,public.rate_limits to service_role;

create function public.consume_rate_limit(p_key text,p_limit integer,p_seconds integer) returns boolean
language plpgsql security definer set search_path = '' as $$
declare used integer; b bigint;
begin
 if p_seconds <= 0 or p_limit <= 0 then return false; end if;
 b := floor(extract(epoch from now()) / p_seconds);
 insert into public.rate_limits(key,bucket,count,expires_at) values(p_key,b,1,now()+make_interval(secs=>p_seconds))
 on conflict(key,bucket) do update set count=public.rate_limits.count+1 returning count into used;
 return used <= p_limit;
end; $$;

create function public.create_comparison(p_id uuid,p_email text,p_tickers text[],p_amount_halere bigint,p_token_hash text,p_marketing boolean,p_text_version text,p_attribution jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare cid uuid; items jsonb; n integer;
begin
 if cardinality(p_tickers) not between 2 and 5 or (select count(distinct t) from unnest(p_tickers) t) <> cardinality(p_tickers) then raise exception 'invalid_selection'; end if;
 select count(*),jsonb_agg(jsonb_build_object('ticker',e.ticker,'name',e.name,'exchange',e.exchange,'index',e.tracked_index,'expenseRatioPercent',e.expense_ratio_percent,'dividends',e.dividends,'description',e.description,'verifiedAt',e.verified_at,'dataAsOf',e.data_as_of,'sources',e.sources) order by array_position(p_tickers,e.ticker))
 into n,items from public.etfs e where e.ticker=any(p_tickers) and e.published and e.verified_at >= now()-interval '14 days';
 if n <> cardinality(p_tickers) then raise exception 'unavailable_etf'; end if;
 insert into public.contacts(email) values(p_email) on conflict(email) do update set email=excluded.email returning id into cid;
 insert into public.comparisons(id,contact_id,tickers,amount_halere,snapshot,token_hash,token_expires_at,attribution) values(p_id,cid,p_tickers,p_amount_halere,items,p_token_hash,now()+interval '7 days',p_attribution);
 insert into public.consent_records(contact_id,comparison_id,marketing_granted,text_version) values(cid,p_id,p_marketing,p_text_version);
 insert into public.email_messages(comparison_id) values(p_id);
 return jsonb_build_object('id',p_id);
end; $$;

create function public.redeem_comparison(p_token_hash text,p_session_hash text) returns uuid
language plpgsql security definer set search_path='' as $$
declare c public.comparisons;
begin
 select * into c from public.comparisons where token_hash=p_token_hash for update;
 if not found or c.confirmed_at is not null or c.token_expires_at <= now() then return null; end if;
 update public.comparisons set confirmed_at=now() where id=c.id;
 insert into public.comparison_sessions(session_hash,comparison_id,expires_at) values(p_session_hash,c.id,now()+interval '30 days');
 if c.attribution is not null then
  insert into public.funnel_events(name,visit_id,campaign,comparison_id) values('email_confirmed',(c.attribution->>'visitId')::uuid,c.attribution->>'campaign',c.id) on conflict do nothing;
 end if;
 return c.id;
end; $$;

create function public.read_comparison(p_session_hash text,p_id uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare c public.comparisons;
begin
 select x.* into c from public.comparisons x join public.comparison_sessions s on s.comparison_id=x.id where s.session_hash=p_session_hash and s.expires_at>now() and x.id=p_id;
 if not found then return null; end if;
 if c.attribution is not null then insert into public.funnel_events(name,visit_id,campaign,comparison_id) values('comparison_opened',(c.attribution->>'visitId')::uuid,c.attribution->>'campaign',c.id) on conflict do nothing; end if;
 return jsonb_build_object('id',c.id,'tickers',c.tickers,'amountCzk',c.amount_halere/100.0,'funds',c.snapshot,'createdAt',c.created_at,'updatedAt',c.updated_at);
end; $$;

create function public.update_comparison(p_session_hash text,p_id uuid,p_tickers text[],p_amount_halere bigint) returns boolean
language plpgsql security definer set search_path='' as $$
declare items jsonb; n integer;
begin
 if not exists(select 1 from public.comparison_sessions where session_hash=p_session_hash and comparison_id=p_id and expires_at>now()) then return false; end if;
 if cardinality(p_tickers) not between 2 and 5 or (select count(distinct t) from unnest(p_tickers) t) <> cardinality(p_tickers) then raise exception 'invalid_selection'; end if;
 select count(*),jsonb_agg(jsonb_build_object('ticker',e.ticker,'name',e.name,'exchange',e.exchange,'index',e.tracked_index,'expenseRatioPercent',e.expense_ratio_percent,'dividends',e.dividends,'description',e.description,'verifiedAt',e.verified_at,'dataAsOf',e.data_as_of,'sources',e.sources) order by array_position(p_tickers,e.ticker)) into n,items from public.etfs e where e.ticker=any(p_tickers) and e.published and e.verified_at >= now()-interval '14 days';
 if n<>cardinality(p_tickers) then raise exception 'unavailable_etf'; end if;
 update public.comparisons set tickers=p_tickers,amount_halere=p_amount_halere,snapshot=items,updated_at=now() where id=p_id;
 return true;
end; $$;

create function public.record_email_webhook(p_event_id text,p_provider_id text,p_type text,p_at timestamptz) returns void
language plpgsql security definer set search_path='' as $$
begin
 insert into public.webhook_receipts(event_id) values(p_event_id) on conflict do nothing;
 if not found then return; end if;
 -- Provider events can arrive before the send HTTP response; defer by rolling back.
 if not exists(select 1 from public.email_messages where provider_id=p_provider_id) then raise exception 'message_not_ready'; end if;
 update public.email_messages set
  delivered_at=case when p_type='email.delivered' then coalesce(delivered_at,p_at) else delivered_at end,
  failed_at=case when p_type in ('email.bounced','email.failed','email.complained') then coalesce(failed_at,p_at) else failed_at end,
  status=case when p_type='email.complained' then 'complained' when p_type='email.bounced' and status<>'complained' then 'bounced' when p_type='email.failed' and status not in ('bounced','complained') then 'failed' when p_type='email.delivered' and status not in ('failed','bounced','complained') then 'delivered' else status end
 where provider_id=p_provider_id;
end; $$;

-- Functions otherwise default to executable by PUBLIC. Explicitly revoke.
revoke all on function public.consume_rate_limit(text,integer,integer),public.create_comparison(uuid,text,text[],bigint,text,boolean,text,jsonb),public.redeem_comparison(text,text),public.read_comparison(text,uuid),public.update_comparison(text,uuid,text[],bigint),public.record_email_webhook(text,text,text,timestamptz) from public,anon,authenticated;
grant execute on function public.consume_rate_limit(text,integer,integer),public.create_comparison(uuid,text,text[],bigint,text,boolean,text,jsonb),public.redeem_comparison(text,text),public.read_comparison(text,uuid),public.update_comparison(text,uuid,text[],bigint),public.record_email_webhook(text,text,text,timestamptz) to service_role;
