-- Use the existing token and RPC. Every valid opening may create a new session;
-- confirmation and its funnel event happen only on the first successful opening.
create or replace function public.redeem_comparison(p_token_hash text,p_session_hash text) returns uuid
language plpgsql security definer set search_path='' as $$
declare c public.comparisons;
begin
 select * into c from public.comparisons where token_hash=p_token_hash for update;
 if not found or c.token_expires_at <= now() then return null; end if;
 if c.confirmed_at is null then
  update public.comparisons set confirmed_at=now() where id=c.id;
  if c.attribution is not null then
   insert into public.funnel_events(name,visit_id,campaign,comparison_id)
   values('email_confirmed',(c.attribution->>'visitId')::uuid,c.attribution->>'campaign',c.id)
   on conflict do nothing;
  end if;
 end if;
 insert into public.comparison_sessions(session_hash,comparison_id,expires_at)
 values(p_session_hash,c.id,now()+interval '30 days');
 return c.id;
end; $$;
revoke all on function public.redeem_comparison(text,text) from public,anon,authenticated;
grant execute on function public.redeem_comparison(text,text) to service_role;

-- New links: fixed maximum 90-day lifetime; the existing data retention still applies.
-- Existing links retain their existing expiration, including revoked/expired links.
create function public.set_comparison_link_expiry() returns trigger
language plpgsql set search_path='' as $$
begin
 new.token_expires_at := new.created_at + interval '90 days';
 return new;
end; $$;
revoke all on function public.set_comparison_link_expiry() from public,anon,authenticated;
grant execute on function public.set_comparison_link_expiry() to service_role;
create trigger comparison_link_expiry before insert on public.comparisons
for each row execute function public.set_comparison_link_expiry();
