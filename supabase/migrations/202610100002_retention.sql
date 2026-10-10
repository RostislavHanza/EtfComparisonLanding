-- Daily cleanup; execute only through a server-side service role.
create function public.purge_expired_data() returns void
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
end; $$;
revoke all on function public.purge_expired_data() from public,anon,authenticated;
grant execute on function public.purge_expired_data() to service_role;

-- Withdraw visit-level optional measurement independently of comparison delivery.
create function public.withdraw_analytics(p_visit_id uuid) returns void
language plpgsql security definer set search_path='' as $$
begin
 update public.comparisons set attribution=null where attribution->>'visitId'=p_visit_id::text;
 delete from public.funnel_events where visit_id=p_visit_id;
end; $$;
revoke all on function public.withdraw_analytics(uuid) from public,anon,authenticated;
grant execute on function public.withdraw_analytics(uuid) to service_role;
