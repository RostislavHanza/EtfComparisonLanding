-- Gmail SMTP has no provider delivery webhooks. Retain email_messages and its statuses.
-- Review/apply separately; no CASCADE. Abort on unexpected routine references.
begin;
do $$
declare dependencies text;
begin
 select string_agg(p.oid::regprocedure::text, ', ') into dependencies
 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
 where n.nspname not like 'pg_%' and n.nspname <> 'information_schema'
   and p.oid is distinct from to_regprocedure('public.purge_expired_data()')
   and p.oid is distinct from to_regprocedure('public.record_email_webhook(text,text,text,timestamp with time zone)')
   and (p.prosrc ilike '%webhook_receipts%' or p.prosrc ilike '%record_email_webhook%');
 if dependencies is not null then
   raise exception 'Unexpected email webhook dependencies; review before removal: %', dependencies;
 end if;
end $$;

create or replace function public.purge_expired_data() returns void
language plpgsql security definer set search_path='' as $$
begin
 delete from public.comparisons where
   (confirmed_at is null and created_at < now()-interval '30 days') or
   (confirmed_at is not null and updated_at < now()-interval '90 days');
 delete from public.contacts c where not exists(select 1 from public.comparisons x where x.contact_id=c.id);
 delete from public.comparison_sessions where expires_at <= now();
 delete from public.rate_limits where expires_at <= now();
 delete from public.funnel_events where created_at < now()-interval '90 days';
 delete from public.analytics_revocations where revoked_at<now()-interval '90 days';
end; $$;
revoke all on function public.purge_expired_data() from public,anon,authenticated;
grant execute on function public.purge_expired_data() to service_role;


-- The SMTP migration already removed this exact signature; tolerate its absence.
drop function if exists public.record_email_webhook(text,text,text,timestamptz);
drop table if exists public.webhook_receipts;
commit;
