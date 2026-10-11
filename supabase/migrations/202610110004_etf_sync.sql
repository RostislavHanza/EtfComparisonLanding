-- Additive only. No catalogue seed or automatic publication.
alter table public.etfs add column tickerinside_sync_enabled boolean not null default false;
create table public.etf_sync_runs (
 id uuid primary key, started_at timestamptz not null default now(), finished_at timestamptz,
 status text not null default 'running' check(status in ('running','ok','partial','failed')),
 result jsonb, failures jsonb not null default '[]'
);
create table public.etf_sync_candidates (
 ticker text primary key check(ticker ~ '^[A-Z0-9.-]{1,10}$'),
 snapshot jsonb not null, checked_at timestamptz not null,
 run_id uuid not null references public.etf_sync_runs(id)
);
create table public.etf_sync_lease (
 singleton boolean primary key default true check(singleton),
 run_id uuid references public.etf_sync_runs(id), lease_until timestamptz, attempt_day date
);
insert into public.etf_sync_lease(singleton) values(true);
alter table public.etf_sync_runs enable row level security;
alter table public.etf_sync_candidates enable row level security;
alter table public.etf_sync_lease enable row level security;
revoke all on public.etf_sync_runs,public.etf_sync_candidates,public.etf_sync_lease from anon,authenticated;
grant all on public.etf_sync_runs,public.etf_sync_candidates,public.etf_sync_lease to service_role;

create function public.begin_etf_sync(p_id uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare l public.etf_sync_lease; today date := (now() at time zone 'UTC')::date;
begin
 select * into l from public.etf_sync_lease where singleton for update;
 if l.lease_until > now() then return jsonb_build_object('state','busy','id',l.run_id); end if;
 if l.run_id is not null then
  update public.etf_sync_runs set status='failed',finished_at=now(),result=jsonb_build_object('state','failed','id',l.run_id),failures='[{"ticker":"*","code":"lease_expired"}]' where id=l.run_id and status='running';
 end if;
 if l.attempt_day=today then return jsonb_build_object('state','already_attempted','id',l.run_id); end if;
 insert into public.etf_sync_runs(id) values(p_id);
 update public.etf_sync_lease set run_id=p_id,lease_until=now()+interval '2 minutes',attempt_day=today where singleton;
 return jsonb_build_object('state','started','id',p_id);
end; $$;

create function public.finish_etf_sync(p_id uuid,p_records jsonb,p_failures jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare l public.etf_sync_lease; run public.etf_sync_runs; v jsonb; n integer := 0; changed integer := 0; affected integer; answer jsonb; state text;
begin
 select * into l from public.etf_sync_lease where singleton for update;
 select * into run from public.etf_sync_runs where id=p_id for update;
 if not found then raise exception 'unknown_sync_run'; end if;
 if run.status <> 'running' then return run.result; end if;
 if l.run_id is distinct from p_id or l.lease_until is null or l.lease_until <= now() then raise exception 'sync_lease_expired'; end if;
 if jsonb_typeof(p_records) is distinct from 'array' or jsonb_typeof(p_failures) is distinct from 'array' or jsonb_array_length(p_records)>20 or jsonb_array_length(p_failures)>21 then raise exception 'invalid_sync_batch'; end if;
 if (select count(distinct x->>'ticker') from jsonb_array_elements(p_records) x) <> jsonb_array_length(p_records) then raise exception 'duplicate_sync_ticker'; end if;
 for v in select value from jsonb_array_elements(p_records) loop
  if coalesce(v->>'ticker','') !~ '^[A-Z0-9.-]{1,10}$' or coalesce(v->>'name','')='' or v->>'exchange' is distinct from 'NYSE Arca' or v->>'license' is distinct from 'CC BY 4.0'
   or jsonb_typeof(v->'expenseRatioPercent') is distinct from 'number' or (v->>'expenseRatioPercent')::numeric not between 0 and 10
   or coalesce(v->>'expenseRatioSource','') not in ('sec_filing','sec_filing_text','market_data')
   or v->>'sourceUrl' is distinct from 'https://tickerinside.com/api/v1/fund/'||lower(v->>'ticker')||'.json'
   or v->>'attributionUrl' is distinct from 'https://tickerinside.com/etf/'||lower(v->>'ticker')||'/'
   or coalesce(v->>'checkedAt','')='' or (v->>'checkedAt')::timestamptz>now() or (v->>'checkedAt')::timestamptz<now()-interval '1 day'
  then raise exception 'invalid_sync_record'; end if;
  if v->>'expenseRatioSource'<>'market_data' and (coalesce(v->>'expenseRatioAsOf','') !~ '^\d{4}-\d{2}-\d{2}$' or (v->>'expenseRatioAsOf')::date>current_date or coalesce(v->>'filingUrl','') !~ '^https://www\.sec\.gov/Archives/edgar/data/[A-Za-z0-9/._-]+$') then raise exception 'invalid_filing_evidence'; end if;
  insert into public.etf_sync_candidates(ticker,snapshot,checked_at,run_id) values(v->>'ticker',v,(v->>'checkedAt')::timestamptz,p_id)
   on conflict(ticker) do update set snapshot=excluded.snapshot,checked_at=excluded.checked_at,run_id=excluded.run_id;
  n := n+1;
  -- Only an explicit operator opt-in on an already reviewed/published fund allows updates.
  -- No new ETF inserts, no name/index/dividend/description edits, no refreshed human verified_at.
  if v->>'expenseRatioSource' in ('sec_filing','sec_filing_text') then
   update public.etfs e set expense_ratio_percent=(v->>'expenseRatioPercent')::numeric,
    sources=(select coalesce(jsonb_agg(s),'[]') from jsonb_array_elements(e.sources) s where s->>'field' is distinct from 'expenseRatioPercent') || jsonb_build_array(jsonb_build_object(
      'field','expenseRatioPercent','url',v->>'attributionUrl','verified_at',v->>'checkedAt','as_of',v->>'expenseRatioAsOf',
      'evidence','TickerInside; CC BY 4.0; automatická validace API, nikoli nová lidská kontrola; nákladovost po případné úlevě; '||(v->>'filingUrl')),
      jsonb_build_object('field','expenseRatioPercent','url',v->>'filingUrl','verified_at',v->>'checkedAt','as_of',v->>'expenseRatioAsOf','evidence','Podklad SEC uvedený TickerInside; dokument nebyl tímto během samostatně čten.'))
    where e.ticker=v->>'ticker' and e.name=v->>'name' and e.exchange='NYSE Arca' and e.published and e.tickerinside_sync_enabled
     and e.verified_at>=now()-interval '14 days' and e.usage_review->>'approved'='true'
     and length(trim(e.tracked_index))>0 and length(trim(e.dividends))>0 and length(trim(e.description))>0
     and (select count(distinct s->>'field') from jsonb_array_elements(e.sources) s where s->>'field' in ('name','exchange','index','expenseRatioPercent','dividends','description'))=6
     and (v->>'expenseRatioAsOf')::date >= (select max((s->>'as_of')::date) from jsonb_array_elements(e.sources) s where s->>'field'='expenseRatioPercent');
   get diagnostics affected = row_count; changed := changed+affected;
  end if;
 end loop;
 state := case when n=0 then 'failed' when jsonb_array_length(p_failures)>0 then 'partial' else 'ok' end;
 answer := jsonb_build_object('state',state,'id',p_id,'candidates',n,'updated',changed,'failed',jsonb_array_length(p_failures));
 update public.etf_sync_runs set status=state,finished_at=now(),result=answer,failures=p_failures where id=p_id;
 update public.etf_sync_lease set lease_until=null where singleton;
 return answer;
end; $$;
revoke all on function public.begin_etf_sync(uuid),public.finish_etf_sync(uuid,jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.begin_etf_sync(uuid),public.finish_etf_sync(uuid,jsonb,jsonb) to service_role;
