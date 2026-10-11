-- Prevent delayed requests from restoring analytics after consent withdrawal.
create table public.analytics_revocations (
 visit_id uuid primary key,
 revoked_at timestamptz not null default now()
);
alter table public.analytics_revocations enable row level security;
revoke all on public.analytics_revocations from anon,authenticated;
grant all on public.analytics_revocations to service_role;
create function public.guard_analytics_revocation() returns trigger
language plpgsql security definer set search_path='' as $$
declare v uuid;
begin
 if tg_table_name='comparisons' then
  if new.attribution is null then return new; end if;
  v=(new.attribution->>'visitId')::uuid;
 else v=new.visit_id; end if;
 if v is null then return new; end if;
 perform pg_advisory_xact_lock(hashtextextended(v::text,42));
 if exists(select 1 from public.analytics_revocations where visit_id=v) then
  if tg_table_name='comparisons' then new.attribution=null; return new; end if;
  return null;
 end if;
 return new;
end $$;
revoke all on function public.guard_analytics_revocation() from public,anon,authenticated;
create trigger reject_revoked_funnel before insert on public.funnel_events
for each row execute function public.guard_analytics_revocation();
create trigger clear_revoked_attribution before insert or update of attribution on public.comparisons
for each row execute function public.guard_analytics_revocation();
create or replace function public.withdraw_analytics(p_visit_id uuid) returns void
language plpgsql security definer set search_path='' as $$
begin
 -- Acquire existing comparison rows before the visit lock (same order as read/redeem).
 update public.comparisons set attribution=null where attribution->>'visitId'=p_visit_id::text;
 perform pg_advisory_xact_lock(hashtextextended(p_visit_id::text,42));
 delete from public.analytics_revocations where revoked_at<now()-interval '90 days';
 insert into public.analytics_revocations(visit_id) values(p_visit_id) on conflict(visit_id) do nothing;
 -- A concurrent new comparison may have committed while we waited for the visit lock.
 update public.comparisons set attribution=null where attribution->>'visitId'=p_visit_id::text;
 delete from public.funnel_events where visit_id=p_visit_id;
end $$;
revoke all on function public.withdraw_analytics(uuid) from public,anon,authenticated;
grant execute on function public.withdraw_analytics(uuid) to service_role;

-- Daily cleanup; execute only through a server-side service role.
create or replace function public.purge_expired_data() returns void
language plpgsql security definer set search_path='' as $$
begin
 delete from public.comparisons where
   (confirmed_at is null and created_at < now()-interval '30 days') or
   (confirmed_at is not null and updated_at < now()-interval '90 days');
 delete from public.contacts c where not exists(select 1 from public.comparisons x where x.contact_id=c.id);
 delete from public.comparison_sessions where expires_at <= now();
 delete from public.rate_limits where expires_at <= now();
 delete from public.webhook_receipts where received_at < now()-interval '90 days';
 delete from public.funnel_events where created_at < now()-interval '90 days';
 delete from public.analytics_revocations where revoked_at<now()-interval '90 days';
end; $$;
revoke all on function public.purge_expired_data() from public,anon,authenticated;
grant execute on function public.purge_expired_data() to service_role;

